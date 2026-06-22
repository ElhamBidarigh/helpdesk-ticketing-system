// backend/src/routes/users.routes.js
// لیست agent/admin ها — برای dropdown "assign to" توی frontend

const express = require("express");
const router  = express.Router();
const pool    = require("../db/pool");
const { authenticateToken, requireRole } = require("../middleware/auth");

router.use(authenticateToken);

// فقط admin/agent می‌تونن لیست کاربران رو ببینن (برای assignment)
router.get("/", requireRole("admin", "agent"), async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE role IN ('admin', 'agent') ORDER BY name"
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
