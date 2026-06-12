import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "pih.db")


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_tables():
    conn = get_connection()

    # ── 用户表 ──────────────────────────────────────────────────
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

    # ── Dida 联系方式（只读，系统预置） ───────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dida_contacts (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            category     TEXT NOT NULL,
            title        TEXT NOT NULL,
            subtitle     TEXT NOT NULL,
            icon_key     TEXT NOT NULL,
            color        TEXT NOT NULL,
            bg_color     TEXT NOT NULL,
            sort_order   INTEGER NOT NULL DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS dida_contact_fields (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            contact_id INTEGER NOT NULL REFERENCES dida_contacts(id),
            label      TEXT NOT NULL,
            value      TEXT NOT NULL,
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)

    # ── 我方对接人（可编辑） ───────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS my_contacts (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            type       TEXT NOT NULL CHECK(type IN ('ops','biz')),
            name       TEXT NOT NULL DEFAULT '',
            role       TEXT NOT NULL DEFAULT '',
            email      TEXT NOT NULL DEFAULT '',
            phone      TEXT NOT NULL DEFAULT '',
            wechat     TEXT NOT NULL DEFAULT '',
            sort_order INTEGER NOT NULL DEFAULT 0
        )
    """)

    conn.commit()
    _seed_dida_contacts(conn)
    _seed_my_contacts(conn)
    conn.close()


def _seed_dida_contacts(conn):
    count = conn.execute("SELECT COUNT(*) FROM dida_contacts").fetchone()[0]
    if count > 0:
        return

    rows = [
        ("客户经理", "专属合作伙伴支持", "MessageCircle", "#4f5fb8", "#eef1ff", 1,
         [("团队", "Dida 客户成功团队"), ("邮箱", "partner-success@dida.travel"), ("响应时间", "工作日 24 小时内")]),
        ("技术支持", "API 集成与技术问题", "Phone", "#ea0345", "#fff0f5", 2,
         [("邮箱", "techsupport@dida.com"), ("紧急热线", "+86 400-119-9777"), ("服务时间", "7×24 小时")]),
        ("商务合作", "渠道拓展与合作意向", "Mail", "#16a34a", "#f0fff4", 3,
         [("邮箱", "bd@dida.travel"), ("响应时间", "工作日 48 小时内")]),
        ("财务结算", "账单与信用额度", "Users", "#d97706", "#fffbeb", 4,
         [("邮箱", "finance@dida.travel"), ("响应时间", "工作日 48 小时内")]),
    ]
    for title, subtitle, icon_key, color, bg_color, sort_order, fields in rows:
        cur = conn.execute(
            "INSERT INTO dida_contacts (category, title, subtitle, icon_key, color, bg_color, sort_order) VALUES (?,?,?,?,?,?,?)",
            ("dida", title, subtitle, icon_key, color, bg_color, sort_order),
        )
        cid = cur.lastrowid
        for i, (label, value) in enumerate(fields):
            conn.execute(
                "INSERT INTO dida_contact_fields (contact_id, label, value, sort_order) VALUES (?,?,?,?)",
                (cid, label, value, i),
            )
    conn.commit()


def _seed_my_contacts(conn):
    count = conn.execute("SELECT COUNT(*) FROM my_contacts").fetchone()[0]
    if count > 0:
        return

    defaults = [
        ("ops", "张伟", "运营负责人",   "zhangwei@agoda.com",   "+86 138-0001-0001", "zhangwei_ops",  0),
        ("ops", "李娜", "运营经理",     "lina@agoda.com",       "+86 138-0001-0002", "lina_agoda",    1),
        ("biz", "王磊", "商务负责人",   "wanglei@agoda.com",    "+86 139-0002-0001", "wanglei_biz",   0),
        ("biz", "刘洋", "商务经理",     "liuyang@agoda.com",    "+86 139-0002-0002", "liuyang_agoda", 1),
    ]
    for row in defaults:
        conn.execute(
            "INSERT INTO my_contacts (type, name, role, email, phone, wechat, sort_order) VALUES (?,?,?,?,?,?,?)",
            row,
        )
    conn.commit()
