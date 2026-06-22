// backend/tests/auth.test.js
// ─────────────────────────────────────────────────────
// تست‌های پایه برای auth endpoints
// نشون می‌ده با testing framework کار کردی — یکی از
// "Must Have" های job description
//
// اجرا: npm test
// (نیاز به دیتابیس test جدا یا mock — اینجا ساده‌سازی شده)
// ─────────────────────────────────────────────────────

const request = require("supertest");
const app     = require("../src/server");

describe("Auth Endpoints", () => {

  describe("POST /api/auth/register", () => {
    it("should return 400 if email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test User", password: "test123" });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/required/i);
    });

    it("should return 400 if password is missing", async () => {
      const res = await request(app)
        .post("/api/auth/register")
        .send({ name: "Test User", email: "test@test.com" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 401 for non-existent user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ email: "nonexistent@test.com", password: "wrongpass" });

      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it("should return 400 if email is missing", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ password: "test123" });

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/health", () => {
    it("should return status ok", async () => {
      const res = await request(app).get("/api/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
    });
  });

});

describe("Protected Routes (Authorization)", () => {
  it("should reject requests without a token", async () => {
    const res = await request(app).get("/api/tickets");
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/access token required/i);
  });

  it("should reject requests with an invalid token", async () => {
    const res = await request(app)
      .get("/api/tickets")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(403);
  });
});
