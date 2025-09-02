# backend/app/db/util.py
import psycopg
from .connection import pool

def with_conn(fn):
    """Run `fn(conn, cur)` with a pooled connection; retry once if the socket is stale."""
    try:
        with pool.connection() as conn, conn.cursor() as cur:
            return fn(conn, cur)
    except psycopg.Error:
        try:
            pool.close()
        except Exception:
            pass
        pool.open(wait=True, timeout=30)
        with pool.connection() as conn, conn.cursor() as cur:
            return fn(conn, cur)
