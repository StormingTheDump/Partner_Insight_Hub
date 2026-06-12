from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from database import init_tables, get_connection
from auth import login
import os

app = FastAPI(title="Partner Insight Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://huangxiaozhen.github.io",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_tables()


class LoginRequest(BaseModel):
    email: str
    password: str


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


ERROR_STATUS = {"not_found": 404, "wrong_password": 401, "disabled": 403}
ERROR_MSG = {
    "not_found": "账号不存在，请检查邮箱地址",
    "wrong_password": "密码错误，请重新输入",
    "disabled": "该账号已被禁用，请联系客户经理",
}

DIDA_API_SYSTEM_PROMPT = """You are a helpful assistant specialized in Dida Travel API (DidaAPI). Answer questions clearly and concisely in the same language the user uses (Chinese or English).

## Dida API Overview
- API Version: v2.0
- Base URL (Test): https://apiint.didatravel.com
- Base URL (Production): https://api.didatravel.com
- Contact: techsupport@dida.com
- All requests use HTTP POST
- Supports JSON and XML (JSON recommended)
- Default QPS limit: 30 (configurable)
- All responses are gzip encoded

## Authentication
Every request must include a Header with ClientID and LicenseKey:
```json
{
  "Header": {
    "ClientID": "YourClientID",
    "LicenseKey": "YourLicenseKey"
  }
}
```

## Go Live Process
1. Sign NDA
2. Access development environment (test credentials provided)
3. Complete Post Sale Questionnaire
4. Pre-development communication with Dida integration team
5. Test credentials and pre-production test (send test template to Dida)
6. Live credentials and test booking
7. Go live

## Booking API Flow
The standard booking flow is:
1. **Price Search** → Get available rates
2. **Price Confirm** → Validate price, get booking reference
3. **Booking Confirm** → Create booking using reference from step 2
4. **Booking Search** → Check booking status
5. **Booking Cancel** (if needed) → Pre-cancel → Cancel Confirm

### 3.1 Price Search
- POST `https://apiint.didatravel.com/api/hotel/HotelPriceSearch?$format=json`
- Three types: Lowest Price Search, Cache Rate Search, Realtime Rate Search
- Lowest Price Search and Cache Rate Search return prices for 2 persons by default
- Cache is on a daily basis; for 30-day cache, invoke 30 times
- For multiple hotels, use Cache Rate Search
- PriceSearch returns price for ONE room; for multiple rooms multiply accordingly
- Supports single requests with multiple rooms of the SAME room type (same RatePlanID)
- Does NOT support multiple rooms of different room types in one request

### 3.2 Price Confirm
- POST `https://apiint.didatravel.com/api/hotel/HotelPriceConfirm?$format=json`
- Validates price and returns a booking reference (BookingReference/ReferenceNo)
- The reference is required for Booking Confirm
- Returns total price for all rooms

### 3.3 Booking Confirm
- POST `https://apiint.didatravel.com/api/booking/HotelBookingConfirm?$format=json`
- Creates a new booking using the reference from Price Confirm
- Parameters must match Price Confirm (check-in/out dates, rooms, occupancy)
- ConfirmationCode = Hotel Confirmation Number (HCN) — not always returned in real-time
- Name field supports: English, Chinese, Japanese, Korean, Portuguese, and more

### 3.4 Booking Search
- POST `https://apiint.didatravel.com/api/booking/HotelBookingSearch?$format=json`
- Search by BookingID (recommended) or other params
- **Final booking statuses only**: Status 2 (Confirmed), 3 (Canceled), 4 (Failed)
- Do NOT interpret empty responses or other statuses as final

**Booking Status Codes:**
| Status | Name | Description |
|--------|------|-------------|
| 0 | PreBook | - |
| 1 | Booked | PreBook + awaiting payment |
| 2 | Confirmed | **Final** — booking confirmed |
| 3 | Canceled | **Final** — booking cancelled |
| 4 | Failed | **Final** — booking failed |
| 5 | Pending | Transition phase (within ~3 minutes) |
| 6 | OnRequest | May take up to 120 minutes to finalize |

### 3.5 Booking Cancel
Two-step process:
1. **Pre-cancel**: POST `.../HotelBookingCancel?$format=json` — returns CancelConfirmID (valid 10 minutes)
2. **Cancel Confirm**: POST `.../HotelBookingCancelConfirm?$format=json` — confirms cancellation using CancelConfirmID
- If CancelConfirmID expires, repeat Pre-cancel to get a new one

## Content API
- Hotel list, hotel details, room types, images, facilities, bed types, etc.
- Content API v2 available with enhanced fields
- Used to build local hotel content cache

## Error Codes

### Pricing Errors (2xxx)
| Code | Description |
|------|-------------|
| 2000 | Unexpected Error |
| 2001 | No Hotel Or Destination |
| 2002 | No Hotel Found |
| 2003 | Incorrect Date |
| 2004 | Incorrect RoomCount |
| 2005 | No Available Room |
| 2006 | No RatePlan Found |
| 2009 | Check Availability Timeout |
| 2017 | Client Auth Failed |
| 2018 | Currency Not Supported |
| 2022 | Limited Call (Exceed QPS limitation) |
| 2029 | Hotel Stop Sell |

### Booking Errors (3xxx)
| Code | Description |
|------|-------------|
| 3000 | Unexpected Error |
| 3001 | Incorrect Booking Information |
| 3002 | Incorrect ReferenceNo |
| 3003 | Incorrect BookingID |
| 3004 | Incorrect CancelConfirmID |
| 3006 | Booking Expired |
| 3007 | Cancel Expired |
| 3014 | Not Enough Credit |
| 3015 | Availability Or Price Invalid |
| 3016 | Failed To Confirm Booking |
| 3019 | Duplicate ClientReference |

## Best Practices
- Use Cache Rate Search for multiple hotel queries
- Always use Booking Search with BookingID for status checks
- Call Booking Search 3 days before check-in to get HCN if not returned in real-time
- Handle Pending (5) and OnRequest (6) statuses with polling
- Implement timeout settings according to Dida's recommendation
- White-list your server IP with Dida
- Request higher QPS if default 30 is not enough

Answer questions based on this documentation. If asked something outside this scope, say so honestly.
"""


# ── Agoda Metrics API ─────────────────────────────────────────────────────────

@app.get("/api/metrics/funnel")
def metrics_funnel():
    """
    5层转化漏斗：查价数 → 有价数 → 验价数 → 准确验价数 → 下单数
    """
    conn = get_connection()

    overall = conn.execute("""
        SELECT
          (SELECT SUM(search_requests)  FROM agoda_price_search)  AS searches,
          (SELECT SUM(result_count)     FROM agoda_price_search)  AS results,
          (SELECT SUM(confirm_requests) FROM agoda_price_confirm) AS confirms,
          (SELECT SUM(accurate_count)   FROM agoda_price_confirm) AS accurates,
          (SELECT SUM(bookings)         FROM agoda_daily_metrics) AS bookings,
          (SELECT ROUND(AVG(accurate_rate),1)  FROM agoda_price_confirm) AS confirm_accurate_rate,
          (SELECT ROUND(AVG(avg_response_ms))  FROM agoda_price_search)  AS avg_response_ms
    """).fetchone()

    by_client = conn.execute("""
        SELECT
            s.client_id,
            SUM(s.search_requests)                                                  AS searches,
            SUM(s.result_count)                                                     AS results,
            SUM(c.confirm_requests)                                                 AS confirms,
            SUM(c.accurate_count)                                                   AS accurates,
            SUM(m.bookings)                                                         AS bookings,
            ROUND(SUM(s.result_count)*100.0/NULLIF(SUM(s.search_requests),0),1)    AS result_rate,
            ROUND(SUM(c.confirm_requests)*100.0/NULLIF(SUM(s.search_requests),0),1) AS search_to_confirm_rate,
            ROUND(SUM(c.accurate_count)*100.0/NULLIF(SUM(c.confirm_requests),0),1) AS accurate_rate,
            ROUND(SUM(m.bookings)*100.0/NULLIF(SUM(c.confirm_requests),0),1)       AS confirm_to_book_rate,
            ROUND(AVG(s.avg_response_ms))                                           AS avg_response_ms
        FROM agoda_price_search  s
        JOIN agoda_price_confirm c ON s.date = c.date AND s.client_id = c.client_id
        JOIN agoda_daily_metrics m ON s.date = m.date AND s.client_id = m.client_id
        GROUP BY s.client_id
        ORDER BY searches DESC
    """).fetchall()

    conn.close()

    searches = overall["searches"]
    results  = overall["results"]
    confirms = overall["confirms"]
    accurates= overall["accurates"]
    bookings = overall["bookings"]

    return {
        "overall": {
            "searches":          searches,
            "results":           results,
            "confirms":          confirms,
            "accurates":         accurates,
            "bookings":          bookings,
            "result_rate":       round(results   / searches * 100, 1),
            "search_to_confirm": round(confirms  / searches * 100, 1),
            "accurate_rate":     round(accurates / confirms * 100, 1),
            "confirm_to_book":   round(bookings  / confirms * 100, 1),
            "avg_response_ms":   overall["avg_response_ms"],
        },
        "by_client": [dict(r) for r in by_client],
    }


@app.get("/api/metrics/overview")
def metrics_overview():
    """
    汇总卡片 + 30天日时序（供概览页折线图/sparkline使用）
    """
    conn = get_connection()

    # 汇总卡片
    summary = conn.execute("""
        SELECT
            SUM(bookings)                                    AS total_bookings,
            ROUND(SUM(ttv), 2)                               AS total_ttv,
            ROUND(SUM(ttv) / NULLIF(SUM(bookings), 0), 2)   AS avg_order_value,
            SUM(room_nights)                                 AS total_room_nights,
            ROUND(SUM(wins) * 100.0 / NULLIF(SUM(opportunities), 0), 2) AS win_rate,
            ROUND(AVG(pre_error_rate), 2)                    AS avg_pre_error_rate,
            ROUND(AVG(book_error_rate), 2)                   AS avg_book_error_rate
        FROM agoda_daily_metrics
    """).fetchone()

    # 日时序（所有 Client ID 合并，按日聚合）
    daily = conn.execute("""
        SELECT
            date,
            SUM(bookings)                                     AS bookings,
            ROUND(SUM(ttv) / 1000.0, 1)                      AS ttv_k,
            ROUND(SUM(ttv) / NULLIF(SUM(bookings), 0), 2)    AS avg_order_value,
            SUM(room_nights)                                  AS room_nights,
            ROUND(SUM(wins) * 100.0 / NULLIF(SUM(opportunities), 0), 2) AS win_rate,
            ROUND(AVG(pre_error_rate), 2)                     AS pre_error_rate,
            ROUND(AVG(book_error_rate), 2)                    AS book_error_rate
        FROM agoda_daily_metrics
        GROUP BY date
        ORDER BY date
    """).fetchall()

    conn.close()

    dates = [r["date"] for r in daily]
    return {
        "summary": dict(summary),
        "daily": {
            "labels":          dates,
            "ttv":             [r["ttv_k"]          for r in daily],
            "bookings":        [r["bookings"]        for r in daily],
            "avg_order_value": [r["avg_order_value"] for r in daily],
            "room_nights":     [r["room_nights"]     for r in daily],
            "win_rate":        [r["win_rate"]        for r in daily],
            "pre_error_rate":  [r["pre_error_rate"]  for r in daily],
            "book_error_rate": [r["book_error_rate"] for r in daily],
        },
    }


@app.get("/api/metrics/performance")
def metrics_performance():
    """
    各 Client ID 的聚合业绩（业绩表现页表格 + 堆叠柱状图）
    """
    conn = get_connection()

    # 每个 Client ID 汇总行
    rows = conn.execute("""
        SELECT
            client_id,
            SUM(wins)                                                    AS wins,
            SUM(opportunities)                                           AS opportunities,
            ROUND(SUM(wins) * 100.0 / NULLIF(SUM(opportunities), 0), 2) AS win_rate_pct,
            SUM(bookings)                                                AS bookings,
            ROUND(SUM(ttv), 2)                                           AS ttv,
            ROUND(SUM(ttv) / NULLIF(SUM(bookings), 0), 2)               AS avg_order_value,
            SUM(room_nights)                                             AS room_nights
        FROM agoda_daily_metrics
        GROUP BY client_id
        ORDER BY ttv DESC
    """).fetchall()

    # 按日 × Client ID（供堆叠柱状图）
    daily_by_client = conn.execute("""
        SELECT date, client_id, bookings
        FROM agoda_daily_metrics
        ORDER BY date, client_id
    """).fetchall()

    conn.close()

    # 整理堆叠图数据：{client_id: [day0_bookings, day1_bookings, ...]}
    from collections import defaultdict
    stacked: dict = defaultdict(list)
    dates_set: list = []
    for r in daily_by_client:
        if r["date"] not in dates_set:
            dates_set.append(r["date"])
    for client_row in rows:
        cid = client_row["client_id"]
        day_map = {r["date"]: r["bookings"] for r in daily_by_client if r["client_id"] == cid}
        stacked[cid] = [day_map.get(d, 0) for d in dates_set]

    return {
        "rows": [
            {
                "client_id":      r["client_id"],
                "wins":           r["wins"],
                "opportunities":  r["opportunities"],
                "win_rate":       f'{r["win_rate_pct"]}%',
                "bookings":       r["bookings"],
                "ttv":            r["ttv"],
                "avg_order_value":r["avg_order_value"],
                "room_nights":    r["room_nights"],
            }
            for r in rows
        ],
        "stacked": {
            "labels": dates_set,
            "series": dict(stacked),
        },
    }


# ── Auth & Chat ────────────────────────────────────────────────────────────────

@app.post("/api/auth/login")
def api_login(body: LoginRequest):
    result = login(body.email, body.password)
    if not result["success"]:
        err = result["error"]
        raise HTTPException(status_code=ERROR_STATUS[err], detail=ERROR_MSG[err])
    return result


@app.post("/api/chat/dida-api")
def chat_dida_api(body: ChatRequest):
    import subprocess, shutil

    # Build conversation context for the prompt
    history = ""
    for m in body.messages[:-1]:
        role = "用户" if m.role == "user" else "助手"
        history += f"{role}: {m.content}\n\n"

    last_msg = body.messages[-1].content if body.messages else ""
    full_prompt = f"{DIDA_API_SYSTEM_PROMPT}\n\n{history}用户: {last_msg}\n\n助手:"

    claude_bin = shutil.which("claude") or "/home/jason.huang/.config/nvm/versions/node/v22.22.3/bin/claude"

    def generate():
        proc = subprocess.Popen(
            [claude_bin, "--print", "--model", "claude-sonnet-4-6"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True,
        )
        stdout, _ = proc.communicate(input=full_prompt, timeout=60)
        yield stdout

    return StreamingResponse(generate(), media_type="text/plain; charset=utf-8")
