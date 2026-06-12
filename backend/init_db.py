"""
一键初始化数据库：建表 + 将 Excel 测试数据导入 SQLite。
重复运行安全（已存在的 email 自动跳过）。
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

import openpyxl
from database import get_connection, init_tables
from auth import hash_password

EXCEL_PATH = os.path.join(
    os.path.dirname(__file__), "..", "docs", "测试用户数据.xlsx"
)


def seed():
    init_tables()
    wb = openpyxl.load_workbook(EXCEL_PATH)
    ws = wb["测试用户数据"]

    conn = get_connection()
    inserted = 0
    skipped = 0

    for row in ws.iter_rows(min_row=2, values_only=True):
        seq, email, password, channel_name, contact_name, status_cn, _ = row
        if not email:
            continue
        status = "disabled" if status_cn == "禁用" else "active"
        try:
            conn.execute(
                """INSERT INTO users (email, password_hash, channel_name, contact_name, status)
                   VALUES (?, ?, ?, ?, ?)""",
                (email, hash_password(password), channel_name, contact_name, status),
            )
            inserted += 1
            print(f"  ✓ 已插入：{email}")
        except Exception:
            skipped += 1
            print(f"  - 跳过（已存在）：{email}")

    conn.commit()
    conn.close()
    print(f"\n完成：新增 {inserted} 条，跳过 {skipped} 条")


if __name__ == "__main__":
    seed()
