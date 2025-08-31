import os
from dotenv import load_dotenv
from psycopg_pool import ConnectionPool

load_dotenv()  # loads backend/.env if present

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not set")

pool = ConnectionPool(DATABASE_URL, min_size=1, max_size=5)
