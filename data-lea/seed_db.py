"""
把 agoda_daily_metrics.csv 导入 backend/pih.db
建表 + upsert，重复运行安全。
"""
import csv
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from database import get_connection

CSV_PATH = os.path.join(os.path.dirname(__file__), "agoda_daily_metrics.csv")

CREATE_SQL = """
CREATE TABLE IF NOT EXISTS agoda_daily_metrics (
    date             TEXT NOT NULL,
    client_id        TEXT NOT NULL,
    bookings         INTEGER,
    ttv              REAL,
    room_nights      INTEGER,
    avg_order_value  REAL,
    wins             INTEGER,
    opportunities    INTEGER,
    win_rate         REAL,
    pre_error_rate   REAL,
    book_error_rate  REAL,
    PRIMARY KEY (date, client_id)
)
"""

UPSERT_SQL = """
INSERT OR REPLACE INTO agoda_daily_metrics
  (date, client_id, bookings, ttv, room_nights, avg_order_value,
   wins, opportunities, win_rate, pre_error_rate, book_error_rate)
VALUES (?,?,?,?,?,?,?,?,?,?,?)
"""

def seed():
    conn = get_connection()
    conn.execute(CREATE_SQL)

    with open(CSV_PATH, newline="") as f:
        rows = list(csv.DictReader(f))

    conn.executemany(UPSERT_SQL, [
        (r["date"], r["client_id"], int(r["bookings"]), float(r["ttv"]),
         int(r["room_nights"]), float(r["avg_order_value"]),
         int(r["wins"]), int(r["opportunities"]), float(r["win_rate"]),
         float(r["pre_error_rate"]), float(r["book_error_rate"]))
        for r in rows
    ])
    conn.commit()

    count = conn.execute("SELECT COUNT(*) FROM agoda_daily_metrics").fetchone()[0]
    conn.close()
    print(f"完成：agoda_daily_metrics 现有 {count} 行")

if __name__ == "__main__":
    seed()
