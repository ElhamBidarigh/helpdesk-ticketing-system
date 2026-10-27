// backend/src/controllers/tickets.controller.js
// ─────────────────────────────────────────────────────
// CRUD operations برای Tickets با role-based filtering
//
// منطق دسترسی:
//  • admin → همه تیکت‌ها رو می‌بینه
//  • agent → فقط تیکت‌های assign شده به خودش
//  • user  → فقط تیکت‌هایی که خودش ساخته
// ─────────────────────────────────────────────────────

const pool = require("../db/pool");
const { canAccessTicket } = require("../policies/tickets");

async function authorizeTicket(req, res) {
  const result = await pool.query("SELECT * FROM tickets WHERE id = $1", [req.params.id]);
  const ticket = result.rows[0];
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return false; }
  if (!canAccessTicket(req.user, ticket)) {
    res.status(403).json({ error: "Access denied" }); return false;
  }
  return true;
}

// ── GET /api/tickets ───────────────────────────────────
async function getTickets(req, res) {
  const { role, id: userId } = req.user;
  const { status, priority } = req.query;  // optional filters از query string

  try {
    // پایه query — JOIN با users برای گرفتن اسم creator/assignee
    let query = `
      SELECT
        t.id, t.title, t.description, t.status, t.priority, t.category,
        t.created_at, t.updated_at,
        creator.name  AS created_by_name,
        assignee.name AS assigned_to_name
      FROM tickets t
      LEFT JOIN users creator  ON t.created_by  = creator.id
      LEFT JOIN users assignee ON t.assigned_to = assignee.id
      WHERE 1=1
    `;
    const params = [];

    // ── Role-based filtering ──────────────────────────
    if (role === "agent") {
      params.push(userId);
      query += ` AND t.assigned_to = $${params.length}`;
    } else if (role === "user") {
      params.push(userId);
      query += ` AND t.created_by = $${params.length}`;
    }
    // admin هیچ فیلتری نمی‌گیره — همه چیز رو می‌بینه

    // ── Optional query filters ────────────────────────
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    if (priority) {
      params.push(priority);
      query += ` AND t.priority = $${params.length}`;
    }

    query += " ORDER BY t.created_at DESC";

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Get tickets error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET /api/tickets/:id ───────────────────────────────
async function getTicketById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.*, creator.name AS created_by_name, assignee.name AS assigned_to_name
       FROM tickets t
       LEFT JOIN users creator  ON t.created_by  = creator.id
       LEFT JOIN users assignee ON t.assigned_to = assignee.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const ticket = result.rows[0];
    if (!canAccessTicket(req.user, ticket)) {
      return res.status(403).json({ error: "Access denied" });
    }

    res.json(ticket);
  } catch (err) {
    console.error("Get ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── POST /api/tickets ───────────────────────────────────
async function createTicket(req, res) {
  const { title, description, priority = "medium", category = "general" } = req.body;
  const createdBy = req.user.id;

  if (typeof title !== "string" || !title.trim() || title.length > 200
      || typeof description !== "string" || !description.trim() || description.length > 20000
      || !["low", "medium", "high", "urgent"].includes(priority)
      || typeof category !== "string" || category.length > 50) {
    return res.status(400).json({ error: "title and description are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO tickets (title, description, priority, category, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, priority, category, createdBy]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── PATCH /api/tickets/:id ─────────────────────────────
// فقط admin/agent می‌تونن status یا assignment رو تغییر بدن
async function updateTicket(req, res) {
  const { id } = req.params;
  const { status, priority, assigned_to } = req.body;

  try {
    if (!await authorizeTicket(req, res)) return;
    if ((status !== undefined && !["open", "in_progress", "resolved", "closed"].includes(status))
        || (priority !== undefined && !["low", "medium", "high", "urgent"].includes(priority))) {
      return res.status(400).json({ error: "Invalid status or priority" });
    }
    if (assigned_to !== undefined) {
      if (req.user.role !== "admin") return res.status(403).json({ error: "Only admins can assign tickets" });
      if (assigned_to !== null) {
        if (!Number.isInteger(assigned_to) || assigned_to <= 0) return res.status(400).json({ error: "Invalid assignee" });
        const agent = await pool.query("SELECT id FROM users WHERE id = $1 AND role = 'agent'", [assigned_to]);
        if (!agent.rows.length) return res.status(400).json({ error: "Assignee must be an agent" });
      }
    }
    const result = await pool.query(
      `UPDATE tickets
       SET status      = COALESCE($1, status),
           priority    = COALESCE($2, priority),
           assigned_to = CASE WHEN $5 THEN $3 ELSE assigned_to END,
           updated_at  = NOW()
       WHERE id = $4 AND ($6 = 'admin' OR assigned_to = $7)
       RETURNING *`,
      [status, priority, assigned_to, id, assigned_to !== undefined, req.user.role, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update ticket error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── GET /api/tickets/:id/comments ──────────────────────
async function getComments(req, res) {
  const { id } = req.params;

  try {
    if (!await authorizeTicket(req, res)) return;
    const result = await pool.query(
      `SELECT c.*, u.name AS user_name, u.role AS user_role
       FROM comments c
       JOIN users u ON c.user_id = u.id
       WHERE c.ticket_id = $1
       ORDER BY c.created_at ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

// ── POST /api/tickets/:id/comments ─────────────────────
async function addComment(req, res) {
  const { id } = req.params;
  const { body } = req.body;
  const userId = req.user.id;

  if (typeof body !== "string" || !body.trim() || body.length > 20000) {
    return res.status(400).json({ error: "Comment body is required" });
  }

  try {
    if (!await authorizeTicket(req, res)) return;
    const result = await pool.query(
      `INSERT INTO comments (ticket_id, user_id, body)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [id, userId, body]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = {
  getTickets, getTicketById, createTicket, updateTicket,
  getComments, addComment,
};
