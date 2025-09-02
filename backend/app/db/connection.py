import os
from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

# Lazy pool: don't open on import/startup
pool = ConnectionPool(
    DATABASE_URL,
    min_size=1,   # pre-open a connection
    max_size=5,
    open=True,    # open at import
    kwargs={"connect_timeout": 20, "sslmode": "require"},
)
