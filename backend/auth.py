import bcrypt
from datetime import datetime, timedelta
from jose import jwt, JWTError
from database import get_connection

SECRET_KEY = "pih-secret-key-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_token(user_id: int, email: str) -> str:
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")


def login(email: str, password: str):
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM users WHERE email = ?", (email,)
    ).fetchone()
    conn.close()

    if row is None:
        return {"success": False, "error": "not_found"}
    if row["status"] == "disabled":
        return {"success": False, "error": "disabled"}
    if not verify_password(password, row["password_hash"]):
        return {"success": False, "error": "wrong_password"}

    token = create_token(row["id"], row["email"])
    return {
        "success": True,
        "token": token,
        "user": {
            "id": row["id"],
            "email": row["email"],
            "channelName": row["channel_name"],
            "contactName": row["contact_name"],
            "status": row["status"],
            "role": row["role"] if "role" in row.keys() else "user",
        },
    }
