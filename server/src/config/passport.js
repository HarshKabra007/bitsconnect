const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const crypto = require("crypto");
const { prisma } = require("./db");

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "pilani.bits-pilani.ac.in";
const BYPASS = process.env.BYPASS_DOMAIN_CHECK === "true";

function hashEmail(email) {
  return crypto.createHash("sha256").update(email.toLowerCase().trim()).digest("hex");
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) return done(null, false, { message: "No email on Google profile." });

        const domain = email.split("@")[1]?.toLowerCase();
        if (!BYPASS && domain !== ALLOWED_DOMAIN) {
          return done(null, false, {
            message: "Only BITS Pilani - Pilani Campus email holders can access this platform.",
          });
        }

        const hashedEmail = hashEmail(email);
        const user = await prisma.user.upsert({
          where: { hashedEmail },
          update: {},
          create: { hashedEmail },
        });

        // Strip all identifying data — only return the internal id and ban state.
        return done(null, { id: user.id, isBanned: user.isBanned, banExpiresAt: user.banExpiresAt });
      } catch (err) {
        return done(err);
      }
    },
  ),
);
} else {
  console.warn("[passport] GOOGLE_CLIENT_ID/SECRET not set — Google OAuth disabled. Use /api/auth/dev for anonymous login.");
}

module.exports = passport;
