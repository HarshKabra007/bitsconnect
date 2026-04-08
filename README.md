# BITSConnect

Anonymous Omegle-style chat for BITS Pilani — Pilani Campus students.

## Privacy first
- Google OAuth, restricted to `@pilani.bits-pilani.ac.in`.
- Only a SHA-256 hash of the email is stored. No names, no pictures, no Google IDs.
- Chat messages are **never** written to disk — they live only in memory during the active connection.
- Each chat generates a fresh random alias (e.g. `CosmicPanda42`).

## Stack
- Client: React (Vite) + Tailwind, Socket.IO client, React Router
- Server: Node + Express, Passport (Google OAuth), Socket.IO, Prisma + PostgreSQL
- Auth: JWT in an httpOnly cookie

## Run locally

```bash
# 1. Start Postgres
docker compose up -d

# 2. Server
cd server
cp .env.example .env     # fill in GOOGLE_CLIENT_ID/SECRET + JWT_SECRET
npm install
npx prisma db push
npm run dev              # http://localhost:3000

# 3. Client
cd ../client
npm install
npm run dev              # http://localhost:5173
```

## Google OAuth setup
1. Google Cloud Console → OAuth consent screen → External (or Internal if Google Workspace).
2. Create OAuth Client ID → Web application.
3. Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
4. Paste the client ID + secret into `server/.env`.

For dev testing without a BITS email, set `BYPASS_DOMAIN_CHECK=true` in `server/.env`. **Never enable this in production.**

## What's built
- [x] Google OAuth with domain restriction + hashed-email-only storage
- [x] JWT cookie auth + Socket.IO auth handshake
- [x] In-memory matching queue with interest-tag priority
- [x] 1-on-1 anonymous chat with typing indicators
- [x] Skip / disconnect flow
- [x] Report system with ban on threshold
- [x] Dark-mode-first mobile-responsive UI

## What to harden before production
- HTTPS + Nginx reverse proxy
- `express-rate-limit` is wired on auth/report routes; tune limits for traffic
- Helmet, CSRF tokens on state-changing routes
- Redis adapter for multi-server Socket.IO scaling
- Monitoring / health checks
