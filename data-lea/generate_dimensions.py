"""
生成订单维度细分 CSV（从 agoda_daily_metrics 中的总订单数派生）：
  1. agoda_orders_by_lt.csv      - 提前预订天数（Lead Time）分布
  2. agoda_orders_by_chain.csv   - 酒店类型（连锁 vs 独立）分布
  3. agoda_orders_by_country.csv - 目的地国家分布
  4. agoda_orders_by_star.csv    - 酒店星级（0-5星）分布
"""
import csv, os, sqlite3

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "backend", "pih.db")
OUT_DIR  = os.path.dirname(__file__)

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row

# 每个 Client ID 的总订单量、TTV、间夜数
totals = conn.execute("""
    SELECT client_id,
           SUM(bookings)    AS bookings,
           SUM(ttv)         AS ttv,
           SUM(room_nights) AS room_nights
    FROM agoda_daily_metrics
    GROUP BY client_id
""").fetchall()
conn.close()

# ── 维度基准比例 ────────────────────────────────────────────
LT_BUCKETS = [
    ("0-3天",   0.10),
    ("4-7天",   0.20),
    ("8-14天",  0.31),
    ("15-30天", 0.26),
    ("31+天",   0.13),
]

# LT 对应的 AOV 系数（短提前期价格更贵）
LT_AOV_FACTOR = {
    "0-3天":   1.25,
    "4-7天":   1.05,
    "8-14天":  1.00,
    "15-30天": 0.92,
    "31+天":   0.83,
}

CHAIN_TYPES = [
    ("连锁酒店", 0.55),
    ("独立酒店", 0.45),
]
CHAIN_AOV_FACTOR = {
    "连锁酒店": 1.18,
    "独立酒店": 0.85,
}

COUNTRIES = [
    ("泰国",    0.21),
    ("日本",    0.17),
    ("印尼",    0.13),
    ("新加坡",  0.12),
    ("马来西亚",0.10),
    ("越南",    0.09),
    ("中国",    0.08),
    ("韩国",    0.05),
    ("其他",    0.05),
]

STARS = [
    ("0星", 0.02),
    ("1星", 0.03),
    ("2星", 0.08),
    ("3星", 0.24),
    ("4星", 0.41),
    ("5星", 0.22),
]
# 星级对应 AOV 系数
STAR_AOV_FACTOR = {
    "0星": 0.55, "1星": 0.62, "2星": 0.75,
    "3星": 0.92, "4星": 1.15, "5星": 1.65,
}

def noise(ci, seed, scale=0.06):
    val = ((ci * 13 + seed * 7) % 19 - 9) / 9.0
    return 1.0 + val * scale

CLIENT_LIST = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"]

lt_rows, chain_rows, country_rows, star_rows = [], [], [], []

for row in totals:
    cid  = row["client_id"]
    ci   = CLIENT_LIST.index(cid) if cid in CLIENT_LIST else 0
    total_b  = row["bookings"]
    avg_ttv  = row["ttv"] / max(row["bookings"], 1)
    avg_rn   = row["room_nights"] / max(row["bookings"], 1)

    # ── LT ───────────────────────────────────────
    leftover_b = total_b
    for i, (bucket, pct) in enumerate(LT_BUCKETS):
        n = noise(ci, i + 1)
        b = round(total_b * pct * n) if i < len(LT_BUCKETS) - 1 else leftover_b
        b = max(1, min(b, leftover_b))
        leftover_b -= b
        aov = avg_ttv * LT_AOV_FACTOR[bucket] * noise(ci, i + 10, 0.04)
        lt_rows.append({
            "client_id": cid,
            "lt_bucket": bucket,
            "bookings":  b,
            "ttv":       round(b * aov, 2),
            "room_nights": round(b * avg_rn * noise(ci, i + 20, 0.05)),
        })

    # ── Chain ─────────────────────────────────────
    leftover_b = total_b
    for i, (ctype, pct) in enumerate(CHAIN_TYPES):
        n = noise(ci, i + 30)
        b = round(total_b * pct * n) if i < len(CHAIN_TYPES) - 1 else leftover_b
        b = max(1, min(b, leftover_b))
        leftover_b -= b
        aov = avg_ttv * CHAIN_AOV_FACTOR[ctype] * noise(ci, i + 40, 0.04)
        chain_rows.append({
            "client_id":  cid,
            "chain_type": ctype,
            "bookings":   b,
            "ttv":        round(b * aov, 2),
            "room_nights": round(b * avg_rn * noise(ci, i + 50, 0.05)),
        })

    # ── Country ───────────────────────────────────
    leftover_b = total_b
    for i, (country, pct) in enumerate(COUNTRIES):
        n = noise(ci, i + 60)
        b = round(total_b * pct * n) if i < len(COUNTRIES) - 1 else leftover_b
        b = max(1, min(b, leftover_b))
        leftover_b -= b
        aov = avg_ttv * noise(ci, i + 70, 0.08)
        country_rows.append({
            "client_id":  cid,
            "country":    country,
            "bookings":   b,
            "ttv":        round(b * aov, 2),
            "room_nights": round(b * avg_rn * noise(ci, i + 80, 0.05)),
        })

    # ── Star ──────────────────────────────────────────
    leftover_b = total_b
    for i, (star, pct) in enumerate(STARS):
        n = noise(ci, i + 90)
        b = round(total_b * pct * n) if i < len(STARS) - 1 else leftover_b
        b = max(1, min(b, leftover_b))
        leftover_b -= b
        aov = avg_ttv * STAR_AOV_FACTOR[star] * noise(ci, i + 100, 0.04)
        star_rows.append({
            "client_id":   cid,
            "star_rating": star,
            "bookings":    b,
            "ttv":         round(b * aov, 2),
            "room_nights": round(b * avg_rn * noise(ci, i + 110, 0.05)),
        })

def write_csv(path, rows):
    with open(path, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)
    print(f"生成：{os.path.basename(path)}  ({len(rows)} 行)")

write_csv(os.path.join(OUT_DIR, "agoda_orders_by_lt.csv"),      lt_rows)
write_csv(os.path.join(OUT_DIR, "agoda_orders_by_chain.csv"),   chain_rows)
write_csv(os.path.join(OUT_DIR, "agoda_orders_by_country.csv"), country_rows)
write_csv(os.path.join(OUT_DIR, "agoda_orders_by_star.csv"),    star_rows)
