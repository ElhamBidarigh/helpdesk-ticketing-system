// backend/src/routes/tickets.routes.js
// ─────────────────────────────────────────────────────
// همه route ها نیاز به authentication دارن
// تغییر status/assignment فقط admin/agent مجازن
// ─────────────────────────────────────────────────────

const express = require("express");
const router  = express.Router();
const { authenticateToken, requireRole } = require("../middleware/auth");
const {
  getTickets, getTicketById, createTicket, updateTicket,
  getComments, addComment,
} = require("../controllers/tickets.controller");

// همه route های زیر authentication لازم دارن
router.use(authenticateToken);
router.param("id", (req, res, next, value) => {
  const id = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid ticket ID" });
  }
  next();
});

router.get("/",      getTickets);
router.get("/:id",   getTicketById);
router.post("/",     createTicket);

// فقط admin و agent می‌تونن update کنن (status, assignment)
router.patch("/:id", requireRole("admin", "agent"), updateTicket);

router.get("/:id/comments",  getComments);
router.post("/:id/comments", addComment);

module.exports = router;
