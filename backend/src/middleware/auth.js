// backend/src/middleware/auth.js
// ─────────────────────────────────────────────────────
// Middleware برای Authentication و Authorization
//
//  • authenticateToken → چک می‌کنه JWT معتبره
//  • requireRole(...)  → چک می‌کنه کاربر نقش لازم رو داره
//
// این دو middleware دقیقاً همون چیزیه که job description
// خواسته: "Implement authentication, authorization, and
// application security best practices"
// ─────────────────────────────────────────────────────

const { verifyToken } = require("../utils/jwt");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;  // { id, email, role } روی request ست میشه
    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token" });
  }
}

// Higher-order function — چند نقش مجاز رو می‌گیره
// مثال استفاده: requireRole("admin", "agent")
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Requires one of: ${allowedRoles.join(", ")}`,
      });
    }
    next();
  };
}

module.exports = { authenticateToken, requireRole };
