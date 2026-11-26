import { Op } from "sequelize";
import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import Tournament from "../models/Tournament.js";
import { useAuthenticatedRequests } from "./authenticated-request.js";

const managementRoutes = [
  ["post", "/api/tournaments"],
  ["put", "/api/tournaments/1"],
  ["patch", "/api/tournaments/1/status"],
  ["delete", "/api/tournaments/1"],
  ["get", "/api/tournaments/1/report"],
  ["get", "/api/tournaments/1/registrations"],
  ["post", "/api/tournaments/1/registrations"],
  ["delete", "/api/tournaments/1/registrations/1"],
  ["put", "/api/teams/1"],
  ["get", "/api/teams/1/members"],
  ["post", "/api/teams/1/members"],
  ["delete", "/api/teams/1/members/1"],
];

describe("Acceso público a torneos y equipos", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ...managementRoutes,
    ["post", "/api/teams"],
    ["delete", "/api/teams/1"],
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

describe("Acceso de participantes", () => {
  const participantRequest = useAuthenticatedRequests(app, "participante");

  it.each(managementRoutes)(
    "deniega el acceso a %s %s",
    async (method, path) => {
      await participantRequest()[method](path).expect(403);
    },
  );

  it("filtra los torneos también cuando el participante envía su token", async () => {
    const list = vi
      .spyOn(Tournament, "findAndCountAll")
      .mockResolvedValue({ count: 0, rows: [] });
    const detail = vi.spyOn(Tournament, "findOne").mockResolvedValue(null);

    await participantRequest().get("/api/tournaments?status=draft").expect(200);
    await participantRequest().get("/api/tournaments/1").expect(404);

    expect(list).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { status: { [Op.in]: [] } },
      }),
    );
    expect(detail).toHaveBeenCalledWith({
      where: { id: 1, status: { [Op.in]: ["open", "in_progress"] } },
    });
  });

  it("crea el equipo y registra al participante como primer integrante", async () => {
    const transaction = {};
    vi.spyOn(database, "transaction").mockImplementation((callback) =>
      callback(transaction),
    );
    const create = vi
      .spyOn(Team, "create")
      .mockResolvedValue({ id: 42, captainId: 1 });
    const addMember = vi
      .spyOn(TeamMember, "create")
      .mockResolvedValue({ id: 53 });

    const response = await participantRequest()
      .post("/api/teams")
      .send({ name: "Los Halcones" })
      .expect(201);

    expect(response.body.data.captainId).toBe(1);
    expect(create).toHaveBeenCalledWith(
      { name: "Los Halcones", captainId: 1 },
      { transaction },
    );
    expect(addMember).toHaveBeenCalledWith(
      { teamId: 42, userId: 1 },
      { transaction },
    );
  });

  it("rechaza un equipo con un capitán indicado por el participante", async () => {
    const create = vi.spyOn(Team, "create");

    await participantRequest()
      .post("/api/teams")
      .send({ name: "Los Halcones", captainId: 2 })
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });
});
