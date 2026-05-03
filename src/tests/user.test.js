const request = require("supertest");
const app = require("../app");
const pool = require("../db");

describe("POST /users", () => {
  afterAll(async () => {
    await pool.end();
  });

  afterEach(async () => {
    await pool.query(
      "DELETE FROM users WHERE email = 'test@example.com'"
    );
  });

  it("should create a new user and store in DB", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        name: "Test User",
        email: "test@example.com",
        password: "123456",
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.email).toBe("test@example.com");

    const dbUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      ["test@example.com"]
    );

    expect(dbUser.rows.length).toBe(1);
    expect(dbUser.rows[0].name).toBe("Test User");
  });
});