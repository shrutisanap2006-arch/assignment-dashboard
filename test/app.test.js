const request = require("supertest");
const app = require("../server");

describe("Assignment API", () => {
  test("GET /api/assignments returns an array", async () => {
    const response = await request(app).get("/api/assignments");

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test("POST /api/assignments creates an active assignment", async () => {
    const response = await request(app)
      .post("/api/assignments")
      .send({
        title: "Jenkins Practical",
        subject: "ASDD",
        dueDate: "2026-10-01",
        status: "Active"
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Jenkins Practical");
    expect(response.body.subject).toBe("ASDD");
    expect(response.body.status).toBe("Active");
  });
});