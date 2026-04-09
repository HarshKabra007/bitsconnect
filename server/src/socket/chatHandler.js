const { enqueue, leaveRoom, removeFromQueue, activeRooms, queueLength } =
  require("../services/matchmaker");
const { fileReport, checkBan } = require("../services/moderation");
const { canSkip } = require("../middleware/rateLimiter");

const MAX_MSG_LEN = 2000;
const MAX_ROOM_MSGS = 20;

// Temporary in-memory message buffer per room (last 20 messages).
const roomMessages = new Map();

function pushRoomMessage(roomId, msg) {
  if (!roomMessages.has(roomId)) roomMessages.set(roomId, []);
  const buf = roomMessages.get(roomId);
  buf.push(msg);
  if (buf.length > MAX_ROOM_MSGS) buf.shift();
}

function getRoomContext(roomId) {
  const buf = roomMessages.get(roomId);
  if (!buf || buf.length === 0) return null;
  return JSON.stringify(buf);
}

function clearRoomMessages(roomId) {
  roomMessages.delete(roomId);
}

function sanitize(text) {
  if (typeof text !== "string") return "";
  return text
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, (c) => (c === "<" ? "&lt;" : "&gt;"))
    .slice(0, MAX_MSG_LEN);
}

function broadcastOnlineCount(io) {
  io.emit("online-count", { count: io.of("/").sockets.size });
}

function register(io) {
  io.on("connection", async (socket) => {
    socket.data.roomId = null;
    socket.data.alias = null;
    socket.data.partnerUserId = null;
    socket.data.reported = false;

    broadcastOnlineCount(io);

    // Block banned users at connect time.
    const ban = await checkBan(socket.userId);
    if (ban.banned) {
      socket.emit("error", { message: "You are banned." });
      return socket.disconnect(true);
    }

    socket.on("join-queue", ({ interests = [], gender = "other", preferGender = "anyone" } = {}) => {
      if (socket.data.roomId) return; // already in a chat
      enqueue(socket, socket.userId, {
        interests: Array.isArray(interests) ? interests.slice(0, 8) : [],
        gender: typeof gender === "string" ? gender : "other",
        preferGender: typeof preferGender === "string" ? preferGender : "anyone",
      });
      socket.emit("queue-position", { position: queueLength() });
    });

    socket.on("send-message", ({ roomId, content } = {}) => {
      if (!roomId || roomId !== socket.data.roomId) return;
      const safe = sanitize(content);
      if (!safe) return;
      pushRoomMessage(roomId, { alias: socket.data.alias, content: safe, timestamp: Date.now() });
      socket.to(roomId).emit("receive-message", {
        content: safe,
        timestamp: Date.now(),
      });
    });

    socket.on("typing", ({ roomId } = {}) => {
      if (roomId === socket.data.roomId) socket.to(roomId).emit("stranger-typing");
    });
    socket.on("stop-typing", ({ roomId } = {}) => {
      if (roomId === socket.data.roomId) socket.to(roomId).emit("stranger-stopped-typing");
    });

    // WebRTC signaling relay — server never inspects SDP/ICE.
    socket.on("webrtc-offer", ({ offer } = {}) => {
      if (socket.data.roomId) socket.to(socket.data.roomId).emit("webrtc-offer", { offer });
    });
    socket.on("webrtc-answer", ({ answer } = {}) => {
      if (socket.data.roomId) socket.to(socket.data.roomId).emit("webrtc-answer", { answer });
    });
    socket.on("webrtc-ice", ({ candidate } = {}) => {
      if (socket.data.roomId) socket.to(socket.data.roomId).emit("webrtc-ice", { candidate });
    });

    socket.on("skip", () => {
      if (!canSkip(socket.userId)) {
        return socket.emit("error", { message: "Slow down — too many skips." });
      }
      const roomId = socket.data.roomId;
      leaveRoom(socket, "skipped");
      if (roomId) clearRoomMessages(roomId);
    });

    socket.on("report", async ({ reason } = {}) => {
      if (!socket.data.roomId) return;
      if (socket.data.reported) {
        return socket.emit("error", { message: "Already reported this chat." });
      }
      const reportedId = socket.data.partnerUserId;
      if (!reportedId) return;
      try {
        const context = getRoomContext(socket.data.roomId);
        await fileReport({ reporterId: socket.userId, reportedId, reason, context });
        socket.data.reported = true;
        socket.emit("report-received");
      } catch (e) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("disconnect", () => {
      removeFromQueue(socket);
      const roomId = socket.data.roomId;
      leaveRoom(socket, "disconnect");
      if (roomId) clearRoomMessages(roomId);
      broadcastOnlineCount(io);
    });
  });
}

module.exports = { register };
