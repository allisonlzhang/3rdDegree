import os
from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

pool = ConnectionPool(
    DATABASE_URL,
    min_size=1,            # keep 1 warm
    max_size=5,
    open=True,             # open at import
    kwargs={
        "sslmode": "require",
        "connect_timeout": 10,
        # TCP keepalives so Neon/Render don’t silently kill us
        "keepalives": 1,
        "keepalives_idle": 30,
        "keepalives_interval": 10,
        "keepalives_count": 3,
    },
)