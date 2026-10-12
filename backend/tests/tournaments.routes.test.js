import { randomUUID } from "node:crypto";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import {
  createTournament,
  deleteTournament,
  getTournamentById,
  listTournaments,
  updateTournament,
  updateTournamentStatus,
} from "../services/tournaments.service.js";

vi.mock("../services/tournaments.service.js", () => ({
  createTournament: vi.fn(),
  deleteTournament: vi.fn(),
  getTournamentById: vi.fn(),
  listTournaments: vi.fn(),
  updateTournament: vi.fn(),
  updateTournamentStatus: vi.fn(),
}));

const validPayload = {
  name: "Torneo de apertura",
  description: "Competencia inicial de la temporada",
  modality: "league",
  maxParticipants: 16,
  registrationDeadline: "2026-11-01",
  startDate: "2026-11-05",
  endDate: "2026-12-10",
  organizerId: randomUUID(),
};

describe("GET /api/tournaments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve la lista de torneos", async () => {
    const tournaments = [
      {
        id: randomUUID(),
        ...validPayload,
        status: "draft",
      },
    ];
    listTournaments.mockResolvedValue({ count: 1, rows: tournaments });

    const response = await request(app).get("/api/tournaments");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: tournaments,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(listTournaments).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
    });
  });

  it("devuelve una lista vacia cuando no hay torneos", async () => {
    listTournaments.mockResolvedValue({ count: 0, rows: [] });

    const response = await request(app).get("/api/tournaments");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    });
  });

  it("aplica filtros y paginacion", async () => {
    listTournaments.mockResolvedValue({ count: 25, rows: [] });

    const response = await request(app).get(
      "/api/tournaments?status=open&modality=league&page=2&limit=5",
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
    });
    expect(listTournaments).toHaveBeenCalledWith({
      status: "open",
      modality: "league",
      page: 2,
      limit: 5,
    });
  });

  it("rechaza filtros y paginacion invalidos", async () => {
    const response = await request(app).get(
      "/api/tournaments?status=unknown&page=0&limit=101",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Los filtros del listado no son validos",
    );
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "status" }),
        expect.objectContaining({ field: "page" }),
        expect.objectContaining({ field: "limit" }),
      ]),
    );
    expect(listTournaments).not.toHaveBeenCalled();
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    listTournaments.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get("/api/tournaments");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudieron obtener los torneos",
    });
  });
});

describe("GET /api/tournaments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el torneo solicitado", async () => {
    const tournamentId = randomUUID();
    const tournament = {
      id: tournamentId,
      ...validPayload,
      status: "draft",
    };
    getTournamentById.mockResolvedValue(tournament);

    const response = await request(app).get(`/api/tournaments/${tournamentId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: tournament });
    expect(getTournamentById).toHaveBeenCalledWith(tournamentId);
  });

  it("rechaza un identificador que no es UUID v4", async () => {
    const response = await request(app).get("/api/tournaments/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(getTournamentById).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    const tournamentId = randomUUID();
    getTournamentById.mockResolvedValue(null);

    const response = await request(app).get(`/api/tournaments/${tournamentId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Torneo no encontrado",
    });
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    const tournamentId = randomUUID();
    getTournamentById.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get(`/api/tournaments/${tournamentId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo obtener el torneo",
    });
  });
});

describe("POST /api/tournaments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un torneo valido", async () => {
    const createdTournament = {
      id: randomUUID(),
      ...validPayload,
      status: "draft",
    };
    createTournament.mockResolvedValue(createdTournament);

    const response = await request(app)
      .post("/api/tournaments")
      .send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Torneo creado correctamente",
      data: createdTournament,
    });
    expect(createTournament).toHaveBeenCalledWith(validPayload);
  });

  it("rechaza datos invalidos antes de llamar al servicio", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        maxParticipants: 1,
        registrationDeadline: "2026-11-06",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Los datos del torneo no son validos");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "maxParticipants" }),
        expect.objectContaining({ field: "registrationDeadline" }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("responde sin exponer detalles cuando falla la persistencia", async () => {
    createTournament.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .post("/api/tournaments")
      .send(validPayload);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo crear el torneo",
    });
  });
});

describe("PUT /api/tournaments/:id", () => {
  const updatePayload = {
    name: validPayload.name,
    description: "Descripcion actualizada",
    modality: validPayload.modality,
    maxParticipants: 20,
    registrationDeadline: validPayload.registrationDeadline,
    startDate: validPayload.startDate,
    endDate: validPayload.endDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza un torneo existente", async () => {
    const tournamentId = randomUUID();
    const updatedTournament = {
      id: tournamentId,
      ...updatePayload,
      organizerId: validPayload.organizerId,
      status: "draft",
    };
    updateTournament.mockResolvedValue(updatedTournament);

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(updatePayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Torneo actualizado correctamente",
      data: updatedTournament,
    });
    expect(updateTournament).toHaveBeenCalledWith(tournamentId, updatePayload);
  });

  it("rechaza un identificador que no es UUID v4", async () => {
    const response = await request(app)
      .put("/api/tournaments/not-a-uuid")
      .send(updatePayload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(updateTournament).not.toHaveBeenCalled();
  });

  it("rechaza datos invalidos antes de llamar al servicio", async () => {
    const response = await request(app)
      .put(`/api/tournaments/${randomUUID()}`)
      .send({
        ...updatePayload,
        name: "No",
        endDate: "2026-11-04",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Los datos del torneo no son validos");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "endDate" }),
      ]),
    );
    expect(updateTournament).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    const tournamentId = randomUUID();
    updateTournament.mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(updatePayload);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Torneo no encontrado",
    });
  });

  it("responde sin exponer detalles cuando falla la actualizacion", async () => {
    updateTournament.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .put(`/api/tournaments/${randomUUID()}`)
      .send(updatePayload);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo actualizar el torneo",
    });
  });
});

describe("PATCH /api/tournaments/:id/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza el estado de un torneo", async () => {
    const tournamentId = randomUUID();
    const tournament = {
      id: tournamentId,
      ...validPayload,
      status: "cancelled",
    };
    updateTournamentStatus.mockResolvedValue({
      outcome: "updated",
      tournament,
    });

    const response = await request(app)
      .patch(`/api/tournaments/${tournamentId}/status`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Estado del torneo actualizado correctamente",
      data: tournament,
    });
    expect(updateTournamentStatus).toHaveBeenCalledWith(
      tournamentId,
      "cancelled",
    );
  });

  it("rechaza un identificador que no es UUID v4", async () => {
    const response = await request(app)
      .patch("/api/tournaments/not-a-uuid/status")
      .send({ status: "cancelled" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(updateTournamentStatus).not.toHaveBeenCalled();
  });

  it("rechaza un estado desconocido", async () => {
    const response = await request(app)
      .patch(`/api/tournaments/${randomUUID()}/status`)
      .send({ status: "unknown" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("El estado del torneo no es valido");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "status" })]),
    );
    expect(updateTournamentStatus).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    updateTournamentStatus.mockResolvedValue({ outcome: "not_found" });

    const response = await request(app)
      .patch(`/api/tournaments/${randomUUID()}/status`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Torneo no encontrado" });
  });

  it("rechaza una transicion de estado no permitida", async () => {
    updateTournamentStatus.mockResolvedValue({
      outcome: "invalid_transition",
    });

    const response = await request(app)
      .patch(`/api/tournaments/${randomUUID()}/status`)
      .send({ status: "draft" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "El cambio de estado del torneo no esta permitido",
    });
  });

  it("responde sin exponer detalles cuando falla la actualizacion", async () => {
    updateTournamentStatus.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .patch(`/api/tournaments/${randomUUID()}/status`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo actualizar el estado del torneo",
    });
  });
});

describe("DELETE /api/tournaments/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("elimina un torneo en estado draft", async () => {
    const tournamentId = randomUUID();
    deleteTournament.mockResolvedValue({ outcome: "deleted" });

    const response = await request(app).delete(
      `/api/tournaments/${tournamentId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Torneo eliminado correctamente",
    });
    expect(deleteTournament).toHaveBeenCalledWith(tournamentId);
  });

  it("rechaza un identificador que no es UUID v4", async () => {
    const response = await request(app).delete("/api/tournaments/not-a-uuid");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(deleteTournament).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    deleteTournament.mockResolvedValue({ outcome: "not_found" });

    const response = await request(app).delete(
      `/api/tournaments/${randomUUID()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Torneo no encontrado" });
  });

  it("rechaza eliminar un torneo que ya no esta en draft", async () => {
    deleteTournament.mockResolvedValue({ outcome: "not_deletable" });

    const response = await request(app).delete(
      `/api/tournaments/${randomUUID()}`,
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Solo se pueden eliminar torneos en estado draft",
    });
  });

  it("responde sin exponer detalles cuando falla la eliminacion", async () => {
    deleteTournament.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).delete(
      `/api/tournaments/${randomUUID()}`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo eliminar el torneo",
    });
  });
});
