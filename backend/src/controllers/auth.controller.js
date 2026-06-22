// backend/src/controllers/auth.controller.js
// ─────────────────────────────────────────────────────
// Register و Login
//
// Security best practices استفاده شده:
//  • bcrypt برای hash کردن password (هیچوقت plain text ذخیره نمیشه)
//  • Parameterized SQL queries (جلوگیری از SQL Injection)
// ─────────────────────────────────────────────────────

const bcrypt = require("bcrypt");
const pool   = require("../db/pool");
const { signToken } = require("../utils/jwt");

const SALT_ROUNDS = 10;

async function register(req, res) {
  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email, and password are required" });
  }

  try {
    // چک کن ایمیل تکراری نباشه
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Parameterized query — جلوگیری از SQL injection
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name, email, passwordHash, role]
    );

    const user  = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ user, token });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken(user);

    // password_hash رو هیچوقت توی response برنمی‌گردونیم
    delete user.password_hash;

    res.json({ user, token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

module.exports = { register, login };
