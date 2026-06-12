from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from database import init_tables, get_connection
from auth import login
import os
from typing import Optional

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


# ── Dida 联系方式（只读） ────────────────────────────────────────

@app.get("/api/contacts/dida")
def get_dida_contacts():
    conn = get_connection()
    contacts = conn.execute(
        "SELECT * FROM dida_contacts ORDER BY sort_order"
    ).fetchall()
    result = []
    for c in contacts:
        fields = conn.execute(
            "SELECT label, value FROM dida_contact_fields WHERE contact_id=? ORDER BY sort_order",
            (c["id"],),
        ).fetchall()
        result.append({
            "id": c["id"],
            "title": c["title"],
            "subtitle": c["subtitle"],
            "icon_key": c["icon_key"],
            "color": c["color"],
            "bg_color": c["bg_color"],
            "fields": [{"label": f["label"], "value": f["value"]} for f in fields],
        })
    conn.close()
    return result


# ── 我方对接人（CRUD） ───────────────────────────────────────────

class MyContactBody(BaseModel):
    type: str
    name: Optional[str] = ""
    role: Optional[str] = ""
    email: Optional[str] = ""
    phone: Optional[str] = ""
    wechat: Optional[str] = ""


@app.get("/api/contacts/my")
def get_my_contacts():
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM my_contacts ORDER BY type, sort_order, id"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/contacts/my", status_code=201)
def create_my_contact(body: MyContactBody):
    if body.type not in ("ops", "biz"):
        raise HTTPException(status_code=400, detail="type must be ops or biz")
    conn = get_connection()
    max_order = conn.execute(
        "SELECT COALESCE(MAX(sort_order),0) FROM my_contacts WHERE type=?", (body.type,)
    ).fetchone()[0]
    cur = conn.execute(
        "INSERT INTO my_contacts (type, name, role, email, phone, wechat, sort_order) VALUES (?,?,?,?,?,?,?)",
        (body.type, body.name, body.role, body.email, body.phone, body.wechat, max_order + 1),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM my_contacts WHERE id=?", (cur.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/contacts/my/{contact_id}")
def update_my_contact(contact_id: int, body: MyContactBody):
    conn = get_connection()
    existing = conn.execute("SELECT id FROM my_contacts WHERE id=?", (contact_id,)).fetchone()
    if not existing:
        conn.close()
        raise HTTPException(status_code=404, detail="Contact not found")
    conn.execute(
        "UPDATE my_contacts SET type=?, name=?, role=?, email=?, phone=?, wechat=? WHERE id=?",
        (body.type, body.name, body.role, body.email, body.phone, body.wechat, contact_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM my_contacts WHERE id=?", (contact_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/contacts/my/{contact_id}", status_code=204)
def delete_my_contact(contact_id: int):
    conn = get_connection()
    conn.execute("DELETE FROM my_contacts WHERE id=?", (contact_id,))
    conn.commit()
    conn.close()



# ── 渠道匹配 ─────────────────────────────────────────────────────

@app.get("/api/channel-mapping")
def get_channel_mapping(
    dida_hotel_id: str = "",
    client_id: str = "",
    client_hotel_id: str = "",
):
    conn = get_connection()
    query = "SELECT * FROM channel_mappings WHERE 1=1"
    params: list = []
    if dida_hotel_id.strip():
        query += " AND CAST(dida_hotel_id AS TEXT) LIKE ?"
        params.append(f"%{dida_hotel_id.strip()}%")
    if client_id.strip():
        query += " AND client_id = ?"
        params.append(client_id.strip())
    if client_hotel_id.strip():
        query += " AND client_hotel_id LIKE ?"
        params.append(f"%{client_hotel_id.strip()}%")
    query += " ORDER BY id"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/api/channel-mapping/upload")
async def upload_channel_mapping(file: UploadFile = File(...)):
    import openpyxl, io

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="请上传 Excel 文件（.xlsx 或 .xls）")

    content = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Excel 文件解析失败，请检查文件格式")

    ws = wb.active
    upload_rows: list[tuple[int, str, str]] = []
    parse_errors: list[str] = []

    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not any(c for c in row[:3] if c is not None):
            continue
        try:
            dida_id         = int(row[0])
            client_id_val   = str(row[1]).strip()
            client_hotel_val = str(row[2]).strip()
            if not client_id_val or not client_hotel_val:
                raise ValueError
            upload_rows.append((dida_id, client_id_val, client_hotel_val))
        except (TypeError, ValueError, IndexError):
            parse_errors.append(f"第 {i} 行数据格式错误（需要：DidaHotelID / 客户ID / 客户HotelID）")

    if parse_errors:
        raise HTTPException(status_code=400, detail="；".join(parse_errors[:5]))

    # 校验上传文件内部是否满足一一对应
    seen_dida_client: dict[tuple, str] = {}
    seen_client_hotel: dict[tuple, int] = {}
    internal_errors: list[str] = []
    for dida_id, cid, chid in upload_rows:
        k1 = (dida_id, cid)
        if k1 in seen_dida_client and seen_dida_client[k1] != chid:
            internal_errors.append(f"Dida Hotel ID {dida_id}（{cid}）在文件中存在多个不同映射")
        seen_dida_client[k1] = chid
        k2 = (cid, chid)
        if k2 in seen_client_hotel and seen_client_hotel[k2] != dida_id:
            internal_errors.append(f"客户 Hotel ID {chid}（{cid}）在文件中映射了多个不同 Dida Hotel ID")
        seen_client_hotel[k2] = dida_id

    if internal_errors:
        raise HTTPException(status_code=400, detail="文件中存在非一一对应关系：" + "；".join(internal_errors[:5]))

    # 逐行写入数据库
    conn = get_connection()
    added = 0
    conflict_errors: list[str] = []

    for dida_id, cid, chid in upload_rows:
        # 已存在完全相同的记录 → 跳过
        existing = conn.execute(
            "SELECT client_hotel_id FROM channel_mappings WHERE dida_hotel_id=? AND client_id=?",
            (dida_id, cid),
        ).fetchone()
        if existing:
            if existing["client_hotel_id"] == chid:
                continue  # 完全一致，跳过
            else:
                conflict_errors.append(
                    f"Dida Hotel ID {dida_id}（{cid}）已匹配 {existing['client_hotel_id']}，与上传的 {chid} 冲突"
                )
                continue

        # 反向：客户 Hotel ID 是否已映射到别的 Dida Hotel ID
        reverse = conn.execute(
            "SELECT dida_hotel_id FROM channel_mappings WHERE client_id=? AND client_hotel_id=?",
            (cid, chid),
        ).fetchone()
        if reverse:
            conflict_errors.append(
                f"客户 Hotel ID {chid}（{cid}）已映射到 Dida Hotel ID {reverse['dida_hotel_id']}，与上传的 {dida_id} 冲突"
            )
            continue

        conn.execute(
            "INSERT INTO channel_mappings (dida_hotel_id, client_id, client_hotel_id, updated_at) VALUES (?,?,?,datetime('now'))",
            (dida_id, cid, chid),
        )
        added += 1

    conn.commit()
    conn.close()
    return {"added": added, "conflicts": conflict_errors}


# ── 渠道热销 ─────────────────────────────────────────────────────

@app.get("/api/hot-sales")
def get_hot_sales(
    channel_id: str = "",
    hotel_id:   str = "",
    country:    str = "",
    city:       str = "",
):
    conn = get_connection()
    query = "SELECT * FROM channel_hot_sales WHERE 1=1"
    params: list = []
    if channel_id.strip():
        query += " AND channel_id = ?"
        params.append(channel_id.strip())
    if hotel_id.strip():
        query += " AND hotel_id LIKE ?"
        params.append(f"%{hotel_id.strip()}%")
    if country.strip():
        query += " AND country = ?"
        params.append(country.strip())
    if city.strip():
        query += " AND city LIKE ?"
        params.append(f"%{city.strip()}%")
    query += " ORDER BY id"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/api/hot-sales/stats")
def get_hot_sales_stats():
    conn = get_connection()
    total     = conn.execute("SELECT COUNT(*) FROM channel_hot_sales").fetchone()[0]
    countries = conn.execute("SELECT COUNT(DISTINCT country) FROM channel_hot_sales").fetchone()[0]
    conn.close()
    matched   = round(total * 0.54)
    return {"total": total, "matched": matched, "countries": countries}


@app.post("/api/hot-sales/upload")
async def upload_hot_sales(file: UploadFile = File(...)):
    import openpyxl, io

    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="请上传 Excel 文件（.xlsx 或 .xls）")

    content = await file.read()
    try:
        wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
    except Exception:
        raise HTTPException(status_code=400, detail="Excel 文件解析失败，请检查文件格式")

    ws = wb.active
    upload_rows: list[tuple] = []
    parse_errors: list[str] = []

    for i, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
        if not any(c for c in row[:5] if c is not None):
            continue
        try:
            channel_id = str(row[0]).strip()
            hotel_id   = str(row[1]).strip()
            country    = str(row[2]).strip()
            city       = str(row[3]).strip()
            address    = str(row[4]).strip()
            if not channel_id or not hotel_id or not country or not city:
                raise ValueError
            upload_rows.append((channel_id, hotel_id, country, city, address))
        except (TypeError, ValueError, IndexError):
            parse_errors.append(f"第 {i} 行数据格式错误（需要：渠道ID / 酒店ID / 酒店国家 / 酒店城市 / 酒店地址）")

    if parse_errors:
        raise HTTPException(status_code=400, detail="；".join(parse_errors[:5]))

    # 校验文件内部无重复 (channel_id, hotel_id)
    seen: dict[tuple, str] = {}
    dup_errors: list[str] = []
    for channel_id, hotel_id, *_ in upload_rows:
        key = (channel_id, hotel_id)
        if key in seen:
            dup_errors.append(f"渠道 {channel_id} 的酒店 {hotel_id} 在文件中重复")
        seen[key] = hotel_id
    if dup_errors:
        raise HTTPException(status_code=400, detail="文件中存在重复数据：" + "；".join(dup_errors[:5]))

    conn = get_connection()
    added = 0
    skipped = 0

    for channel_id, hotel_id, country, city, address in upload_rows:
        existing = conn.execute(
            "SELECT id FROM channel_hot_sales WHERE channel_id=? AND hotel_id=?",
            (channel_id, hotel_id),
        ).fetchone()
        if existing:
            skipped += 1
            continue
        conn.execute(
            "INSERT INTO channel_hot_sales (channel_id, hotel_id, country, city, address, updated_at) VALUES (?,?,?,?,?,date('now'))",
            (channel_id, hotel_id, country, city, address),
        )
        added += 1

    conn.commit()
    conn.close()
    return {"added": added, "skipped": skipped}


# ── 渠道参数配置 ─────────────────────────────────────────────────────

@app.get("/api/channel-config")
def get_channel_config(client_id: Optional[str] = None):
    conn = get_connection()
    if client_id:
        rows = conn.execute(
            "SELECT * FROM channel_configurations WHERE client_id = ? ORDER BY id",
            (client_id,),
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM channel_configurations ORDER BY id"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
