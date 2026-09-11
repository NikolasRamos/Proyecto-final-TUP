import request from "supertest";
import { describe, expect, it } from "vitest";

import app from "../app.js";

describe("GET /api/health", () => {
  it("informa que la API está disponible", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "gestion-torneos-api",
    });
  });
});
