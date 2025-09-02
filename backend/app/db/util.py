import os, psycopg

DATABASE_URL = os.getenv("DATABASE_URL")

def run_tx(fn):
    """
    Open a short-lived connection per call with tight timeouts.
    Safe for Neon pooler endpoints.
    """
    conn = psycopg.connect(
        DATABASE_URL,
        connect_timeout=10,
        options="-c statement_timeout=5000",
        sslmode="require",
        autocommit=True,
    )
    try:
        with conn.cursor() as cur:
            return fn(conn, cur)
    finally:
        conn.close()
