# Plan: Migrate SQLite → PostgreSQL on GCP Free Tier

Superseded by the current Vercel + Neon deployment path. See [docs/vercel-deployment-guide.md](vercel-deployment-guide.md).

## Goal

Move the local SQLite database to PostgreSQL on a GCP e2-micro VM (always free tier), and deploy the Next.js app on the same VM behind Caddy with automatic HTTPS.

---

## Phase 1: GCP Infrastructure

- [ ] **P1.1** Create e2-micro VM in an always-free zone:
  ```
  gcloud compute instances create gcp-computer \
    --machine-type=e2-micro \
    --image-family=ubuntu-2404-lts \
    --image-project=ubuntu-os-cloud \
    --zone=us-west1-b \
    --boot-disk-size=30GB \
    --boot-disk-type=pd-standard
  ```
- [ ] **P1.2** Create firewall rules for HTTP (80), HTTPS (443, `0.0.0.0/0`), and SSH (22, home IP only).
- [ ] **P1.3** Reserve a static external IP and assign to the VM.
  ```
  gcloud compute addresses create gcp-computer-ip --region=us-west1
  ```
- [ ] **P1.4** Configure DNS — point a domain A record at the static IP.

---

## Phase 2: VM Provisioning

- [ ] **P2.1** SSH into the VM.
- [ ] **P2.2** Install PostgreSQL 16:
  ```
  sudo apt update && sudo apt install -y postgresql-16
  ```
- [ ] **P2.3** Create database `gcp_computer` and a non-superuser role with password auth on `localhost` only.
  ```sql
  CREATE ROLE gcp_computer WITH LOGIN PASSWORD '<generated-password>';
  CREATE DATABASE gcp_computer OWNER gcp_computer;
  ```
- [ ] **P2.4** Tune `postgresql.conf` for 1GB RAM:
  ```
  shared_buffers = 256MB
  effective_cache_size = 512MB
  maintenance_work_mem = 64MB
  work_mem = 8MB
  ```
- [ ] **P2.5** Lock down `pg_hba.conf` — only `local` and `127.0.0.1` md5 auth.
- [ ] **P2.6** Install Node.js 22 LTS (NodeSource or nvm).
- [ ] **P2.7** Install Caddy:
  ```
  sudo apt install -y caddy
  ```
- [ ] **P2.8** Create `/etc/caddy/Caddyfile`:
  ```
  example.com {
      reverse_proxy localhost:3000
  }
  ```
  Caddy auto-provisions Let's Encrypt TLS.
- [ ] **P2.9** Restart Caddy and verify HTTPS works from a browser.
- [ ] **P2.10** Clone the repo to `/opt/gcp-computer` and run `npm ci && npm run build`.
- [ ] **P2.11** Create `/etc/systemd/system/gcp-computer.service`:
  ```ini
  [Unit]
  Description=GCP Computer Next.js App
  After=network.target postgresql.service

  [Service]
  Type=simple
  User=gcp-computer
  WorkingDirectory=/opt/gcp-computer
  ExecStart=/usr/bin/node /opt/gcp-computer/.next/standalone/server.js
  Environment=DATABASE_URL=postgresql://gcp_computer:password@localhost:5432/gcp_computer
  Environment=NODE_ENV=production
  Restart=on-failure

  [Install]
  WantedBy=multi-user.target
  ```
- [ ] **P2.12** Enable and start the service.

---

## Phase 3: Code Migration (SQLite → PostgreSQL)

- [ ] **P3.1** Install `pg` package:
  ```
  npm install pg
  npm install -D @types/pg
  ```
- [ ] **P3.2** Rewrite `src/db/index.ts`:
  - Replace `node:sqlite` singleton with `pg.Pool` singleton.
  - Export async `getPool()` and a `query()` helper.
  - Read `DATABASE_URL` from environment.
  - Run migrations on first connection.
- [ ] **P3.3** Create `src/db/migrations/` directory:
  - `001_initial.sql` — PostgreSQL dialect of the schema:
    - `TEXT PRIMARY KEY` stays
    - `DATETIME` → `TIMESTAMPTZ`
    - `CURRENT_TIMESTAMP` stays
    - `connection_info TEXT` → `connection_info JSONB`
    - Add `_migrations` tracking table
- [ ] **P3.4** Update SQL parameter syntax in every query:
  - All `?` → `$1`, `$2`, etc. (PostgreSQL positional params)
- [ ] **P3.5** Add `await` at every call site across 11 files:

  | File | Changes |
  |---|---|
  | `src/db/index.ts` | Complete rewrite |
  | `src/db/schema.sql` | Delete (replaced by migrations) |
  | `src/app/api/auth/[...nextauth]/route.ts` | 6 queries: `?`→`$N`, add `await` |
  | `src/app/api/chats/route.ts` | 2 queries: correlated subquery adaptation |
  | `src/app/api/chats/[id]/route.ts` | 7 queries + wrap sequential deletes in transaction |
  | `src/app/api/agent/route.ts` | 3 queries |
  | `src/app/api/sandboxes/execute/route.ts` | 1 JOIN query |
  | `src/app/api/sandboxes/[id]/route.ts` | 1 JOIN query |
  | `src/app/api/sandboxes/mount/route.ts` | 1 JOIN query |
  | `src/app/api/sandboxes/sleep/route.ts` | 1 JOIN query |
  | `src/services/sandbox/manager.ts` | 12 queries — most complex file, add tx for INSERT+INSERT sequences |
  | `src/app/dashboard/layout.tsx` | 1 query — make server component `async` |
  | `src/app/dashboard/chat/[id]/page.tsx` | 2 queries — make server component `async` |

- [ ] **P3.6** Update return value handling:
  - `db.prepare(sql).get(...)` → `(await pool.query(sql, params)).rows[0]`
  - `db.prepare(sql).all(...)` → `(await pool.query(sql, params)).rows`
  - `db.prepare(sql).run(...)` → `await pool.query(sql, params)`
- [ ] **P3.7** Add `DATABASE_URL` to environment config — for production build, this becomes a systemd `Environment` directive. For local dev, `.env.local`.
- [ ] **P3.8** Write a data migration script (`scripts/migrate-data.mjs`):
  - Reads existing `database.db` with `node:sqlite`
  - Dumps users, chats, messages, sandbox_instances, chat_sandboxes
  - Inserts into PostgreSQL with `pg`
  - Idempotent (skips existing rows by ID)
- [ ] **P3.9** Remove `node:sqlite` from `dependencies` in `package.json` (if it's not needed elsewhere).
- [ ] **P3.10** Verify `npm run build` succeeds and `npm run lint` passes.

---

## Phase 4: Migration & Verification

- [ ] **P4.1** On the VM, run the data migration script to import existing data.
- [ ] **P4.2** Start the Next.js app and verify:
  - Login (Google OAuth + credentials) works
  - Chat list loads with correct ordering
  - Messages render properly
  - Sandbox create/list/execute/stop lifecycle works
  - Idle sandbox reaper runs correctly
- [ ] **P4.3** Test HTTPS via Caddy with a browser visit.
- [ ] **P4.4** Test app restart (data persists).
- [ ] **P4.5** Set up `pg_dump` cron job for nightly backups to Cloud Storage.

---

## Edge Cases & Risks

| Risk | Mitigation |
|---|---|
| **No test coverage** — every change is manual | Verify each endpoint manually after migration. Write smoke tests before touching code (optional but recommended). |
| **Sequential writes not wrapped in transactions** | Add `BEGIN`/`COMMIT` in `manager.ts` for INSERT+INSERT and INSERT+UPDATE sequences. PostgreSQL enforces atomicity. |
| **Server component data fetching** | `layout.tsx` and `page.tsx` use `getDb()` synchronously — need to become `async`. Next.js supports async server components, but the data flow needs verification. |
| **Correlated subquery in chats list** | Same SQL pattern works in PostgreSQL. May need `LIMIT 1` instead of `TOP 1` (already uses `LIMIT`). |
| **Timezone handling** | `DATETIME` → `TIMESTAMPTZ` — existing data uses UTC. Verify timestamps display correctly. |
| **VM out of memory** | e2-micro has 1GB RAM. Next.js + PostgreSQL + Caddy should fit, but may need `--max-old-space-size=512` for Node. |
| **Let's Encrypt rate limits** | Caddy handles this automatically. Test with staging CA first if needed. |
