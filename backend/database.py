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

    # ── 渠道匹配表 ────────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS channel_mappings (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            dida_hotel_id   INTEGER NOT NULL,
            client_id       TEXT    NOT NULL,
            client_hotel_id TEXT    NOT NULL,
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            UNIQUE(dida_hotel_id, client_id),
            UNIQUE(client_id, client_hotel_id)
        )
    """)

    # ── 渠道热销表 ────────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS channel_hot_sales (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id TEXT    NOT NULL,
            hotel_id   TEXT    NOT NULL,
            country    TEXT    NOT NULL,
            city       TEXT    NOT NULL,
            address    TEXT    NOT NULL,
            updated_at TEXT    NOT NULL DEFAULT (datetime('now')),
            UNIQUE(channel_id, hotel_id)
        )
    """)

    # ── 渠道参数配置表 ────────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS channel_configurations (
            id                    INTEGER PRIMARY KEY AUTOINCREMENT,
            client_id             TEXT    NOT NULL UNIQUE,
            ip_filter_enable      INTEGER NOT NULL DEFAULT 1,
            ip_filter             TEXT    NOT NULL DEFAULT '',
            allowed_currencies    TEXT    NOT NULL DEFAULT 'CNY|USD',
            ignore_cn_price       INTEGER NOT NULL DEFAULT 1,
            max_rooms             INTEGER NOT NULL DEFAULT 4,
            qps                   INTEGER NOT NULL DEFAULT 30,
            pps                   INTEGER NOT NULL DEFAULT 300,
            search_timeout        INTEGER NOT NULL DEFAULT 5,
            verify_timeout        INTEGER NOT NULL DEFAULT 20,
            book_timeout          INTEGER NOT NULL DEFAULT 60,
            max_hotels_per_request INTEGER NOT NULL DEFAULT 100,
            return_audit_data     INTEGER NOT NULL DEFAULT 1,
            updated_at            TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    _seed_dida_contacts(conn)
    _seed_my_contacts(conn)
    _seed_channel_mappings(conn)
    _seed_channel_hot_sales(conn)
    _seed_channel_configurations(conn)
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


def _seed_channel_mappings(conn):
    count = conn.execute("SELECT COUNT(*) FROM channel_mappings").fetchone()[0]
    if count > 0:
        return

    import random, datetime
    rng = random.Random(42)  # deterministic seed

    client_ids = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"]
    prefixes   = ["Grand", "Royal", "Plaza", "Palace", "Hilton", "Marriott", "Hyatt",
                  "Sheraton", "Westin", "InterContinental", "Radisson", "Holiday",
                  "Novotel", "Ibis", "Mercure", "Sofitel", "Pullman", "Crowne"]
    start_date = datetime.date(2024, 1, 1)

    rows = []
    for i in range(1000):
        dida_id         = 10000 + i * 3 + (i % 3)
        client_id       = client_ids[i % len(client_ids)]
        prefix          = prefixes[i % len(prefixes)]
        client_hotel_id = f"{prefix[0]}{str(i + 1).zfill(5)}"
        days            = int(rng.random() * 900)
        updated_at      = (start_date + datetime.timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S")
        rows.append((dida_id, client_id, client_hotel_id, updated_at))

    conn.executemany(
        "INSERT OR IGNORE INTO channel_mappings (dida_hotel_id, client_id, client_hotel_id, updated_at) VALUES (?,?,?,?)",
        rows,
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


def _seed_channel_hot_sales(conn):
    count = conn.execute("SELECT COUNT(*) FROM channel_hot_sales").fetchone()[0]
    if count > 0:
        return

    import random, datetime
    rng = random.Random(99)

    channel_ids = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"]

    # (country, city, address_template)
    locations = [
        ("中国", "北京",   "朝阳区建国路 {} 号"),
        ("中国", "上海",   "浦东新区陆家嘴环路 {} 号"),
        ("中国", "广州",   "天河区天河路 {} 号"),
        ("中国", "成都",   "锦江区春熙路 {} 号"),
        ("中国", "杭州",   "西湖区延安路 {} 号"),
        ("中国", "深圳",   "南山区深南大道 {} 号"),
        ("日本", "东京",   "新宿区歌舞伎町 {}-{}"),
        ("日本", "大阪",   "中央区道顿堀 {} 番地"),
        ("日本", "京都",   "下京区四条通 {} 町"),
        ("泰国", "曼谷",   "Sukhumvit Rd Soi {} Bangkok"),
        ("泰国", "普吉",   "Patong Beach Rd {} Kathu Phuket"),
        ("新加坡", "新加坡", "Orchard Road # {}-{}"),
        ("韩国", "首尔",   "中区明洞 {} 街"),
        ("韩国", "釜山",   "海云台区海水욕场路 {} 号"),
        ("马来西亚", "吉隆坡", "Jalan Bukit Bintang {} KL"),
        ("印度尼西亚", "巴厘岛", "Legian Street No.{} Kuta Bali"),
        ("越南", "胡志明市", "Dong Khoi Street {} District 1"),
        ("越南", "河内",   "Hoan Kiem {} Hanoi"),
        ("澳大利亚", "悉尼",  "{} George Street Sydney NSW"),
        ("阿联酋", "迪拜",  "Sheikh Zayed Road {} Dubai"),
    ]

    start = datetime.date(2026, 4, 1)
    end   = datetime.date(2026, 6, 30)
    span  = (end - start).days

    rows = []
    for i in range(1000):
        channel_id = channel_ids[i % len(channel_ids)]
        loc        = locations[i % len(locations)]
        country, city, addr_tpl = loc
        hotel_id   = f"HID{str(i + 1).zfill(5)}"
        num1       = rng.randint(1, 999)
        num2       = rng.randint(1, 99)
        try:
            address = addr_tpl.format(num1, num2)
        except IndexError:
            address = addr_tpl.format(num1)
        days       = int(rng.random() * span)
        updated_at = (start + datetime.timedelta(days=days)).strftime("%Y-%m-%d")
        rows.append((channel_id, hotel_id, country, city, address, updated_at))

    conn.executemany(
        "INSERT OR IGNORE INTO channel_hot_sales (channel_id, hotel_id, country, city, address, updated_at) VALUES (?,?,?,?,?,?)",
        rows,
    )
    conn.commit()


def _seed_channel_configurations(conn):
    count = conn.execute("SELECT COUNT(*) FROM channel_configurations").fetchone()[0]
    if count > 0:
        return

    rows = [
        # (client_id, ip_filter_enable, ip_filter,
        #  allowed_currencies, ignore_cn_price, max_rooms,
        #  qps, pps, search_timeout, verify_timeout, book_timeout,
        #  max_hotels_per_request, return_audit_data, updated_at)
        ("Agoda",    1, "103.26.118.42|103.26.118.43|202.12.34.56",
         "CNY|USD|EUR|THB", 1, 4, 50,  500, 5, 20, 60, 100, 1, "2026-01-15 10:00:00"),
        ("AgodaUK",  1, "185.76.8.100|185.76.8.101|151.101.0.81",
         "GBP|USD|EUR",     1, 4, 30,  300, 5, 20, 60, 100, 1, "2026-01-20 14:30:00"),
        ("AgodaEBK", 1, "103.26.118.44|103.26.118.45",
         "USD|EUR",         1, 4, 20,  200, 5, 20, 60, 100, 0, "2026-02-01 09:15:00"),
        ("Lvzan",    1, "47.92.33.18|47.92.33.19|120.92.56.78",
         "CNY",             0, 4, 40,  400, 5, 20, 60, 100, 1, "2026-02-10 11:00:00"),
        ("Barli2b",  1, "119.29.52.100|119.29.52.101",
         "CNY|USD",         1, 4, 15,  150, 5, 20, 60,  80, 1, "2026-03-05 16:45:00"),
        ("DidaOpaq", 1, "212.58.242.10|212.58.242.11|195.56.12.43",
         "USD|EUR|GBP",     1, 4, 60,  600, 5, 20, 60, 100, 1, "2026-03-15 10:30:00"),
    ]
    conn.executemany(
        """INSERT OR IGNORE INTO channel_configurations
           (client_id, ip_filter_enable, ip_filter,
            allowed_currencies, ignore_cn_price, max_rooms,
            qps, pps, search_timeout, verify_timeout, book_timeout,
            max_hotels_per_request, return_audit_data, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        rows,
    )
    conn.commit()
