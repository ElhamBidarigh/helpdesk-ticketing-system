jest.mock("../src/db/pool", () => ({ query: jest.fn() }));
jest.mock("bcrypt", () => ({ hash: jest.fn(async () => "test-hash") }));
const request = require("supertest");
const pool = require("../src/db/pool");
const app = require("../src/server");
const { signToken } = require("../src/utils/jwt");
const ticket = { id: 1, created_by: 10, assigned_to: 20 };
const auth = (role, id) => "Bearer " + signToken({ id, email: "test@example.com", role });
beforeEach(() => {
  pool.query.mockReset();
  pool.query.mockImplementation(async q => ({ rows: q.includes("FROM tickets") ? [ticket] : [] }));
});
test("public registration cannot elevate role", async () => {
  pool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 99, role: "user" }] });
  const res = await request(app).post("/api/auth/register")
    .send({ name: "Test", email: "test@example.com", password: "password123", role: "admin" });
  expect(res.status).toBe(201);
  expect(pool.query.mock.calls[1][1][3]).toBe("user");
});
for (const [role, id] of [["user", 999], ["agent", 999]]) {
  for (const [method, path, body] of [["get", "/api/tickets/1"],
    ["get", "/api/tickets/1/comments"], ["post", "/api/tickets/1/comments", { body: "hello" }]]) {
    test(`${role} cannot ${method} unrelated ${path}`, async () => {
      const req = request(app)[method](path).set("Authorization", auth(role, id));
      const res = await (body ? req.send(body) : req);
      expect(res.status).toBe(403);
    });
  }
}
test("agent cannot update unrelated ticket", async () => {
  const res = await request(app).patch("/api/tickets/1").set("Authorization", auth("agent", 999)).send({ status: "closed" });
  expect(res.status).toBe(403);
});
for (const [role, id] of [["user", 10], ["agent", 20], ["admin", 1]]) {
  test(`${role} can read authorized ticket`, async () => {
    const res = await request(app).get("/api/tickets/1").set("Authorization", auth(role, id));
    expect(res.status).toBe(200);
  });
}
test("assigned agent cannot reassign tickets", async () => {
  const res = await request(app).patch("/api/tickets/1").set("Authorization", auth("agent", 20)).send({ assigned_to: 30 });
  expect(res.status).toBe(403);
});
test("admin can unassign a ticket explicitly", async () => {
  pool.query.mockResolvedValueOnce({ rows: [ticket] }).mockResolvedValueOnce({ rows: [{ ...ticket, assigned_to: null }] });
  const res = await request(app).patch("/api/tickets/1").set("Authorization", auth("admin", 1)).send({ assigned_to: null });
  expect(res.status).toBe(200);
  expect(pool.query.mock.calls[1][1][4]).toBe(true);
});
