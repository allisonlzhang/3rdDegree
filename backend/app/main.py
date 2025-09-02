import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

from fastapi import FastAPI, Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi import HTTPException

from .db.connection import pool
from anyio import EndOfStream

# Util helpers used by /host/login
from .util.phone import normalize_phone
from .util.security import hash_password, verify_password
from .util.tokens import new_token

# Routers
from .routes.parties import router as parties_router
from .routes.join import router as join_router
from .routes.rsvp import router as rsvp_router
from .routes.auth import router as auth_router, me_router
from .routes.snapshot import router as snapshot_router
# from .routes.host_auth import router as host_auth_router  # <-- disabled; we define /host/login here

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

# CORS
origins = [
    "http://localhost:5173",       # Vite dev server
    "http://localhost:4173",       # Vite preview (npm run preview)
    "https://allisonlzhang.github.io",  # GitHub Pages origin (no path)
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,     # needed if you send cookies
    allow_methods=["*"],        # allow all methods (GET/POST/etc)
    allow_headers=["*"],        # allow all headers
)

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
    try:
        # open the pool on-demand (safe if already open)
        pool.open(wait=True, timeout=30)
        with pool.connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                return {"ok": cur.fetchone()[0] == 1}
    except Exception as e:
        import traceback, logging
        logging.getLogger("party-api").exception("DBCHECK failed")
        return {"ok": False, "error": str(e), "trace": traceback.format_exc()}

# -------- Create-on-first-login (phone+password) --------
@app.post("/host/login")
def host_login_auto(payload: dict = Body(...)):
    """
    Login by phone+password. Behavior:
      - If host exists:
          * if no password yet, set it (first-time)
          * else verify; on mismatch return {"error": "invalid credentials"}
      - If not found: auto-create party + host + rsvp + invite.
    Never 500s: returns {"error": "..."} JSON on any failure.
    """
    try:
        phone_raw = (payload.get("phone") or "").strip()
        password = (payload.get("password") or "").strip()
        if not phone_raw or not password:
            return {"error": "phone and password are required"}

        # normalize phone to E.164 (e.g., +12125551234)
        try:
            phone = normalize_phone(phone_raw)
        except ValueError as e:
            return {"error": str(e)}

        # open pool if needed
        pool.open(wait=True, timeout=30)

        with pool.connection() as conn, conn.cursor() as cur:
            # try existing host (most recent if multiple parties used same phone)
            cur.execute(
                """
                SELECT id, party_id, name, role, phone, password_hash
                FROM member
                WHERE role='host' AND phone=%s
                ORDER BY id DESC
                LIMIT 1
                """,
                (phone,),
            )
            row = cur.fetchone()

            if row:
                member_id, party_id, name, role, phone_db, pwd_hash = row
                # first-time password set
                if not pwd_hash:
                    cur.execute(
                        "UPDATE member SET password_hash=%s WHERE id=%s",
                        (hash_password(password), member_id),
                    )
                else:
                    # verify password
                    if not verify_password(password, pwd_hash):
                        return {"error": "invalid credentials"}

                # return member + party meta
                cur.execute(
                    "SELECT id, title, location, starts_at, started FROM party WHERE id=%s",
                    (party_id,),
                )
                prow = cur.fetchone()
                party = dict(zip([d.name for d in cur.description], prow)) if prow else None
                return {
                    "member": {
                        "id": member_id,
                        "party_id": party_id,
                        "name": name,
                        "role": role,
                        "phone": phone_db,
                    },
                    "party": party,
                }

            # ---------- not found: auto-create ----------
            name = (payload.get("name") or "Host").strip()
            party_title = (payload.get("party_title") or f"{name}'s Party").strip()
            location = (payload.get("location") or "TBD").strip()

            starts_at_raw = payload.get("starts_at")
            if starts_at_raw:
                try:
                    starts_at = datetime.fromisoformat(starts_at_raw.replace("Z", "+00:00"))
                except Exception:
                    return {"error": "invalid starts_at (use ISO8601)"}
            else:
                # default: 7 days from now (UTC)
                starts_at = datetime.now(timezone.utc) + timedelta(days=7)

            # create party
            cur.execute(
                """
                INSERT INTO party (title, location, starts_at)
                VALUES (%s, %s, %s)
                RETURNING id, title, location, starts_at, started
                """,
                (party_title, location, starts_at),
            )
            party = dict(zip([d.name for d in cur.description], cur.fetchone()))
            party_id = party["id"]

            # create host member (distance 0, has_link true)
            pwd_hash = hash_password(password)
            cur.execute(
                """
                INSERT INTO member
                    (party_id, name, role, parent_id, distance, has_invite_link, phone, password_hash)
                VALUES
                    (%s, %s, 'host', NULL, 0, TRUE, %s, %s)
                RETURNING id, party_id, name, role, parent_id, distance, has_invite_link, phone
                """,
                (party_id, name, phone, pwd_hash),
            )
            host = dict(zip([d.name for d in cur.description], cur.fetchone()))
            host_id = host["id"]

            # host RSVP (pending)
            cur.execute(
                "INSERT INTO rsvp (party_id, member_id, status, approved) VALUES (%s, %s, 'pending', FALSE)",
                (party_id, host_id),
            )

            # host invite
            tok = new_token()
            cur.execute(
                "INSERT INTO invite (party_id, inviter_id, token) VALUES (%s, %s, %s) RETURNING token",
                (party_id, host_id, tok),
            )
            token_val = cur.fetchone()[0]
            host_invite = {"token": token_val, "url": f"/{party_id}/invite/{token_val}"}

            return {
                "member": {"id": host_id, "party_id": party_id, "name": name, "role": "host", "phone": phone},
                "party": party,
                "host_invite": host_invite,
            }

    except HTTPException as he:
        # client error → soft JSON
        return {"error": he.detail}
    except Exception as e:
        logger.exception("host_login_auto error")
        # shield unexpected server errors → still not a 500 to the client
        return {"error": "unexpected_error", "detail": str(e)}

# Optional: simple error logging
@app.middleware("http")
async def log_requests(request, call_next):
    try:
        return await call_next(request)
    except EndOfStream:
        # client aborted; ignore
        pass
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
# app.include_router(host_auth_router)  # disabled; /host/login is handled above
