import { nextTestId } from "./test-id.js";

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
  isTeamTournament: true,
  minTeamMembers: 2,
  maxTeamMembers: 5,
  registrationDeadline: "2026-11-01",
  startDate: "2026-11-05",
  endDate: "2026-12-10",
  organizerId: nextTestId(),
};

describe("GET /api/tournaments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve la lista de torneos", async () => {
    const tournaments = [
      {
        id: nextTestId(),
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
      sortBy: "createdAt",
      order: "desc",
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

  it("aplica busqueda, filtros, ordenamiento y paginacion", async () => {
    listTournaments.mockResolvedValue({ count: 25, rows: [] });

    const response = await request(app).get(
      "/api/tournaments?search=apertura&status=open&modality=league&page=2&limit=5&sortBy=name&order=asc",
    );

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
    });
    expect(listTournaments).toHaveBeenCalledWith({
      search: "apertura",
      status: "open",
      modality: "league",
      page: 2,
      limit: 5,
      sortBy: "name",
      order: "asc",
    });
  });

  it("rechaza filtros y paginacion invalidos", async () => {
    const response = await request(app).get(
      "/api/tournaments?status=unknown&page=0&limit=101&sortBy=unknown&order=sideways",
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
        expect.objectContaining({ field: "sortBy" }),
        expect.objectContaining({ field: "order" }),
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
    const tournamentId = nextTestId();
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

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app).get("/api/tournaments/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(getTournamentById).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    const tournamentId = nextTestId();
    getTournamentById.mockResolvedValue(null);

    const response = await request(app).get(`/api/tournaments/${tournamentId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Torneo no encontrado",
    });
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    const tournamentId = nextTestId();
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
      id: nextTestId(),
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

  it.each(["league", "single_elimination", "free_for_all", "gauntlet"])(
    "acepta el formato %s",
    async (modality) => {
      const payload = { ...validPayload, modality };
      const createdTournament = {
        id: nextTestId(),
        ...payload,
        status: "draft",
      };
      createTournament.mockResolvedValue(createdTournament);

      const response = await request(app)
        .post("/api/tournaments")
        .send(payload);

      expect(response.status).toBe(201);
      expect(createTournament).toHaveBeenCalledWith(payload);
    },
  );

  it("acepta una configuracion valida de Grupos + Playoff", async () => {
    const payload = {
      ...validPayload,
      modality: "groups_playoff",
      maxParticipants: 20,
      playoffSpots: 8,
      groupCount: 4,
      maxParticipantsPerGroup: 5,
    };
    createTournament.mockResolvedValue({
      id: nextTestId(),
      ...payload,
      status: "draft",
    });

    const response = await request(app).post("/api/tournaments").send(payload);

    expect(response.status).toBe(201);
    expect(createTournament).toHaveBeenCalledWith(payload);
  });

  it("rechaza Grupos + Playoff sin su configuracion", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({ ...validPayload, modality: "groups_playoff" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "playoffSpots" }),
        expect.objectContaining({ field: "groupCount" }),
        expect.objectContaining({ field: "maxParticipantsPerGroup" }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("rechaza configuracion de grupos en otro formato", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        playoffSpots: 8,
        groupCount: 4,
        maxParticipantsPerGroup: 4,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "playoffSpots",
          message: "Esta configuracion solo corresponde a Grupos + Playoff",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("acepta una configuracion valida del formato Suizo", async () => {
    const payload = {
      ...validPayload,
      modality: "swiss",
      maxParticipants: 16,
      swissRounds: 5,
    };
    createTournament.mockResolvedValue({
      id: nextTestId(),
      ...payload,
      status: "draft",
    });

    const response = await request(app).post("/api/tournaments").send(payload);

    expect(response.status).toBe(201);
    expect(createTournament).toHaveBeenCalledWith(payload);
  });

  it("rechaza un torneo Suizo sin cantidad de rondas", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({ ...validPayload, modality: "swiss" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "swissRounds" }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("rechaza rondas del formato Suizo en otra modalidad", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({ ...validPayload, swissRounds: 5 });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "swissRounds",
          message: "Esta configuracion solo corresponde al formato Suizo",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("aplica la estrategia de Liga al validar el cupo", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        modality: "league",
        maxParticipants: 2,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxParticipants",
          message: "Una liga necesita al menos 3 participantes",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("aplica la estrategia de Eliminacion simple al validar el cupo", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        modality: "single_elimination",
        maxParticipants: 6,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxParticipants",
          message:
            "La eliminacion simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...)",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("aplica la estrategia de Free-for-all al validar el cupo", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        modality: "free_for_all",
        maxParticipants: 2,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxParticipants",
          message: "Un torneo Free-for-all necesita al menos 3 participantes",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("acepta el minimo definido por la estrategia de Gauntlet", async () => {
    const payload = {
      ...validPayload,
      modality: "gauntlet",
      maxParticipants: 2,
    };
    createTournament.mockResolvedValue({
      id: nextTestId(),
      ...payload,
      status: "draft",
    });

    const response = await request(app).post("/api/tournaments").send(payload);

    expect(response.status).toBe(201);
    expect(createTournament).toHaveBeenCalledWith(payload);
  });

  it("crea un torneo individual sin limites de equipo", async () => {
    const individualPayload = {
      ...validPayload,
      isTeamTournament: false,
      minTeamMembers: null,
      maxTeamMembers: null,
    };
    const createdTournament = {
      id: nextTestId(),
      ...individualPayload,
      status: "draft",
    };
    createTournament.mockResolvedValue(createdTournament);

    const response = await request(app)
      .post("/api/tournaments")
      .send(individualPayload);

    expect(response.status).toBe(201);
    expect(createTournament).toHaveBeenCalledWith(individualPayload);
  });

  it("rechaza un torneo individual con limites de equipo", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        isTeamTournament: false,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "minTeamMembers" }),
        expect.objectContaining({ field: "maxTeamMembers" }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("rechaza un torneo por equipos sin limites", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        minTeamMembers: null,
        maxTeamMembers: null,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "minTeamMembers" }),
        expect.objectContaining({ field: "maxTeamMembers" }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("rechaza un maximo de integrantes menor que el minimo", async () => {
    const response = await request(app)
      .post("/api/tournaments")
      .send({
        ...validPayload,
        minTeamMembers: 5,
        maxTeamMembers: 3,
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: "maxTeamMembers",
          message: "El maximo de integrantes no puede ser menor que el minimo",
        }),
      ]),
    );
    expect(createTournament).not.toHaveBeenCalled();
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
    isTeamTournament: validPayload.isTeamTournament,
    minTeamMembers: validPayload.minTeamMembers,
    maxTeamMembers: validPayload.maxTeamMembers,
    registrationDeadline: validPayload.registrationDeadline,
    startDate: validPayload.startDate,
    endDate: validPayload.endDate,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza un torneo existente", async () => {
    const tournamentId = nextTestId();
    const updatedTournament = {
      id: tournamentId,
      ...updatePayload,
      organizerId: validPayload.organizerId,
      status: "draft",
    };
    updateTournament.mockResolvedValue({
      outcome: "updated",
      tournament: updatedTournament,
    });

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

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app)
      .put("/api/tournaments/invalid-id")
      .send(updatePayload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(updateTournament).not.toHaveBeenCalled();
  });

  it("rechaza datos invalidos antes de llamar al servicio", async () => {
    const response = await request(app)
      .put(`/api/tournaments/${nextTestId()}`)
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
    const tournamentId = nextTestId();
    updateTournament.mockResolvedValue({ outcome: "not_found" });

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(updatePayload);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "Torneo no encontrado",
    });
  });

  it("conserva la compatibilidad con torneos anteriores sin limites", async () => {
    const tournamentId = nextTestId();
    const legacyPayload = {
      ...updatePayload,
      minTeamMembers: null,
      maxTeamMembers: null,
    };
    const updatedTournament = {
      id: tournamentId,
      ...legacyPayload,
      organizerId: validPayload.organizerId,
      status: "open",
    };
    updateTournament.mockResolvedValue({
      outcome: "updated",
      tournament: updatedTournament,
    });

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(legacyPayload);

    expect(response.status).toBe(200);
    expect(updateTournament).toHaveBeenCalledWith(tournamentId, legacyPayload);
  });

  it("conserva Grupos + Playoff anteriores sin configuracion", async () => {
    const tournamentId = nextTestId();
    const legacyPayload = {
      ...updatePayload,
      modality: "groups_playoff",
      maxParticipants: 16,
      playoffSpots: null,
      groupCount: null,
      maxParticipantsPerGroup: null,
    };
    const updatedTournament = {
      id: tournamentId,
      ...legacyPayload,
      organizerId: validPayload.organizerId,
      status: "open",
    };
    updateTournament.mockResolvedValue({
      outcome: "updated",
      tournament: updatedTournament,
    });

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(legacyPayload);

    expect(response.status).toBe(200);
    expect(updateTournament).toHaveBeenCalledWith(tournamentId, legacyPayload);
  });

  it("conserva torneos Suizos anteriores sin cantidad de rondas", async () => {
    const tournamentId = nextTestId();
    const legacyPayload = {
      ...updatePayload,
      modality: "swiss",
      maxParticipants: 16,
      swissRounds: null,
    };
    const updatedTournament = {
      id: tournamentId,
      ...legacyPayload,
      organizerId: validPayload.organizerId,
      status: "open",
    };
    updateTournament.mockResolvedValue({
      outcome: "updated",
      tournament: updatedTournament,
    });

    const response = await request(app)
      .put(`/api/tournaments/${tournamentId}`)
      .send(legacyPayload);

    expect(response.status).toBe(200);
    expect(updateTournament).toHaveBeenCalledWith(tournamentId, legacyPayload);
  });

  it("responde 409 cuando se intenta cambiar una regla bloqueada", async () => {
    updateTournament.mockResolvedValue({ outcome: "participation_locked" });

    const response = await request(app)
      .put(`/api/tournaments/${nextTestId()}`)
      .send(updatePayload);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message:
        "La configuracion de participacion no puede cambiarse despues de abrir las inscripciones",
    });
  });

  it("responde sin exponer detalles cuando falla la actualizacion", async () => {
    updateTournament.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .put(`/api/tournaments/${nextTestId()}`)
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
    const tournamentId = nextTestId();
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

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app)
      .patch("/api/tournaments/invalid-id/status")
      .send({ status: "cancelled" });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(updateTournamentStatus).not.toHaveBeenCalled();
  });

  it("rechaza un estado desconocido", async () => {
    const response = await request(app)
      .patch(`/api/tournaments/${nextTestId()}/status`)
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
      .patch(`/api/tournaments/${nextTestId()}/status`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Torneo no encontrado" });
  });

  it("rechaza una transicion de estado no permitida", async () => {
    updateTournamentStatus.mockResolvedValue({
      outcome: "invalid_transition",
    });

    const response = await request(app)
      .patch(`/api/tournaments/${nextTestId()}/status`)
      .send({ status: "draft" });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "El cambio de estado del torneo no esta permitido",
    });
  });

  it("responde sin exponer detalles cuando falla la actualizacion", async () => {
    updateTournamentStatus.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .patch(`/api/tournaments/${nextTestId()}/status`)
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
    const tournamentId = nextTestId();
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

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app).delete("/api/tournaments/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del torneo no es valido",
    });
    expect(deleteTournament).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    deleteTournament.mockResolvedValue({ outcome: "not_found" });

    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Torneo no encontrado" });
  });

  it("rechaza eliminar un torneo que ya no esta en draft", async () => {
    deleteTournament.mockResolvedValue({ outcome: "not_deletable" });

    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}`,
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "Solo se pueden eliminar torneos en estado draft",
    });
  });

  it("responde sin exponer detalles cuando falla la eliminacion", async () => {
    deleteTournament.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).delete(
      `/api/tournaments/${nextTestId()}`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo eliminar el torneo",
    });
  });
});
