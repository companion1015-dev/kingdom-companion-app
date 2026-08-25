require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { AccessToken, RoomServiceClient, Room } = require('livekit-server-sdk');
const { resolveSession, isHostRole, isStageEligible, isModeratorRole } = require('./auth');

const {
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET,
  LIVEKIT_URL,
  PORT = 4000,
  CORS_ORIGIN = 'http://localhost:5173',
} = process.env;

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !LIVEKIT_URL) {
  console.error(
    '[fatal] LIVEKIT_API_KEY, LIVEKIT_API_SECRET and LIVEKIT_URL must be set — copy .env.example to .env and fill them in.'
  );
  process.exit(1);
}

const roomService = new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

const app = express();
app.use(express.json());
app.use(cors({ origin: CORS_ORIGIN.split(',').map((s) => s.trim()) }));

// Simple in-memory registry of "known" prayer rooms and their scheduled state.
// In production this is a table in Kingdom Companion's existing DB (Section 10:
// Scheduling — daily/weekly/monthly/etc rows), not memory. Kept in-memory here
// so the whole flow is runnable without provisioning a database for this demo.
const rooms = new Map(); // roomName -> { title, isLive, hostId, startedAt }

function roomNameToPublic(roomName) {
  const r = rooms.get(roomName);
  return {
    roomName,
    title: r?.title ?? roomName,
    isLive: !!r?.isLive,
    startedAt: r?.startedAt ?? null,
  };
}

/**
 * GET /api/rooms
 * Public — used by the homepage / /prayer-live page to show what's live or
 * scheduled next (Section 1, Section 10). No auth required to list.
 */
app.get('/api/rooms', async (_req, res) => {
  res.json(Array.from(rooms.keys()).map(roomNameToPublic));
});

/**
 * POST /api/rooms
 * Admin-only. Creates/registers a prayer room ahead of a scheduled session.
 * Body: { roomName, title }
 */
app.post('/api/rooms', async (req, res) => {
  const session = await resolveSession(req);
  if (!session || !(session.role === 'administrator' || session.role === 'super_admin')) {
    return res.status(403).json({ error: 'Only Administrators can schedule a room.' });
  }
  const { roomName, title } = req.body || {};
  if (!roomName || typeof roomName !== 'string') {
    return res.status(400).json({ error: 'roomName is required.' });
  }
  rooms.set(roomName, { title: title || roomName, isLive: false, hostId: null, startedAt: null });
  res.status(201).json(roomNameToPublic(roomName));
});

/**
 * POST /api/rooms/:roomName/start
 * Host-only (Section 3: Host "Starts/ends streams"). Creates the LiveKit room
 * if it doesn't exist yet and flips it to live.
 */
app.post('/api/rooms/:roomName/start', async (req, res) => {
  const session = await resolveSession(req);
  if (!session || !isHostRole(session.role)) {
    return res.status(403).json({ error: 'Only a Host can start this session.' });
  }
  const { roomName } = req.params;

  try {
    await roomService.createRoom({
      name: roomName,
      emptyTimeout: 10 * 60, // auto-close 10 min after everyone leaves
      departureTimeout: 20,
      maxParticipants: 0, // unlimited viewers; LiveKit subscriber fan-out handles scale
      metadata: JSON.stringify({ hostId: session.userId }),
    });
  } catch (err) {
    // createRoom is idempotent-ish on LiveKit Cloud (409 if exists) — treat as OK.
    if (!String(err.message || '').includes('already exists')) {
      console.error('createRoom failed', err);
      return res.status(502).json({ error: 'Could not start the room with the streaming provider.' });
    }
  }

  const existing = rooms.get(roomName) || { title: roomName };
  rooms.set(roomName, { ...existing, isLive: true, hostId: session.userId, startedAt: new Date().toISOString() });

  res.json(roomNameToPublic(roomName));
});

/**
 * POST /api/rooms/:roomName/end
 * Host-only. Ends the session for everyone (deletes the LiveKit room, which
 * disconnects all participants) and marks it not-live.
 */
app.post('/api/rooms/:roomName/end', async (req, res) => {
  const session = await resolveSession(req);
  if (!session || !isHostRole(session.role)) {
    return res.status(403).json({ error: 'Only a Host can end this session.' });
  }
  const { roomName } = req.params;

  try {
    await roomService.deleteRoom(roomName);
  } catch (err) {
    console.warn('deleteRoom warning (room may already be gone):', err.message);
  }

  const existing = rooms.get(roomName);
  if (existing) rooms.set(roomName, { ...existing, isLive: false, startedAt: null });

  res.json(roomNameToPublic(roomName));
});

/**
 * POST /api/rooms/:roomName/token
 * The core of Section 2 (User Journey): issues a LiveKit access token whose
 * permissions are derived server-side from the caller's role — never from
 * anything the client claims about itself.
 *
 *  - No/invalid session  -> Visitor: subscribe-only, hidden, no data channel.
 *    (This mirrors "can WATCH without an account, read-only, no chat.")
 *  - Member / Prayer Partner -> subscribe + data channel (chat/reactions),
 *    still cannot publish audio/video.
 *  - Intercessor / Worship Leader -> can be promoted onto camera by a Host;
 *    token grants publish rights but the Host still controls who's on stage
 *    at the LiveKit-room level via participant permission updates.
 *  - Host / Admin / SuperAdmin -> full publish + subscribe + data.
 *
 * Body (optional): { displayName }
 */
app.post('/api/rooms/:roomName/token', async (req, res) => {
  const { roomName } = req.params;
  const room = rooms.get(roomName);
  if (!room || !room.isLive) {
    return res.status(404).json({ error: 'This session is not currently live.' });
  }

  const session = await resolveSession(req);
  const displayName = (req.body && req.body.displayName) || session?.displayName;

  // Unauthenticated -> Visitor. Give them a stable-for-this-tab anonymous
  // identity so LiveKit can track presence without creating an account.
  const identity = session?.userId ?? `visitor-${cryptoRandomId()}`;
  const role = session?.role ?? 'visitor';

  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name: displayName || 'Guest',
    ttl: '4h',
  });

  const canPublish = isStageEligible(role);

  at.addGrant({
    room: roomName,
    roomJoin: true,
    canSubscribe: true,
    canPublish,
    canPublishData: role !== 'visitor', // visitors: read-only, no chat per Section 2/3
    // Only allow camera+mic; screen share is a future/host-only extension, not default.
    canPublishSources: canPublish ? ['camera', 'microphone'] : undefined,
    hidden: role === 'visitor', // visitors aren't shown as "participants" to others
  });

  const token = await at.toJwt();

  res.json({
    token,
    url: LIVEKIT_URL,
    identity,
    role,
    canPublish,
    canModerate: isModeratorRole(role),
  });
});

function cryptoRandomId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

app.listen(PORT, () => {
  console.log(`Prayer stream API listening on :${PORT}`);
  console.log(`LiveKit server: ${LIVEKIT_URL}`);
});
