# BACKEND: 

## Domain model & invariants

### Domain model

**Party**
- Root entity: defines the event.

**Member**
- Scoped to a Party.
- Identified by unique name within that party.
- Has role (host/guest), parent_id (null for host), distance, has_invite_link.

**Invite**
- Personalized token tied to inviter.
- Used once a new guest signs up → establishes parent/child relationship.

**RSVP**
- One per member.
- Tracks status (pending/yes/maybe/no), approval, and which child unlocked (if needed).

### Invariants
1. Unique name per party → (party_id, name) unique.
2. Exactly one RSVP per member per party → (party_id, member_id) unique in RSVP.
3. One host per party → exactly one member with role=host and parent_id=null.
4. Tree structure → every guest has exactly one parent (parent_id not null); no cycles.
5. Distance correctness → distance = parent.distance + 1; host distance = 0.
6. Invite issuance → if distance ≥ 3, has_invite_link=false (no Invite rows). 
7. RSVP approval → 
    - distance ≥ 3 and status=YES → approved=true immediately.
    - distance < 3 and status=YES → approved only after ≥1 child has approved YES; once true, never revoked.
8. Visibility → before start: member sees own state + name of child who unlocked them; after start: full roster + graph snapshot visible.
9. RSVP lock → after party.starts_at, RSVP updates blocked.

## API surface (URLs, payloads, responses)

### POST /parties

**Request Body:**
- `title` (string)
- `location` (string)
- `starts_at` (ISO datetime)
- `host_name` (string)

**Response:**
- `party`: `{ id, title, location, starts_at, started }`
- `host_member`: `{ id, name, role: "host", distance: 0, has_invite_link: true }`
- `host_invite`: `{ token, url }`

**Transaction Notes:**
1. Insert `Party`.
2. Insert host `Member` (`parent_id = null`, `distance = 0`).
3. Insert `Invite`.

---

### POST /join/:partyId/:token

**Request Body:**
- `name` (string)

**Response:**
- `member`: `{ id, name, role: "guest", parent_id, distance, has_invite_link }`
- `rsvp`: `{ status: "pending", approved: false }`
- `my_invite` (if `distance < 3`): `{ token, url }`

**Errors:**
- Invalid/expired token.
- Name already exists in the party.

**Transaction Notes:**
1. Validate token.
2. Create `Member` (set `parent` and `distance`).
3. Create `RSVP` (status: pending).
4. If `distance < 3`, create `Invite`.
5. All operations are performed in a single transaction.

---

### POST /login/:partyId

**Request Body:**
- `name` (string)

**Response:**
- `member`: `{ id, name, role, parent_id, distance, has_invite_link }`
- `rsvp`: `{ status, approved, approved_by_child_id? }`
- `my_invite` (if `distance < 3`): `{ token, url }`

**Errors:**
- Member not found.

**Notes:**
- No graph mutations.

---

### POST /parties/:partyId/rsvp

**Request Body:**
- `member_id` (string)
- `status` (enum: `yes | maybe | no`)

**Response:**
- `rsvp`: `{ status, approved, approved_by_child_id? }`
- `locked` (bool): `true` if the party has started.

**Errors:**
- Party already started (locked).
- Invalid status transition.

**Transaction Notes:**
1. If `now >= starts_at`, reject the request.
2. Update RSVP `status`.
3. If `distance >= 3` and `status = yes`, set `approved = true`.
4. If `distance < 3` and `status = yes`:
   - Check for any child RSVP with `status = yes` and `approved = true`.
   - If found, set `approved = true` and `approved_by_child_id`.
5. If a child transitions to `approved: yes`, re-check the parent in the same transaction (idempotent upsert).

---

### GET /parties/:partyId/me

**Query/Body:**
- `member_id` (or session)

**Response:**
- `member`: `{ id, name, role, distance, has_invite_link }`
- `rsvp`: `{ status, approved, approved_by_child_id? }`
- `unlocker_name` (string|null; only if approved via child).
- `my_invite` (if `distance < 3`): `{ token, url }`
- `party`: `{ id, starts_at, started }`

**Notes:**
- Before the party starts, only `unlocker_name` (single child) is exposed, not other details.

---

### GET /parties/:partyId/snapshot

**Response (pre-start):**
- `{ started: false }`

**Response (post-start):**
- `{ started: true, roster: [{ member_id, name, role, distance, rsvp_status, approved }...], edges: [{ parent_id, child_id }...], generated_at }`

**Transaction Notes:**
- On the first post-start call, compute and store the snapshot once.
- Subsequent reads return the stored snapshot.


## Storage layout & indexing plan
- minimal four-table design (Party, Member, Invite, RSVP)

### Database (Postgresql): 
- Your invite network is a tree (one parent per member). Relational tables with foreign keys handle this cleanly. You can keep a cached distance_from_host column so you rarely need graph traversals.
- Pros: Transactions, constraints, easy uniqueness (no duplicate names per party), recursive CTEs if you ever need on‑the‑fly distances, solid indexing. Scales from hobby → prod without re-architecture.
- Tooling: Use the native driver (pg in Node, psycopg in Python) and raw SQL migrations (literally .sql files). No ORM required.

# FRONTEND:

## Build Sequence (Milestone by Milestone)

### Bootstrap Service
- Set up environment configuration (`DATABASE_URL`), health route, and DB pool.

### Party Creation
- **POST /parties**: Insert `Party`, host `Member`, and host `Invite` (generate token via `secrets/crypto`).

### Join via Token
- **POST /join/:partyId/:token**: Single transaction to:
  - Create `Member` (set parent/distance).
  - Create `RSVP` (default `PENDING`).
  - If `distance < 3`, create their `Invite`.

### Login by Name
- **POST /login/:partyId**: Lookup `(party_id, name)` and return state.

### RSVP State Machine
- **POST /parties/:partyId/rsvp**: Enforce transitions, approval rules, and parent unlock in the same transaction.

### Me Endpoint
- **GET /parties/:partyId/me**: Self-scoped pre-start; includes unlocker name if any.

### Start Lock + Snapshot
- **GET /parties/:partyId/snapshot**: Lazy freeze (use `FOR UPDATE` on `Party`), then serve stored JSON.

### Visibility Enforcement
- Block any pre-start access to others’ names/roster.

### Idempotency & Races
- Use unique constraints.
- Lock `RSVP` rows with `FOR UPDATE`.
- Use predicate updates (e.g., `approved = false`).

### Minimal Tests
- **Manual**: Use `curl`/Postman flows:
  - Create → Join → YES/MAYBE/NO → Unlock → Lock.
- **Scriptable**: Add a couple of end-to-end test cases.