"""
生成查价表和验价表 CSV，与订单表保持漏斗一致：
  查价数 → 有价数 → 验价数 → 准确验价数 → 下单数

查价表字段：
  date, client_id, search_requests, result_count, no_room_count,
  timeout_count, other_error_count, success_rate, avg_response_ms

验价表字段：
  date, client_id, confirm_requests, accurate_count, price_changed_count,
  expired_count, other_error_count, accurate_rate, avg_price_change_pct

  accurate_count = 价格完全一致的验价（confirm_requests - price_changed - expired - other_error）
"""
import csv
import os
import sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "pih.db")
OUT_DIR  = os.path.dirname(__file__)

# 读取已有订单表作为漏斗基准
conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
orders = conn.execute(
    "SELECT date, client_id, bookings FROM agoda_daily_metrics ORDER BY date, client_id"
).fetchall()
conn.close()

# 各 Client ID 差异化参数
CLIENT_PARAMS = {
    "Agoda":     {"resp_ms": 380, "no_room": 0.12, "timeout": 0.04, "price_chg": 0.08},
    "AgodaUK":   {"resp_ms": 420, "no_room": 0.10, "timeout": 0.03, "price_chg": 0.07},
    "AgodaEBK":  {"resp_ms": 350, "no_room": 0.15, "timeout": 0.05, "price_chg": 0.10},
    "Lvzan":     {"resp_ms": 460, "no_room": 0.18, "timeout": 0.06, "price_chg": 0.12},
    "Barli2b":   {"resp_ms": 510, "no_room": 0.20, "timeout": 0.07, "price_chg": 0.13},
    "DidaOpaq":  {"resp_ms": 490, "no_room": 0.22, "timeout": 0.08, "price_chg": 0.15},
}

def noise(day_idx, ci, scale=0.10):
    val = ((day_idx * 11 + ci * 7) % 19 - 9) / 9.0
    return 1.0 + val * scale

search_rows  = []
confirm_rows = []

client_list = list(CLIENT_PARAMS.keys())

for row in orders:
    d       = row["date"]
    cid     = row["client_id"]
    bookings = row["bookings"]
    ci      = client_list.index(cid)
    day_idx = int(d.replace("-", "")) % 97  # deterministic index
    p = CLIENT_PARAMS[cid]
    n = lambda offset: noise(day_idx, ci + offset)

    # ── 验价表 ──────────────────────────────────────────
    confirm_requests  = max(1, round(bookings / 0.32 * n(1)))
    price_changed     = round(confirm_requests * p["price_chg"] * n(2))
    expired           = max(0, round(confirm_requests * 0.02 * n(3)))
    other_err_c       = max(0, round(confirm_requests * 0.01 * n(4)))
    accurate_c        = max(1, confirm_requests - price_changed - expired - other_err_c)
    accurate_rate_c   = round(accurate_c / confirm_requests * 100, 2)
    avg_price_chg_pct = round(p["price_chg"] * 100 * n(5) * 0.8, 2) if price_changed > 0 else 0.0

    confirm_rows.append({
        "date":                d,
        "client_id":           cid,
        "confirm_requests":    confirm_requests,
        "accurate_count":      accurate_c,
        "price_changed_count": price_changed,
        "expired_count":       expired,
        "other_error_count":   other_err_c,
        "accurate_rate":       accurate_rate_c,
        "avg_price_change_pct":avg_price_chg_pct,
    })

    # ── 查价表 ──────────────────────────────────────────
    search_requests = max(1, round(confirm_requests / 0.30 * n(6)))
    no_room         = round(search_requests * p["no_room"] * n(7))
    timeout         = round(search_requests * p["timeout"] * n(8))
    other_err_s     = max(0, round(search_requests * 0.02 * n(9)))
    result_count    = max(1, search_requests - no_room - timeout - other_err_s)
    success_rate_s  = round(result_count / search_requests * 100, 2)
    avg_resp_ms     = round(p["resp_ms"] * n(10))

    search_rows.append({
        "date":              d,
        "client_id":         cid,
        "search_requests":   search_requests,
        "result_count":      result_count,
        "no_room_count":     no_room,
        "timeout_count":     timeout,
        "other_error_count": other_err_s,
        "success_rate":      success_rate_s,
        "avg_response_ms":   avg_resp_ms,
    })

def write_csv(path, rows):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"生成：{os.path.basename(path)}  ({len(rows)} 行)")

write_csv(os.path.join(OUT_DIR, "agoda_price_search.csv"),  search_rows)
write_csv(os.path.join(OUT_DIR, "agoda_price_confirm.csv"), confirm_rows)

# 校验漏斗
total_search  = sum(r["search_requests"]  for r in search_rows)
total_confirm = sum(r["confirm_requests"] for r in confirm_rows)
total_booking = sum(row["bookings"] for row in orders)
total_result  = sum(r["result_count"]      for r in search_rows)
total_accurate= sum(r["accurate_count"]    for r in confirm_rows)
print(f"\n漏斗校验（全部 Client ID 合计）：")
print(f"  查价数：    {total_search:>8,}")
print(f"  有价数：    {total_result:>8,}  (有价率     {total_result/total_search*100:.1f}%)")
print(f"  验价数：    {total_confirm:>8,}  (查价→验价  {total_confirm/total_search*100:.1f}%)")
print(f"  准确验价数：{total_accurate:>8,}  (准确率     {total_accurate/total_confirm*100:.1f}%)")
print(f"  下单数：    {total_booking:>8,}  (验价→下单  {total_booking/total_confirm*100:.1f}%)")
