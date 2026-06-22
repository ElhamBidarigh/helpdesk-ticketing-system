// backend/src/server.js
// ─────────────────────────────────────────────────────
// نقطه شروع backend — Express app setup
// ─────────────────────────────────────────────────────

require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes    = require("./routes/auth.routes");
const ticketsRoutes = require("./routes/tickets.routes");
const usersRoutes   = require("./routes/users.routes");

const app  = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ──────────────────────────────────────
app.use(cors());            // اجازه میده React frontend صحبت کنه
app.use(express.json());    // parse کردن JSON body

// ── Routes ──────────────────────────────────────────
app.use("/api/auth",    authRoutes);
app.use("/api/tickets", ticketsRoutes);
app.use("/api/users",   usersRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error handling ──────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`✓ Helpdesk API running on http://localhost:${PORT}`);
});

module.exports = app;
