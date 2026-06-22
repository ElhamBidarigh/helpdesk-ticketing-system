// backend/src/db/pool.js
// ─────────────────────────────────────────────────────
// PostgreSQL connection pool
//
// چرا Pool به جای یه connection ساده؟
// هر request یه connection جدید نمی‌گیره — از pool
// استفاده میشه که performance بهتری داره و تعداد
// connection های همزمان رو محدود می‌کنه
// ─────────────────────────────────────────────────────

const { Pool } = require("pg");

const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || "helpdesk",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  max:      20,                // حداکثر تعداد connection همزمان
  idleTimeoutMillis: 30000,
});

pool.on("error", (err) => {
  console.error("Unexpected database error:", err);
});

module.exports = pool;
