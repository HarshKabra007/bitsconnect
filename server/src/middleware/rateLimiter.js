const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

// Simple in-memory per-user skip limiter (max 5 skips/min).
const skipBuckets = new Map();
function canSkip(userId) {
  const now = Date.now();
  const bucket = skipBuckets.get(userId) || [];
  const recent = bucket.filter((t) => now - t < 60_000);
  if (recent.length >= 5) {
    skipBuckets.set(userId, recent);
    return false;
  }
  recent.push(now);
  skipBuckets.set(userId, recent);
  return true;
}

// Cleanup stale skip buckets every 60s to prevent memory leak.
setInterval(() => {
  const now = Date.now();
  for (const [userId, bucket] of skipBuckets) {
    if (bucket.every((t) => now - t >= 60_000)) {
      skipBuckets.delete(userId);
    }
  }
}, 60_000);

module.exports = { authLimiter, reportLimiter, canSkip };
