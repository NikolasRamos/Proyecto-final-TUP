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
  ["get", "/api/tournaments/mine"],
  ["put", "/api/tournaments/1"],
  ["patch", "/api/tournaments/1/status"],
  ["delete", "/api/tournaments/1"],
  ["get", "/api/tournaments/1/report"],
  ["get", "/api/tournaments/1/registrations"],
  ["post", "/api/tournaments/1/registrations"],
  ["delete", "/api/tournaments/1/registrations/1"],
  ["put", "/api/teams/1"],
  ["patch", "/api/teams/1/captain"],
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
    ["get", "/api/teams/mine"],
    ["get", "/api/teams/membership-requests"],
    ["get", "/api/teams/1/membership"],
    ["post", "/api/teams/1/join-requests"],
    ["post", "/api/teams/1/invitations"],
    ["patch", "/api/teams/1/membership-requests/1"],
    ["get", "/api/notifications"],
    ["patch", "/api/notifications/1/read"],
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

describe("Acceso del organizador a torneos", () => {
  const organizerRequest = useAuthenticatedRequests(app);

  it("combina la búsqueda con torneos públicos y propios", async () => {
    const find = vi.spyOn(Tournament, "findAndCountAll").mockResolvedValue({
      count: 0,
      rows: [],
    });

    await organizerRequest().get("/api/tournaments?search=copa").expect(200);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          [Op.or]: [
            { name: { [Op.iLike]: "%copa%" } },
            { description: { [Op.iLike]: "%copa%" } },
          ],
          [Op.and]: [
            {
              [Op.or]: [
                { status: { [Op.in]: ["open", "in_progress"] } },
                { organizerAccountId: 1 },
              ],
            },
          ],
        },
      }),
    );
  });

  it("filtra Mis torneos por la cuenta de sesión", async () => {
    const find = vi.spyOn(Tournament, "findAndCountAll").mockResolvedValue({
      count: 0,
      rows: [],
    });

    await organizerRequest()
      .get("/api/tournaments/mine?status=draft&page=2&limit=5")
      .expect(200);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizerAccountId: 1, status: "draft" },
        offset: 5,
        limit: 5,
      }),
    );
  });

  it("permite gestionar un torneo de la cuenta", async () => {
    const update = vi.fn().mockResolvedValue({ id: 1, status: "open" });
    vi.spyOn(Tournament, "findByPk").mockResolvedValue({
      organizerAccountId: 1,
      status: "draft",
      update,
    });

    await organizerRequest()
      .patch("/api/tournaments/1/status")
      .send({ status: "open" })
      .expect(200);

    expect(update).toHaveBeenCalledWith({ status: "open" });
  });

  it.each(
    managementRoutes.filter(([, path]) =>
      path.startsWith("/api/tournaments/1"),
    ),
  )("bloquea la gestión de un torneo ajeno en %s %s", async (method, path) => {
    vi.spyOn(Tournament, "findByPk").mockResolvedValue({
      organizerAccountId: 2,
      status: "open",
    });

    await organizerRequest()[method](path).expect(403);
  });

  it("no concede permisos por coincidencia con el identificador anterior", async () => {
    vi.spyOn(Tournament, "findByPk").mockResolvedValue({
      organizerId: 1,
      organizerAccountId: null,
      status: "draft",
    });

    await organizerRequest().delete("/api/tournaments/1").expect(404);
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
    const transaction = { LOCK: { SHARE: "SHARE" } };
    vi.spyOn(database, "transaction").mockImplementation((callback) =>
      callback(transaction),
    );
    const create = vi
      .spyOn(Team, "create")
      .mockResolvedValue({ id: 42, captainId: 1, captainAccountId: 1 });
    const addMember = vi
      .spyOn(TeamMember, "create")
      .mockResolvedValue({ id: 53 });

    const response = await participantRequest()
      .post("/api/teams")
      .send({ name: "Los Halcones" })
      .expect(201);

    expect(response.body.data.captainId).toBe(1);
    expect(create).toHaveBeenCalledWith(
      { name: "Los Halcones", captainId: 1, captainAccountId: 1 },
      { transaction },
    );
    expect(addMember).toHaveBeenCalledWith(
      { teamId: 42, userId: 1, accountLinked: true },
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
