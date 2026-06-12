"""
把查价表和验价表 CSV 导入 pih.db。重复运行安全（UPSERT）。
"""
import csv, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from database import get_connection

DIR = os.path.dirname(__file__)

TABLES = [
    {
        "csv":   "agoda_price_search.csv",
        "table": "agoda_price_search",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_price_search (
                date              TEXT NOT NULL,
                client_id         TEXT NOT NULL,
                search_requests   INTEGER,
                result_count      INTEGER,
                no_room_count     INTEGER,
                timeout_count     INTEGER,
                other_error_count INTEGER,
                success_rate      REAL,
                avg_response_ms   INTEGER,
                PRIMARY KEY (date, client_id)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_price_search
              (date, client_id, search_requests, result_count, no_room_count,
               timeout_count, other_error_count, success_rate, avg_response_ms)
            VALUES (?,?,?,?,?,?,?,?,?)""",
        "cast": lambda r: (
            r["date"], r["client_id"], int(r["search_requests"]),
            int(r["result_count"]), int(r["no_room_count"]),
            int(r["timeout_count"]), int(r["other_error_count"]),
            float(r["success_rate"]), int(r["avg_response_ms"]),
        ),
    },
    {
        "csv":   "agoda_price_confirm.csv",
        "table": "agoda_price_confirm",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_price_confirm (
                date                 TEXT NOT NULL,
                client_id            TEXT NOT NULL,
                confirm_requests     INTEGER,
                success_count        INTEGER,
                price_changed_count  INTEGER,
                expired_count        INTEGER,
                other_error_count    INTEGER,
                success_rate         REAL,
                avg_price_change_pct REAL,
                PRIMARY KEY (date, client_id)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_price_confirm
              (date, client_id, confirm_requests, success_count, price_changed_count,
               expired_count, other_error_count, success_rate, avg_price_change_pct)
            VALUES (?,?,?,?,?,?,?,?,?)""",
        "cast": lambda r: (
            r["date"], r["client_id"], int(r["confirm_requests"]),
            int(r["success_count"]), int(r["price_changed_count"]),
            int(r["expired_count"]), int(r["other_error_count"]),
            float(r["success_rate"]), float(r["avg_price_change_pct"]),
        ),
    },
]

def seed():
    conn = get_connection()
    for t in TABLES:
        conn.execute(t["ddl"])
        with open(os.path.join(DIR, t["csv"]), newline="") as f:
            rows = list(csv.DictReader(f))
        conn.executemany(t["upsert"], [t["cast"](r) for r in rows])
        conn.commit()
        count = conn.execute(f"SELECT COUNT(*) FROM {t['table']}").fetchone()[0]
        print(f"{t['table']:30s} → {count} 行")
    conn.close()

    # 漏斗汇总验证
    conn = get_connection()
    result = conn.execute("""
        SELECT
          (SELECT SUM(search_requests)  FROM agoda_price_search)  AS searches,
          (SELECT SUM(confirm_requests) FROM agoda_price_confirm) AS confirms,
          (SELECT SUM(bookings)         FROM agoda_daily_metrics) AS bookings
    """).fetchone()
    conn.close()
    print(f"\n漏斗：查价 {result[0]:,} → 验价 {result[1]:,} → 订单 {result[2]:,}")

if __name__ == "__main__":
    seed()
