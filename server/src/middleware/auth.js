const jwt = require("jsonwebtoken");

function signToken(userId) {
  return jwt.sign({ uid: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Unauthorized" });
  req.userId = payload.uid;
  next();
}

module.exports = { signToken, verifyToken, requireAuth };
