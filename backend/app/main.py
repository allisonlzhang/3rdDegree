from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .db.connection import pool
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # startup
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
    yield
    # shutdown
    pool.close()

app = FastAPI(title="Party API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    with pool.connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            ok = cur.fetchone()[0] == 1
    return {"ok": ok}


from .routes.parties import router as parties_router
from .routes.join import router as join_router
from .routes.auth import router as auth_router, me_router
from .routes.rsvp import router as rsvp_router
from .routes.snapshot import router as snapshot_router
from .routes.host_auth import router as host_auth_router
app.include_router(parties_router)
app.include_router(join_router)
app.include_router(auth_router)
app.include_router(me_router)
app.include_router(rsvp_router)
app.include_router(snapshot_router)
app.include_router(host_auth_router)