# Live Prayer — Streaming Implementation

A working implementation of the live video streaming core described in the
*Live Video Intercessory Prayer — Implementation Blueprint* (Kingdom
Companion), Sections 1–3: watch without an account, join/publish only with
one, and role-gated permissions enforced server-side.

**Provider:** [LiveKit](https://livekit.io) — open-source WebRTC SFU,
sub-second latency, self-hostable or LiveKit Cloud. Chosen per the
blueprint's own provider comparison as the best fit once the feature grows
past pure one-way broadcast into stage invites (Intercessors/Worship
Leaders) and future breakout rooms (Section 18). If your near-term need is
*strictly* one host broadcasting to a passive audience with no interactivity
roadmap, Amazon IVS is the cheaper alternative the blueprint flags — the
`server/` API is intentionally the only place that would need to change to
swap providers, since it's the sole thing issuing credentials to clients.

## What's actually implemented

- **`server/`** — Node/Express API that:
  - Registers/starts/ends prayer rooms (Host-only, enforced server-side)
  - Issues short-lived LiveKit access tokens with permissions derived from
    the caller's role (`server/auth.js`), never from client input:
    - No session → **Visitor**: subscribe-only, hidden, no chat
    - Member/Prayer Partner → subscribe + chat, cannot publish
    - Intercessor/Worship Leader/Host/Admin → can publish camera+mic
- **`client/`** — React + TypeScript app that:
  - Lists rooms and shows live status
  - Lets a Host start/end a session
  - Joins any live session and renders video grid, chat, and (if permitted)
    publish controls — using `@livekit/components-react`

This is the streaming mechanics only — chat moderation, prayer request
submission, notifications, and the rest of the blueprint's sections are not
built here; the token/role scaffolding is written so those slot in cleanly.

## Run it locally

```bash
# 1. Start a local LiveKit server (no cloud account needed for dev)
docker compose up

# 2. Backend
cd server
cp .env.example .env
# edit .env: LIVEKIT_API_KEY=devkey, LIVEKIT_API_SECRET=devsecret1234567890,
# LIVEKIT_URL=ws://localhost:7880
npm install
npm start   # or: node index.js

# 3. Frontend
cd client
cp .env.example .env
npm install
npm run dev   # http://localhost:5173
```

To go live for real: create a free project at cloud.livekit.io, put its API
key/secret/URL in `server/.env`, and skip the docker-compose step.

## Auth integration point

`server/auth.js`'s `resolveSession()` is a stand-in for Kingdom Companion's
real session lookup. Replace its body with your actual user/session store
call — everything downstream (role → grant mapping, room start/end
authorization) already works off whatever `{ userId, displayName, role }`
it returns.

## Production hardening still needed before shipping

- Swap the in-memory `rooms` Map in `server/index.js` for your real DB
  table (Section 10: Scheduling)
- Rate-limit `/api/rooms/:roomName/token` (Section 16)
- Add the low-bandwidth/audio-only fallback (Section 11) — LiveKit supports
  disabling video subscription per-participant on the client
- TLS termination in front of the API in any non-dev environment
- Recording/VOD (Section 18) via LiveKit's Egress API if you want replays
