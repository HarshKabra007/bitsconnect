const { verifyToken } = require("./auth");

function parseCookie(header, name) {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const p of parts) {
    const [k, ...v] = p.split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

function socketAuth(socket, next) {
  const token =
    socket.handshake.auth?.token ||
    parseCookie(socket.handshake.headers?.cookie, "token");
  const payload = token && verifyToken(token);
  if (!payload) return next(new Error("Unauthorized"));
  socket.userId = payload.uid;
  next();
}

module.exports = { socketAuth };
