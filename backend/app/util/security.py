import bcrypt

def hash_password(plain: str) -> str:
    if not plain or len(plain) < 8:
        raise ValueError("password too short")
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    if not hashed:
        return False
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
