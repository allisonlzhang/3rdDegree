import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from .db.connection import pool

# Routers
from .routes.parties import router as parties_router
from .routes.join import router as join_router
from .routes.rsvp import router as rsvp_router
from .routes.auth import router as auth_router, me_router
from .routes.snapshot import router as snapshot_router
from .routes.host_auth import router as host_auth_router

# -------- Logging (prod defaults) --------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("party-api")


# -------- Lifespan: open/close DB pool --------
@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
        logger.info("DB connection pool ready")
        yield
    finally:
        pool.close()
        logger.info("DB connection pool closed")


# -------- App --------
app = FastAPI(title="Party API", lifespan=lifespan)

# Gzip large JSON (safe default)
app.add_middleware(GZipMiddleware, minimum_size=1024)

# Strict CORS (env-driven). Example:
# CORS_ORIGINS="https://your-username.github.io,https://example.com"
CORS_ORIGINS = [
    o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()
]
if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["authorization", "content-type", "x-requested-with"],
        max_age=86400,
    )

# Health (no DB query—cheap liveness)
@app.get("/health")
def health():
    return {"ok": True}


# Simple error logging (keeps JSON body for clients)
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        raise


# Routers
app.include_router(parties_router)
app.include_router(join_router)
app.include_router(rsvp_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(snapshot_router)
app.include_router(host_auth_router)
