from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import init_tables
from auth import login

app = FastAPI(title="Partner Insight Hub API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://10.6.20.87:5173",
        "http://198.19.107.12:5173",
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


ERROR_STATUS = {"not_found": 404, "wrong_password": 401, "disabled": 403}
ERROR_MSG = {
    "not_found": "账号不存在，请检查邮箱地址",
    "wrong_password": "密码错误，请重新输入",
    "disabled": "该账号已被禁用，请联系客户经理",
}


@app.post("/api/auth/login")
def api_login(body: LoginRequest):
    result = login(body.email, body.password)
    if not result["success"]:
        from fastapi import HTTPException
        err = result["error"]
        raise HTTPException(status_code=ERROR_STATUS[err], detail=ERROR_MSG[err])
    return result


_CHANNELS = ["Agoda", "AgodaEBK", "AgodaUK", "Lvzan", "DidaOpaq", "Barli2b"]


@app.get("/api/integration/api-metrics")
def api_integration_metrics():
    from database import get_connection
    from datetime import datetime
    from collections import defaultdict

    conn = get_connection()
    rows = conn.execute(
        """SELECT date, channel,
                  total_orders, failed_orders,
                  total_price_checks, inaccurate_checks
           FROM api_daily_metrics
           ORDER BY date, channel"""
    ).fetchall()
    conn.close()

    # group by date
    date_data: dict = defaultdict(dict)
    all_dates: list = []
    for row in rows:
        d = row["date"]
        if d not in all_dates:
            all_dates.append(d)
        date_data[d][row["channel"]] = {
            "to": row["total_orders"],
            "fo": row["failed_orders"],
            "tc": row["total_price_checks"],
            "ic": row["inaccurate_checks"],
        }

    def fmt_date(d: str) -> str:
        dt = datetime.strptime(d, "%Y-%m-%d")
        return f"{dt.strftime('%b')} {dt.day}"

    display_dates = [fmt_date(d) for d in all_dates]

    # per-channel accuracy trend
    accuracy_by_channel: dict = {ch: [] for ch in _CHANNELS}
    pre_error_trend: list = []
    book_error_trend: list = []

    for d in all_dates:
        day = date_data[d]
        day_tc = sum(day.get(ch, {}).get("tc", 0) for ch in _CHANNELS)
        day_ic = sum(day.get(ch, {}).get("ic", 0) for ch in _CHANNELS)
        day_to = sum(day.get(ch, {}).get("to", 0) for ch in _CHANNELS)
        day_fo = sum(day.get(ch, {}).get("fo", 0) for ch in _CHANNELS)

        pre_error_trend.append(round(day_ic / day_tc * 100, 2) if day_tc else 0)
        book_error_trend.append(round(day_fo / day_to * 100, 2) if day_to else 0)

        for ch in _CHANNELS:
            ch_d = day.get(ch, {})
            tc, ic = ch_d.get("tc", 0), ch_d.get("ic", 0)
            accuracy_by_channel[ch].append(round((tc - ic) / tc * 100, 1) if tc else 0)

    # per-channel book_error trend
    book_error_by_channel: dict = {ch: [] for ch in _CHANNELS}
    for d in all_dates:
        day = date_data[d]
        for ch in _CHANNELS:
            ch_d = day.get(ch, {})
            to_, fo = ch_d.get("to", 0), ch_d.get("fo", 0)
            book_error_by_channel[ch].append(round(fo / to_ * 100, 2) if to_ else 0)

    # overall summary
    total_tc = sum(r["total_price_checks"] for r in rows)
    total_ic = sum(r["inaccurate_checks"] for r in rows)
    total_to = sum(r["total_orders"] for r in rows)
    total_fo = sum(r["failed_orders"] for r in rows)

    return {
        "summary": {
            "pre_error_rate": round(total_ic / total_tc * 100, 2) if total_tc else 0,
            "book_error_rate": round(total_fo / total_to * 100, 2) if total_to else 0,
            "total_price_checks": total_tc,
            "total_orders": total_to,
        },
        "dates": display_dates,
        "accuracy_by_channel": accuracy_by_channel,
        "book_error_by_channel": book_error_by_channel,
        "pre_error_trend": pre_error_trend,
        "book_error_trend": book_error_trend,
    }
