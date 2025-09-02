# backend/app/db/util.py
import psycopg
from .connection import pool

def with_conn(fn):
    try:
        with pool.connection() as conn, conn.cursor() as cur:
            return fn(conn, cur)
    except psycopg.Error:
        # stale/BAD socket -> reopen pool and retry once
        try:
            pool.close()
        except Exception:
            pass
        pool.open(wait=True, timeout=30)
        with pool.connection() as conn, conn.cursor() as cur:
            return fn(conn, cur)
