import os
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

# Routers
from .routes.parties import router as parties_router
from .routes.join import router as join_router
from .routes.rsvp import router as rsvp_router
from .routes.auth import router as auth_router, me_router
from .routes.snapshot import router as snapshot_router
from .routes.host_auth import router as host_auth_router
from .routes.aliases import router as aliases_router

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("party-api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    logger.info("App shutting down")

app = FastAPI(title="Party API", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1024)

origins = [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://allisonlzhang.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"ok": True, "service": "Party API", "endpoints": ["/health", "/docs"]}

@app.get("/health")
def health():
    return {"ok": True}

@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        logger.exception("Unhandled error: %s %s", request.method, request.url.path)
        raise

app.include_router(parties_router)
app.include_router(join_router)
app.include_router(rsvp_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(snapshot_router)
app.include_router(host_auth_router)
app.include_router(aliases_router)
