"""
把三张维度细分表导入 pih.db（幂等）。
"""
import csv, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))
from database import get_connection

DIR = os.path.dirname(__file__)

TABLES = [
    {
        "csv": "agoda_orders_by_lt.csv",
        "table": "agoda_orders_by_lt",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_orders_by_lt (
                client_id   TEXT NOT NULL,
                lt_bucket   TEXT NOT NULL,
                bookings    INTEGER,
                ttv         REAL,
                room_nights INTEGER,
                PRIMARY KEY (client_id, lt_bucket)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_orders_by_lt
              (client_id, lt_bucket, bookings, ttv, room_nights)
            VALUES (?,?,?,?,?)""",
        "cast": lambda r: (r["client_id"], r["lt_bucket"],
                           int(r["bookings"]), float(r["ttv"]), int(r["room_nights"])),
    },
    {
        "csv": "agoda_orders_by_chain.csv",
        "table": "agoda_orders_by_chain",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_orders_by_chain (
                client_id   TEXT NOT NULL,
                chain_type  TEXT NOT NULL,
                bookings    INTEGER,
                ttv         REAL,
                room_nights INTEGER,
                PRIMARY KEY (client_id, chain_type)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_orders_by_chain
              (client_id, chain_type, bookings, ttv, room_nights)
            VALUES (?,?,?,?,?)""",
        "cast": lambda r: (r["client_id"], r["chain_type"],
                           int(r["bookings"]), float(r["ttv"]), int(r["room_nights"])),
    },
    {
        "csv": "agoda_orders_by_country.csv",
        "table": "agoda_orders_by_country",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_orders_by_country (
                client_id   TEXT NOT NULL,
                country     TEXT NOT NULL,
                bookings    INTEGER,
                ttv         REAL,
                room_nights INTEGER,
                PRIMARY KEY (client_id, country)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_orders_by_country
              (client_id, country, bookings, ttv, room_nights)
            VALUES (?,?,?,?,?)""",
        "cast": lambda r: (r["client_id"], r["country"],
                           int(r["bookings"]), float(r["ttv"]), int(r["room_nights"])),
    },
    {
        "csv": "agoda_orders_by_star.csv",
        "table": "agoda_orders_by_star",
        "ddl": """
            CREATE TABLE IF NOT EXISTS agoda_orders_by_star (
                client_id   TEXT NOT NULL,
                star_rating TEXT NOT NULL,
                bookings    INTEGER,
                ttv         REAL,
                room_nights INTEGER,
                PRIMARY KEY (client_id, star_rating)
            )""",
        "upsert": """
            INSERT OR REPLACE INTO agoda_orders_by_star
              (client_id, star_rating, bookings, ttv, room_nights)
            VALUES (?,?,?,?,?)""",
        "cast": lambda r: (r["client_id"], r["star_rating"],
                           int(r["bookings"]), float(r["ttv"]), int(r["room_nights"])),
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
        print(f"{t['table']:35s} → {count} 行")
    conn.close()

if __name__ == "__main__":
    seed()
