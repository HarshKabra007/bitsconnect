const { enqueue, leaveRoom, removeFromQueue, activeRooms, queueLength } =
  require("../services/matchmaker");
const { fileReport, checkBan } = require("../services/moderation");
const { canSkip } = require("../middleware/rateLimiter");

const MAX_MSG_LEN = 2000;

function sanitize(text) {
  if (typeof text !== "string") return "";
  // Strip control chars and basic HTML angle brackets for XSS safety.
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

    socket.on("join-queue", ({ interests = [] } = {}) => {
      if (socket.data.roomId) return; // already in a chat
      enqueue(socket, socket.userId, Array.isArray(interests) ? interests.slice(0, 8) : []);
      socket.emit("queue-position", { position: queueLength() });
    });

    socket.on("send-message", ({ roomId, content } = {}) => {
      if (!roomId || roomId !== socket.data.roomId) return;
      const safe = sanitize(content);
      if (!safe) return;
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
      leaveRoom(socket, "skipped");
    });

    socket.on("report", async ({ reason } = {}) => {
      if (!socket.data.roomId) return;
      if (socket.data.reported) {
        return socket.emit("error", { message: "Already reported this chat." });
      }
      const reportedId = socket.data.partnerUserId;
      if (!reportedId) return;
      try {
        await fileReport({ reporterId: socket.userId, reportedId, reason });
        socket.data.reported = true;
        socket.emit("report-received");
      } catch (e) {
        socket.emit("error", { message: e.message });
      }
    });

    socket.on("disconnect", () => {
      removeFromQueue(socket);
      leaveRoom(socket, "disconnect");
      broadcastOnlineCount(io);
    });
  });
}

module.exports = { register };
