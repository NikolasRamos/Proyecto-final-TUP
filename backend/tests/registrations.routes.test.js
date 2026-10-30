import { nextTestId } from "./test-id.js";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "../services/registrations.service.js";

vi.mock("../services/registrations.service.js", () => ({
  listTournamentRegistrations: vi.fn(),
  registerTeamInTournament: vi.fn(),
  withdrawTeamFromTournament: vi.fn(),
}));

describe("POST /api/tournaments/:tournamentId/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inscribe un equipo en el torneo", async () => {
    const tournamentId = nextTestId();
    const teamId = nextTestId();
    const registration = {
      id: nextTestId(),
      tournamentId,
      teamId,
      status: "registered",
    };
    registerTeamInTournament.mockResolvedValue({
      outcome: "registered",
      registration,
    });

    const response = await request(app)
      .post(`/api/tournaments/${tournamentId}/registrations`)
      .send({ teamId });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Equipo inscrito correctamente",
      data: registration,
    });
    expect(registerTeamInTournament).toHaveBeenCalledWith(tournamentId, teamId);
  });

  it("rechaza un identificador de torneo que no es un entero positivo", async () => {
    const response = await request(app)
      .post("/api/tournaments/invalid-id/registrations")
      .send({ teamId: nextTestId() });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(registerTeamInTournament).not.toHaveBeenCalled();
  });

  it("rechaza un identificador de equipo que no es un entero positivo", async () => {
    const response = await request(app)
      .post(`/api/tournaments/${nextTestId()}/registrations`)
      .send({ teamId: "invalid-id" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Los datos de la inscripcion no son validos",
    );
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "teamId" })]),
    );
    expect(registerTeamInTournament).not.toHaveBeenCalled();
  });

  it.each([
    ["tournament_not_found", 404, "Torneo no encontrado"],
    ["team_not_found", 404, "Equipo no encontrado"],
    [
      "tournament_not_open",
      409,
      "El torneo no esta abierto para inscripciones",
    ],
    ["already_registered", 409, "El equipo ya esta inscrito en el torneo"],
    ["tournament_full", 409, "El torneo alcanzo su cupo maximo"],
  ])("responde correctamente para %s", async (outcome, status, message) => {
    registerTeamInTournament.mockResolvedValue({ outcome });

    const response = await request(app)
      .post(`/api/tournaments/${nextTestId()}/registrations`)
      .send({ teamId: nextTestId() });

    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message });
  });

  it("responde sin exponer detalles cuando falla la inscripcion", async () => {
    registerTeamInTournament.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await request(app)
      .post(`/api/tournaments/${nextTestId()}/registrations`)
      .send({ teamId: nextTestId() });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo inscribir el equipo",
    });
  });
});

describe("DELETE /api/tournaments/:tournamentId/registrations/:teamId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retira un equipo del torneo", async () => {
    const tournamentId = nextTestId();
    const teamId = nextTestId();
    const registration = {
      id: nextTestId(),
      tournamentId,
      teamId,
      status: "withdrawn",
    };
    withdrawTeamFromTournament.mockResolvedValue({
      outcome: "withdrawn",
      registration,
    });

    const response = await request(app).delete(
      `/api/tournaments/${tournamentId}/registrations/${teamId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Equipo retirado correctamente",
      data: registration,
    });
    expect(withdrawTeamFromTournament).toHaveBeenCalledWith(
      tournamentId,
      teamId,
    );
  });

  it("rechaza un identificador de torneo que no es un entero positivo", async () => {
    const response = await request(app).delete(
      `/api/tournaments/invalid-id/registrations/${nextTestId()}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(withdrawTeamFromTournament).not.toHaveBeenCalled();
  });

  it("rechaza un identificador de equipo que no es un entero positivo", async () => {
    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}/registrations/invalid-id`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(withdrawTeamFromTournament).not.toHaveBeenCalled();
  });

  it.each([
    ["tournament_not_found", 404, "Torneo no encontrado"],
    [
      "tournament_not_open",
      409,
      "El torneo no esta abierto para modificar inscripciones",
    ],
    ["registration_not_found", 404, "El equipo no esta inscrito en el torneo"],
    ["already_withdrawn", 409, "El equipo ya fue retirado del torneo"],
  ])("responde correctamente para %s", async (outcome, status, message) => {
    withdrawTeamFromTournament.mockResolvedValue({ outcome });

    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}/registrations/${nextTestId()}`,
    );

    expect(response.status).toBe(status);
    expect(response.body).toEqual({ message });
  });

  it("responde sin exponer detalles cuando falla el retiro", async () => {
    withdrawTeamFromTournament.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}/registrations/${nextTestId()}`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo retirar el equipo del torneo",
    });
  });
});

describe("GET /api/tournaments/:tournamentId/registrations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve las inscripciones activas por defecto", async () => {
    const tournamentId = nextTestId();
    const registrations = [
      {
        id: nextTestId(),
        status: "registered",
        team: { id: nextTestId(), name: "Los Halcones" },
      },
    ];
    listTournamentRegistrations.mockResolvedValue({
      outcome: "found",
      count: 1,
      registrations,
    });

    const response = await request(app).get(
      `/api/tournaments/${tournamentId}/registrations`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: registrations,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(listTournamentRegistrations).toHaveBeenCalledWith(tournamentId, {
      status: "registered",
      page: 1,
      limit: 10,
    });
  });

  it("permite consultar inscripciones retiradas y paginarlas", async () => {
    const tournamentId = nextTestId();
    listTournamentRegistrations.mockResolvedValue({
      outcome: "found",
      count: 12,
      registrations: [],
    });

    const response = await request(app).get(
      `/api/tournaments/${tournamentId}/registrations?status=withdrawn&page=2&limit=5`,
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
    expect(listTournamentRegistrations).toHaveBeenCalledWith(tournamentId, {
      status: "withdrawn",
      page: 2,
      limit: 5,
    });
  });

  it("rechaza un identificador de torneo que no es un entero positivo", async () => {
    const response = await request(app).get(
      "/api/tournaments/invalid-id/registrations",
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(listTournamentRegistrations).not.toHaveBeenCalled();
  });

  it("rechaza filtros y paginacion invalidos", async () => {
    const response = await request(app).get(
      `/api/tournaments/${nextTestId()}/registrations?status=unknown&page=0&limit=101`,
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Los filtros de inscripciones no son validos",
    );
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "status" }),
        expect.objectContaining({ field: "page" }),
        expect.objectContaining({ field: "limit" }),
      ]),
    );
    expect(listTournamentRegistrations).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    listTournamentRegistrations.mockResolvedValue({
      outcome: "tournament_not_found",
    });

    const response = await request(app).get(
      `/api/tournaments/${nextTestId()}/registrations`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Torneo no encontrado" });
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    listTournamentRegistrations.mockRejectedValue(
      new Error("database unavailable"),
    );

    const response = await request(app).get(
      `/api/tournaments/${nextTestId()}/registrations`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudieron obtener las inscripciones del torneo",
    });
  });
});
