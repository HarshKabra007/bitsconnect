const express = require("express");
const { requireAuth } = require("../middleware/auth");
const { reportLimiter } = require("../middleware/rateLimiter");
const { fileReport, VALID_REASONS } = require("../services/moderation");

const router = express.Router();

router.get("/reasons", (_req, res) => {
  res.json({ reasons: [...VALID_REASONS] });
});

router.post("/", requireAuth, reportLimiter, async (req, res) => {
  // Note: report via socket is preferred; this HTTP route is a fallback.
  const { reportedId, reason } = req.body || {};
  if (!reportedId || !reason) return res.status(400).json({ error: "Missing fields" });
  try {
    await fileReport({ reporterId: req.userId, reportedId, reason });
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
