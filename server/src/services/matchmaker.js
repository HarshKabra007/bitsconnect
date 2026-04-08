/**
 * In-memory matching queue.
 *  - Pairs users sharing at least one interest tag.
 *  - Falls back to random match after FALLBACK_MS.
 *  - No messages stored. Only active-room bookkeeping.
 */
const { generateAlias, releaseAlias } = require("./alias");

const FALLBACK_MS = 15_000;

// queue entries: { socket, userId, interests: Set<string>, joinedAt }
const queue = [];
// activeRooms: roomId -> { a: socket, b: socket, aliases: { [socketId]: alias } }
const activeRooms = new Map();

function findMatch(entry) {
  // First pass: shared interest.
  if (entry.interests.size > 0) {
    for (let i = 0; i < queue.length; i++) {
      const other = queue[i];
      if (other.userId === entry.userId) continue;
      for (const tag of entry.interests) {
        if (other.interests.has(tag)) {
          queue.splice(i, 1);
          return other;
        }
      }
    }
  }
  // Fallback: random partner if they've been waiting long enough (or no tags).
  for (let i = 0; i < queue.length; i++) {
    const other = queue[i];
    if (other.userId === entry.userId) continue;
    const waited = Date.now() - other.joinedAt >= FALLBACK_MS;
    const noTags = entry.interests.size === 0 || other.interests.size === 0;
    if (waited || noTags) {
      queue.splice(i, 1);
      return other;
    }
  }
  return null;
}

function enqueue(socket, userId, interests = []) {
  // Remove any existing entry for this socket/user.
  removeFromQueue(socket);
  const entry = {
    socket,
    userId,
    interests: new Set(interests),
    joinedAt: Date.now(),
  };
  const partner = findMatch(entry);
  if (partner) return pair(entry, partner);
  queue.push(entry);
  return null;
}

function pair(a, b) {
  const roomId = `room_${a.socket.id}_${b.socket.id}_${Date.now()}`;
  const aliasA = generateAlias();
  const aliasB = generateAlias();
  a.socket.join(roomId);
  b.socket.join(roomId);
  a.socket.data.roomId = roomId;
  b.socket.data.roomId = roomId;
  a.socket.data.alias = aliasA;
  b.socket.data.alias = aliasB;
  a.socket.data.partnerUserId = b.userId;
  b.socket.data.partnerUserId = a.userId;
  a.socket.data.reported = false;
  b.socket.data.reported = false;
  activeRooms.set(roomId, { a: a.socket, b: b.socket });

  // One peer initiates the WebRTC offer to avoid both sides racing.
  a.socket.emit("matched", { roomId, yourAlias: aliasA, strangerAlias: aliasB, initiator: true });
  b.socket.emit("matched", { roomId, yourAlias: aliasB, strangerAlias: aliasA, initiator: false });
  return roomId;
}

function removeFromQueue(socket) {
  const idx = queue.findIndex((e) => e.socket.id === socket.id);
  if (idx >= 0) queue.splice(idx, 1);
}

function leaveRoom(socket, reason = "left") {
  const roomId = socket.data.roomId;
  if (!roomId) return;
  const room = activeRooms.get(roomId);
  if (!room) return;
  const other = room.a.id === socket.id ? room.b : room.a;
  if (other && other.connected) {
    other.emit("stranger-disconnected", { reason });
    releaseAlias(other.data.alias);
    other.leave(roomId);
    other.data.roomId = null;
    other.data.alias = null;
    other.data.partnerUserId = null;
  }
  releaseAlias(socket.data.alias);
  socket.leave(roomId);
  socket.data.roomId = null;
  socket.data.alias = null;
  socket.data.partnerUserId = null;
  activeRooms.delete(roomId);
}

function queueLength() {
  return queue.length;
}

module.exports = { enqueue, leaveRoom, removeFromQueue, activeRooms, queueLength };
