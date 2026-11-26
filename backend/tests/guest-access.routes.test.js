import { Op } from "sequelize";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import Tournament from "../models/Tournament.js";

describe("Acceso público a torneos y equipos", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["post", "/api/tournaments"],
    ["put", "/api/tournaments/1"],
    ["patch", "/api/tournaments/1/status"],
    ["delete", "/api/tournaments/1"],
    ["get", "/api/tournaments/1/report"],
    ["get", "/api/tournaments/1/registrations"],
    ["post", "/api/tournaments/1/registrations"],
    ["delete", "/api/tournaments/1/registrations/1"],
    ["post", "/api/teams"],
    ["put", "/api/teams/1"],
    ["delete", "/api/teams/1"],
    ["get", "/api/teams/1/members"],
    ["post", "/api/teams/1/members"],
    ["delete", "/api/teams/1/members/1"],
  ])("exige iniciar sesión para %s %s", async (method, path) => {
    await request(app)[method](path).expect(401);
  });

  it.each([
    ["", ["open", "in_progress"]],
    ["&status=in_progress", ["in_progress"]],
    ["&status=draft", []],
  ])(
    "aplica la visibilidad a la búsqueda paginada %s",
    async (filter, statuses) => {
      const find = vi
        .spyOn(Tournament, "findAndCountAll")
        .mockResolvedValue({ count: 0, rows: [] });

      await request(app)
        .get(`/api/tournaments?search=copa&page=2&limit=5${filter}`)
        .expect("Cache-Control", "private, no-store")
        .expect(200);

      expect(find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            status: { [Op.in]: statuses },
            [Op.or]: [
              { name: { [Op.iLike]: "%copa%" } },
              { description: { [Op.iLike]: "%copa%" } },
            ],
          },
          limit: 5,
          offset: 5,
        }),
      );
    },
  );

  it("aplica la visibilidad también al abrir un torneo por ID", async () => {
    const find = vi.spyOn(Tournament, "findOne").mockResolvedValue(null);

    await request(app).get("/api/tournaments/1").expect(404);
    expect(find).toHaveBeenCalledWith({
      where: { id: 1, status: { [Op.in]: ["open", "in_progress"] } },
    });
  });
});
