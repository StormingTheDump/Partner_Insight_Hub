"""初始化 API 性能指标数据：30天 × 6渠道，重复运行安全。"""
import sys, os, math
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from database import get_connection, init_tables

CHANNELS      = ["Agoda", "AgodaEBK", "AgodaUK", "Lvzan", "DidaOpaq", "Barli2b"]
CHAN_WEIGHTS   = [0.35,    0.25,       0.15,      0.12,   0.08,      0.05]
CHAN_PRE_MULT  = [0.40,    0.80,       1.50,      3.00,   0.60,      6.00]  # 准确率覆盖 97%→64%
CHAN_BOOK_MULT = [0.50,    0.90,       1.30,      2.00,   0.70,      3.50]
CHAN_PHASE     = [0.0,     2.1,        4.3,       1.5,    3.7,       5.2]

START = date(2026, 5, 12)
DATES = [(START + timedelta(days=i)).isoformat() for i in range(30)]

TOTAL_CHECKS = [
    9800, 10200,  9500, 10100, 10300,  9600,  9400,  9300,  9760,  9810,
    9905,  9700,  9200,  9500,  9550,  9800,  9850, 10650,  9750,  9650,
    9900, 10110, 10375, 10360, 10125,  9575,  9925, 10275, 10200,  9150,
]
TOTAL_ORDERS = [
     405,  336,  350,  340,  260,  258,  356,  380,  360,  330,
     270,  275,  300,  335,  350,  430,  345,  320,  330,  420,
     460,  485,  490,  360,  292,  305,  390,  360,  380,  370,
]
PRE_ERROR_RATES = [
    6.7, 8.4, 7.3, 7.2, 6.6, 5.8, 7.7, 9.1, 8.2, 6.4,
    6.7, 6.6, 5.4, 6.9, 6.5, 6.8, 6.6, 6.1, 5.4, 4.9,
    5.8, 5.9, 5.3, 5.7, 5.5, 5.4, 5.3, 5.8, 5.6, 5.9,
]
BOOK_ERROR_RATES = [
    5.9, 4.4, 5.8, 4.8, 4.2, 4.7, 4.4, 5.2, 5.4, 5.8,
    6.4, 6.3, 5.1, 5.0, 5.4, 5.4, 5.1, 5.6, 6.2, 5.8,
    6.8, 5.8, 6.5, 7.0, 6.7, 5.1, 5.3, 5.5, 5.2, 5.7,
]


def seed():
    init_tables()
    conn = get_connection()
    inserted = skipped = 0

    for i, d in enumerate(DATES):
        for j, channel in enumerate(CHANNELS):
            phase = CHAN_PHASE[j]
            independent = (
                0.060 * math.sin(i * 0.65 + phase) +
                0.035 * math.cos(i * 0.40 + phase * 1.3)
            )

            ch_checks     = round(TOTAL_CHECKS[i] * CHAN_WEIGHTS[j])
            ch_pre_rate   = max(0.005, min(0.40, PRE_ERROR_RATES[i] / 100 * CHAN_PRE_MULT[j] + independent))
            ch_inaccurate = round(ch_checks * ch_pre_rate)

            ch_orders     = round(TOTAL_ORDERS[i] * CHAN_WEIGHTS[j])
            ch_book_rate  = max(0.005, BOOK_ERROR_RATES[i] / 100 * CHAN_BOOK_MULT[j] + independent * 0.6)
            ch_failed     = round(ch_orders * ch_book_rate)

            try:
                conn.execute(
                    """INSERT INTO api_daily_metrics
                       (date, channel, total_orders, failed_orders, total_price_checks, inaccurate_checks)
                       VALUES (?, ?, ?, ?, ?, ?)""",
                    (d, channel, ch_orders, ch_failed, ch_checks, ch_inaccurate),
                )
                inserted += 1
            except Exception:
                skipped += 1

    conn.commit()
    conn.close()
    print(f"完成：新增 {inserted} 条，跳过 {skipped} 条")


if __name__ == "__main__":
    seed()
