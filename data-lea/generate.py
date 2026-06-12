"""
生成 Agoda 近30天每日指标数据，输出到 agoda_daily_metrics.csv
日期范围：2026-05-13 ~ 2026-06-11（30天）
Client ID：Agoda, AgodaUK, AgodaEBK, Lvzan, Barli2b, DidaOpaq
"""
import csv
from datetime import date, timedelta

# 6个 Client ID 及其流量权重
CLIENTS = [
    ("Agoda",     0.38),
    ("AgodaUK",   0.24),
    ("AgodaEBK",  0.16),
    ("Lvzan",     0.11),
    ("Barli2b",   0.07),
    ("DidaOpaq",  0.04),
]

# 30天基准日订单量（加入节假日/周末波动）
DAILY_BASE_BOOKINGS = [
    390, 405, 336, 350, 340, 260, 258,  # May 13-19
    356, 380, 360, 330, 270, 275, 300,  # May 20-26
    335, 350, 430, 345, 320, 330, 420,  # May 27-Jun 2
    460, 485, 490, 360, 292, 305, 390,  # Jun 3-9
    360, 340,                            # Jun 10-11
]

# 各 Client ID 的差异化参数（均价、胜出率基准、错误率基准）
CLIENT_PARAMS = {
    "Agoda":     {"avg_order": 345, "win_base": 3.5, "pre_err": 7.2, "book_err": 5.8},
    "AgodaUK":   {"avg_order": 412, "win_base": 3.0, "pre_err": 6.8, "book_err": 5.2},
    "AgodaEBK":  {"avg_order": 298, "win_base": 2.3, "pre_err": 8.1, "book_err": 6.4},
    "Lvzan":     {"avg_order": 265, "win_base": 2.5, "pre_err": 7.9, "book_err": 6.1},
    "Barli2b":   {"avg_order": 310, "win_base": 2.1, "pre_err": 8.5, "book_err": 6.8},
    "DidaOpaq":  {"avg_order": 280, "win_base": 2.0, "pre_err": 9.2, "book_err": 7.3},
}

# 简单确定性"噪声"（用日期序号+client索引，避免 random）
def noise(day_idx, client_idx, scale=1.0):
    val = ((day_idx * 7 + client_idx * 13) % 17 - 8) / 8.0
    return 1.0 + val * scale * 0.12

start = date(2026, 5, 13)
rows = []
for day_idx in range(30):
    d = start + timedelta(days=day_idx)
    base = DAILY_BASE_BOOKINGS[day_idx]
    for ci, (client_id, weight) in enumerate(CLIENTS):
        p = CLIENT_PARAMS[client_id]
        n = noise(day_idx, ci)

        bookings     = max(1, round(base * weight * n))
        avg_order    = round(p["avg_order"] * noise(day_idx, ci + 1, 0.6), 2)
        ttv          = round(bookings * avg_order, 2)
        room_nights  = round(bookings * 2.1 * noise(day_idx, ci + 2, 0.4))
        win_rate     = round(p["win_base"] * noise(day_idx, ci + 3, 0.5), 4)
        opportunities = max(bookings, round(bookings / (win_rate / 100)))
        wins         = round(opportunities * win_rate / 100)
        pre_err_rate = round(p["pre_err"] * noise(day_idx, ci + 4, 0.5), 4)
        book_err_rate= round(p["book_err"] * noise(day_idx, ci + 5, 0.5), 4)

        rows.append({
            "date":           d.isoformat(),
            "client_id":      client_id,
            "bookings":       bookings,
            "ttv":            ttv,
            "room_nights":    room_nights,
            "avg_order_value":avg_order,
            "wins":           wins,
            "opportunities":  opportunities,
            "win_rate":       win_rate,
            "pre_error_rate": pre_err_rate,
            "book_error_rate":book_err_rate,
        })

out_path = "agoda_daily_metrics.csv"
fields = list(rows[0].keys())
with open(out_path, "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

print(f"生成完成：{len(rows)} 行 → {out_path}")

# 简单校验
total_bookings = sum(r["bookings"] for r in rows)
total_ttv = sum(r["ttv"] for r in rows)
print(f"汇总：总订单={total_bookings:,}  总TTV=${total_ttv:,.0f}")
for client_id, _ in CLIENTS:
    sub = [r for r in rows if r["client_id"] == client_id]
    print(f"  {client_id:12s} 订单={sum(r['bookings'] for r in sub):5,}  "
          f"TTV=${sum(r['ttv'] for r in sub):>10,.0f}  "
          f"胜出率={sum(r['win_rate'] for r in sub)/len(sub):.2f}%")
