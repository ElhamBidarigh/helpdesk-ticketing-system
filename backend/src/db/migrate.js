// backend/src/db/migrate.js
// ─────────────────────────────────────────────────────
// اجرای schema.sql روی دیتابیس
// استفاده: npm run migrate
// ─────────────────────────────────────────────────────

require("dotenv").config();
const fs   = require("fs");
const path = require("path");
const pool = require("./pool");

async function migrate() {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf8");

  try {
    await pool.query(schema);
    console.log("✓ Database migrated successfully");
  } catch (err) {
    console.error("✗ Migration failed:", err.message);
  } finally {
    await pool.end();
  }
}

migrate();
