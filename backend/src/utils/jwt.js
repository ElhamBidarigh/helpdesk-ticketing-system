// backend/src/utils/jwt.js
// ─────────────────────────────────────────────────────
// توابع کمکی برای JWT — صدور و verify کردن token
// ─────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");

const JWT_SECRET  = process.env.JWT_SECRET || "dev-secret-change-in-production";
const JWT_EXPIRES = "24h";

function signToken(user) {
  // payload شامل اطلاعاتی که توی هر request نیاز داریم
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
