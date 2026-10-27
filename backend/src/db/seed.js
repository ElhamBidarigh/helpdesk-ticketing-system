require("dotenv").config();
const bcrypt = require("bcrypt");
const pool = require("./pool");
async function seed() {
  if (process.env.NODE_ENV === "production") throw new Error("Demo seed is disabled in production");
  const hash = await bcrypt.hash("password123", 10);
  for (const [name, email, role] of [
    ["Admin User", "admin@helpdesk.com", "admin"],
    ["Agent Sara", "sara@helpdesk.com", "agent"],
    ["Customer Ali", "ali@helpdesk.com", "user"],
  ]) {
    await pool.query(`INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role`, [name, email, hash, role]);
  }
}
seed().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => pool.end());
