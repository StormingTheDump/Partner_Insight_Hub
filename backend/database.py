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

    # ── 转化指标每日数据表 ────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS conversion_daily_metrics (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            date       TEXT    NOT NULL,
            channel    TEXT    NOT NULL,
            look       INTEGER NOT NULL DEFAULT 0,
            property   INTEGER NOT NULL DEFAULT 0,
            avail_look INTEGER NOT NULL DEFAULT 0,
            prebook    INTEGER NOT NULL DEFAULT 0,
            book       INTEGER NOT NULL DEFAULT 0,
            UNIQUE(date, channel)
        )
    """)

    # ── 验价报错日志 ──────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS prebook_error_logs (
            id                   INTEGER PRIMARY KEY AUTOINCREMENT,
            log_time             TEXT    NOT NULL,
            client_id            TEXT    NOT NULL,
            dida_rate_plan_id    TEXT,
            dida_hotel_id        INTEGER,
            error_type           TEXT    NOT NULL,
            rate_record_channel  TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_pre_client ON prebook_error_logs(client_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_pre_error  ON prebook_error_logs(error_type)")

    # ── 下单报错日志 ──────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS book_error_logs (
            id                      INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_createtime      TEXT    NOT NULL,
            client_id               TEXT    NOT NULL,
            channel_bookingnumber   TEXT,
            dida_hotel_id           INTEGER,
            error_type              TEXT    NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_book_client ON book_error_logs(client_id)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_book_error  ON book_error_logs(error_type)")

    # ── 订单日志表 ────────────────────────────────────────────────
    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_logs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            order_no     TEXT    NOT NULL,
            client_id    TEXT    NOT NULL,
            order_status TEXT    NOT NULL,
            log_type     TEXT    NOT NULL,
            log_detail   TEXT    NOT NULL,
            updated_at   TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    _seed_dida_contacts(conn)
    _seed_my_contacts(conn)
    _seed_channel_mappings(conn)
    _seed_channel_hot_sales(conn)
    _seed_channel_configurations(conn)
    _seed_order_logs(conn)
    _seed_conversion_metrics(conn)
    _seed_error_logs(conn)
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


def _seed_order_logs(conn):
    count = conn.execute("SELECT COUNT(*) FROM order_logs").fetchone()[0]
    if count > 0:
        return

    import random, datetime, json as _json
    rng = random.Random(88)

    client_ids  = ["Agoda", "AgodaUK", "AgodaEBK", "Lvzan", "Barli2b", "DidaOpaq"]
    currencies  = {"Agoda": "USD", "AgodaUK": "GBP", "AgodaEBK": "USD",
                   "Lvzan": "CNY", "Barli2b": "USD", "DidaOpaq": "EUR"}
    hotels = [
        ("HID00023", "Grand Hyatt Tokyo"),
        ("HID00056", "Marriott Bangkok"),
        ("HID00089", "Hilton Singapore"),
        ("HID00112", "Sofitel Paris"),
        ("HID00145", "InterContinental Dubai"),
        ("HID00178", "Sheraton Sydney"),
        ("HID00211", "Westin Seoul"),
        ("HID00244", "Hyatt Regency Kuala Lumpur"),
        ("HID00277", "Novotel Ho Chi Minh City"),
        ("HID00310", "Crowne Plaza Beijing"),
        ("HID00343", "Radisson Blu Bali"),
        ("HID00376", "Holiday Inn Shanghai"),
    ]
    room_types = ["Deluxe Double Room", "Superior King Room", "Deluxe Twin Room",
                  "Executive Suite", "Standard Room", "Club Room"]
    rate_plans  = ["RP-STD", "RP-BRF", "RP-NRF", "RP-AAA", "RP-COR", "RP-PKG"]
    first_names = ["John", "Emma", "Michael", "Sarah", "David", "Lisa",
                   "James", "Wei", "Li", "Hiroshi", "Yuki", "Mia"]
    last_names  = ["Smith", "Johnson", "Williams", "Brown", "Jones",
                   "Garcia", "Wang", "Zhang", "Tanaka", "Kim", "Lee"]
    cancel_reasons = ["Guest request", "Schedule change", "Force majeure",
                      "Double booking", "Price dispute"]
    error_codes = [("3015", "Availability Or Price Invalid"),
                   ("3001", "Incorrect Booking Information"),
                   ("3016", "Failed To Confirm Booking"),
                   ("3014", "Not Enough Credit")]
    px = {"USD": 1.0, "GBP": 0.79, "CNY": 7.2, "EUR": 0.92}

    rows = []
    for seq in range(1, 101):
        order_no   = f"ORD2026{seq:05d}"
        client_id  = client_ids[seq % len(client_ids)]
        hotel_id, hotel_name = hotels[seq % len(hotels)]
        room_type  = room_types[seq % len(room_types)]
        rate_plan  = rate_plans[seq % len(rate_plans)]
        currency   = currencies[client_id]

        # booking creation time
        day_offset = rng.randint(0, 150)
        base_ts = (datetime.datetime(2026, 1, 1,
                                     rng.randint(8, 22), rng.randint(0, 59), rng.randint(0, 59))
                   + datetime.timedelta(days=day_offset))
        checkin = base_ts.date() + datetime.timedelta(days=rng.randint(14, 90))
        nights  = rng.randint(1, 7)
        checkout = checkin + datetime.timedelta(days=nights)

        base_price    = round(rng.uniform(80, 600), 2)
        total_price   = round(base_price * px[currency] * nights, 2)

        fn = first_names[rng.randint(0, len(first_names) - 1)]
        ln = last_names[rng.randint(0, len(last_names) - 1)]

        booking_ref = f"DIDAREF-{base_ts.strftime('%Y%m%d')}-{seq:05d}"
        client_ref  = f"{client_id[:4].upper()}-{base_ts.strftime('%Y%m%d')}-{seq:05d}"
        pc_ts = base_ts
        bc_ts = base_ts + datetime.timedelta(seconds=rng.randint(5, 60))

        # status distribution: 50 confirmed / 30 cancelled / 20 failed
        if seq <= 50:
            order_status = "confirmed"
        elif seq <= 80:
            order_status = "cancelled"
        else:
            order_status = "failed"

        # ── PriceConfirm ─────────────────────────────────────────
        pc_req = {
            "Header": {"ClientID": client_id, "LicenseKey": "***"},
            "HotelPriceConfirmRequest": {
                "RequestID": f"REQ-PCFM-{seq:06d}",
                "RateKey": f"RK_{hotel_id}_{rate_plan}_{checkin.strftime('%Y%m%d')}_{checkout.strftime('%Y%m%d')}",
                "CheckIn": checkin.strftime("%Y-%m-%d"),
                "CheckOut": checkout.strftime("%Y-%m-%d"),
                "RoomCount": 1,
                "AdultCount": 2,
                "Currency": currency,
            },
        }
        pc_resp = {
            "Header": {"ClientID": client_id, "RequestID": f"REQ-PCFM-{seq:06d}"},
            "HotelPriceConfirmResponse": {
                "BookingReference": booking_ref,
                "HotelID": hotel_id,
                "HotelName": hotel_name,
                "CheckIn": checkin.strftime("%Y-%m-%d"),
                "CheckOut": checkout.strftime("%Y-%m-%d"),
                "Nights": nights,
                "RoomType": room_type,
                "RatePlanID": rate_plan,
                "Currency": currency,
                "TotalPrice": total_price,
                "Remarks": "Non-refundable" if "NRF" in rate_plan else "Free cancellation",
                "Status": "Success",
            },
        }
        rows.append((order_no, client_id, order_status, "price_confirm",
                     _json.dumps({"request": pc_req, "response": pc_resp}, ensure_ascii=False),
                     pc_ts.strftime("%Y-%m-%d %H:%M:%S")))

        # ── BookingConfirm ────────────────────────────────────────
        bc_req = {
            "Header": {"ClientID": client_id, "LicenseKey": "***"},
            "HotelBookingConfirmRequest": {
                "RequestID": f"REQ-BKCF-{seq:06d}",
                "BookingReference": booking_ref,
                "ClientReference": client_ref,
                "CheckIn": checkin.strftime("%Y-%m-%d"),
                "CheckOut": checkout.strftime("%Y-%m-%d"),
                "HotelID": hotel_id,
                "RatePlanID": rate_plan,
                "RoomCount": 1,
                "Rooms": [{"Index": 1,
                            "Adults": [{"FirstName": fn, "LastName": ln}],
                            "Children": []}],
                "ContactInfo": {
                    "Name": f"{fn} {ln}",
                    "Email": f"{fn.lower()}.{ln.lower()}@example.com",
                    "Phone": f"+{rng.randint(1, 99)}-{rng.randint(100, 999)}-{rng.randint(1000, 9999)}",
                },
            },
        }
        if order_status in ("confirmed", "cancelled"):
            bc_body = {"BookingID": order_no, "Status": 2, "StatusDesc": "Confirmed",
                       "ConfirmationCode": f"HTL-CONF-{seq:05d}",
                       "HotelID": hotel_id, "HotelName": hotel_name,
                       "CheckIn": checkin.strftime("%Y-%m-%d"),
                       "CheckOut": checkout.strftime("%Y-%m-%d"),
                       "Nights": nights, "RoomCount": 1,
                       "TotalPrice": total_price, "Currency": currency}
        else:
            ec, em = error_codes[seq % len(error_codes)]
            bc_body = {"BookingID": order_no, "Status": 4, "StatusDesc": "Failed",
                       "ErrorCode": ec, "ErrorMessage": em,
                       "HotelID": hotel_id, "TotalPrice": total_price, "Currency": currency}
        bc_resp = {
            "Header": {"ClientID": client_id, "RequestID": f"REQ-BKCF-{seq:06d}"},
            "HotelBookingConfirmResponse": bc_body,
        }
        rows.append((order_no, client_id, order_status, "booking_confirm",
                     _json.dumps({"request": bc_req, "response": bc_resp}, ensure_ascii=False),
                     bc_ts.strftime("%Y-%m-%d %H:%M:%S")))

        # ── Cancel (cancelled orders only) ────────────────────────
        if order_status == "cancelled":
            cancel_ts = bc_ts + datetime.timedelta(
                days=rng.randint(1, 14), seconds=rng.randint(0, 86400))
            reason = cancel_reasons[rng.randint(0, len(cancel_reasons) - 1)]
            cncl_req = {
                "Header": {"ClientID": client_id, "LicenseKey": "***"},
                "HotelBookingCancelRequest": {
                    "RequestID": f"REQ-CNCL-{seq:06d}",
                    "BookingID": order_no,
                    "Reason": reason,
                },
            }
            cncl_resp = {
                "Header": {"ClientID": client_id, "RequestID": f"REQ-CNCL-{seq:06d}"},
                "HotelBookingCancelResponse": {
                    "BookingID": order_no,
                    "Status": 3,
                    "StatusDesc": "Canceled",
                    "CancelConfirmID": f"CC-{cancel_ts.strftime('%Y%m%d%H%M')}-{seq:05d}",
                    "CancelTime": cancel_ts.strftime("%Y-%m-%d %H:%M:%S"),
                    "RefundAmount": total_price,
                    "Currency": currency,
                },
            }
            rows.append((order_no, client_id, order_status, "cancel",
                         _json.dumps({"request": cncl_req, "response": cncl_resp}, ensure_ascii=False),
                         cancel_ts.strftime("%Y-%m-%d %H:%M:%S")))

    conn.executemany(
        "INSERT INTO order_logs (order_no, client_id, order_status, log_type, log_detail, updated_at)"
        " VALUES (?,?,?,?,?,?)",
        rows,
    )
    conn.commit()


def _seed_conversion_metrics(conn):
    count = conn.execute("SELECT COUNT(*) FROM conversion_daily_metrics").fetchone()[0]
    if count > 0:
        return

    import math
    from datetime import date, timedelta

    START = date(2026, 5, 12)
    DATES = [(START + timedelta(days=i)).isoformat() for i in range(30)]

    # 每渠道基础参数：(look, property, avail_look, prebook, book)
    # 设计目标：
    #   Agoda/AgodaEBK        → 全部合格
    #   AgodaUK               → L2C 不合格（avail_look/prebook > 500）
    #   Lvzan                 → C2B 不合格（prebook/book > 500）
    #   DidaOpaq              → L2B & P2B 不合格（大量查询极少下单）
    #   Barli2b               → C2B 严重不合格
    CHANNELS = ["Agoda", "AgodaEBK", "AgodaUK", "Lvzan", "DidaOpaq", "Barli2b"]
    BASE = {
        #              look        property    avail_look  prebook  book
        "Agoda":    (1_000_000,  4_200_000,   660_000,   3_000,   280),
        "AgodaEBK": (  520_000,  2_100_000,   320_000,   1_500,   105),
        "AgodaUK":  (  700_000,  3_000_000,   210_000,     360,    80),  # L2C = 210000/360 ≈ 583 不合格
        "Lvzan":    (  300_000,  1_500_000,   190_000,   2_200,     4),  # C2B = 2200/4 = 550 不合格
        "DidaOpaq": (2_400_000, 12_500_000,   400_000,     820,     6),  # L2B=400000, P2B=2083333 不合格
        "Barli2b":  (   80_000,    520_000,    28_000,   3_200,     4),  # C2B = 800 不合格
    }
    PHASES = {"Agoda": 0.0, "AgodaEBK": 2.1, "AgodaUK": 4.3,
              "Lvzan": 1.5, "DidaOpaq": 3.7, "Barli2b": 5.2}

    rows = []
    for i, d in enumerate(DATES):
        for ch in CHANNELS:
            ph = PHASES[ch]
            # 每渠道独立波动 ±8%
            jitter = 1.0 + 0.08 * math.sin(i * 0.7 + ph) + 0.04 * math.cos(i * 0.45 + ph * 1.2)
            b = BASE[ch]
            look       = max(1, round(b[0] * jitter))
            prop       = max(1, round(b[1] * jitter))
            avail_look = max(1, round(b[2] * jitter))
            prebook    = max(1, round(b[3] * jitter))
            book       = max(1, round(b[4] * jitter))
            rows.append((d, ch, look, prop, avail_look, prebook, book))

    conn.executemany(
        "INSERT OR IGNORE INTO conversion_daily_metrics"
        " (date, channel, look, property, avail_look, prebook, book) VALUES (?,?,?,?,?,?,?)",
        rows,
    )
    conn.commit()
    print(f"conversion_daily_metrics: 写入 {len(rows)} 行")


def _seed_error_logs(conn):
    """委托给 seed_errors.py，Excel 文件不存在时静默跳过"""
    import os
    prebook_xlsx = os.path.expanduser("~/Downloads/报错验价底表示例.xlsx")
    book_xlsx    = os.path.expanduser("~/Downloads/报错下单底表示例.xlsx")
    if not (os.path.exists(prebook_xlsx) and os.path.exists(book_xlsx)):
        return
    pre_count  = conn.execute("SELECT COUNT(*) FROM prebook_error_logs").fetchone()[0]
    book_count = conn.execute("SELECT COUNT(*) FROM book_error_logs").fetchone()[0]
    if pre_count > 0 and book_count > 0:
        return
    try:
        import seed_errors
        seed_errors.seed()
    except Exception as e:
        print(f"seed_errors: 跳过（{e}）")

