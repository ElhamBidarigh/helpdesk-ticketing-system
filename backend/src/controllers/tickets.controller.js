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

    // دسترسی چک: user فقط تیکت خودش رو ببینه
    const ticket = result.rows[0];
    if (req.user.role === "user" && ticket.created_by !== req.user.id) {
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

  if (!title || !description) {
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
    const result = await pool.query(
      `UPDATE tickets
       SET status      = COALESCE($1, status),
           priority    = COALESCE($2, priority),
           assigned_to = COALESCE($3, assigned_to),
           updated_at  = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, priority, assigned_to, id]
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

  if (!body) {
    return res.status(400).json({ error: "Comment body is required" });
  }

  try {
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
