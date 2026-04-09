const { prisma } = require("../config/db");

const VALID_REASONS = new Set(["Harassment", "Spam", "Inappropriate Content", "Other"]);
const BAN_THRESHOLD = 5;
const BAN_WINDOW_MS = 24 * 60 * 60 * 1000;

async function fileReport({ reporterId, reportedId, reason, context }) {
  if (!VALID_REASONS.has(reason)) throw new Error("Invalid reason");
  if (reporterId === reportedId) throw new Error("Cannot report self");

  await prisma.report.create({
    data: { reporterId, reportedId, reason, context: context || null },
  });

  // Count recent reports against the reported user.
  const since = new Date(Date.now() - BAN_WINDOW_MS);
  const count = await prisma.report.count({
    where: { reportedId, createdAt: { gte: since } },
  });

  if (count >= BAN_THRESHOLD) {
    await prisma.user.update({
      where: { id: reportedId },
      data: {
        isBanned: true,
        banExpiresAt: new Date(Date.now() + BAN_WINDOW_MS),
        reportCount: { increment: 1 },
      },
    });
  } else {
    await prisma.user.update({
      where: { id: reportedId },
      data: { reportCount: { increment: 1 } },
    });
  }
}

async function checkBan(userId) {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return { banned: false };
  if (u.isBanned && u.banExpiresAt && u.banExpiresAt < new Date()) {
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: false, banExpiresAt: null },
    });
    return { banned: false };
  }
  return { banned: u.isBanned, expiresAt: u.banExpiresAt };
}

module.exports = { fileReport, checkBan, VALID_REASONS };
