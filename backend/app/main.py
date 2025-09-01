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

# -------- Logging --------
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)
logger = logging.getLogger("party-api")

# -------- Lifespan (no DB ping to avoid boot failures on cold DB) --------
@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    # close pool on shutdown
    try:
        pool.close()
        logger.info("DB connection pool closed")
    except Exception:
        pass

# -------- App --------
app = FastAPI(title="Party API", lifespan=lifespan)

# Compression
app.add_middleware(GZipMiddleware, minimum_size=1024)

# CORS (env-driven; comma-separated)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
logger.info("CORS_ORIGINS=%s", CORS_ORIGINS)
if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["authorization", "content-type", "x-requested-with"],
        max_age=86400,
    )
if not CORS_ORIGINS:
    # TEMP: make preview work even if env is missing
    CORS_ORIGINS = ["http://localhost:4173"]

# -------- Basic endpoints --------
@app.get("/")
def root():
    return {"ok": True, "service": "Party API", "endpoints": ["/health", "/dbcheck", "/docs"]}

@app.get("/health")
def health():
    # liveness (no DB)
    return {"ok": True}

@app.get("/dbcheck")
def dbcheck():
    # on-demand open + ping DB
    if not pool.is_open:
        pool.open(wait=True, timeout=30)
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            val = cur.fetchone()[0]
            return {"ok": val == 1}

# Optional: simple error logging
@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        raise

# -------- Routers --------
app.include_router(parties_router)
app.include_router(join_router)
app.include_router(rsvp_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(snapshot_router)
app.include_router(host_auth_router)
