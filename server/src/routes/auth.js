const express = require("express");
const passport = require("../config/passport");
const { signToken, requireAuth } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { checkBan } = require("../services/moderation");

const router = express.Router();
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

router.get(
  "/google",
  authLimiter,
  passport.authenticate("google", { scope: ["profile", "email"], session: false }),
);

router.get("/google/callback", (req, res, next) => {
  passport.authenticate("google", { session: false }, async (err, user, info) => {
    if (err) return res.redirect(`${CLIENT_URL}/?error=server`);
    if (!user) {
      const reason = encodeURIComponent(info?.message || "Access denied");
      return res.redirect(`${CLIENT_URL}/?error=${reason}`);
    }
    const ban = await checkBan(user.id);
    if (ban.banned) {
      return res.redirect(`${CLIENT_URL}/?error=${encodeURIComponent("You are banned")}`);
    }
    const token = signToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.redirect(`${CLIENT_URL}/chat?token=${encodeURIComponent(token)}`);
  })(req, res, next);
});

router.get("/me", requireAuth, async (req, res) => {
  const ban = await checkBan(req.userId);
  if (ban.banned) return res.status(403).json({ error: "Banned", expiresAt: ban.expiresAt });
  res.json({ ok: true });
});

// Dev-only anonymous login — bypasses Google entirely.
if (process.env.NODE_ENV !== "production") {
  router.post("/dev", async (req, res) => {
    const crypto = require("crypto");
    const { prisma } = require("../config/db");
    const fakeEmail = `dev_${crypto.randomBytes(8).toString("hex")}@example.com`;
    const hashedEmail = crypto.createHash("sha256").update(fakeEmail).digest("hex");
    const user = await prisma.user.create({ data: { hashedEmail } });
    const token = signToken(user.id);
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ ok: true, token });
  });
}

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ ok: true });
});

module.exports = router;
