import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "pih.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_tables():
    conn = get_connection()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            email         TEXT    NOT NULL UNIQUE,
            password_hash TEXT    NOT NULL,
            channel_name  TEXT    NOT NULL,
            contact_name  TEXT    NOT NULL,
            status        TEXT    NOT NULL DEFAULT 'active',
            created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS api_daily_metrics (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            date                 TEXT    NOT NULL,
            channel              TEXT    NOT NULL,
            total_orders         INTEGER NOT NULL DEFAULT 0,
            failed_orders        INTEGER NOT NULL DEFAULT 0,
            total_price_checks   INTEGER NOT NULL DEFAULT 0,
            inaccurate_checks    INTEGER NOT NULL DEFAULT 0,
            UNIQUE(date, channel)
        )
    """)
    conn.commit()
    conn.close()
