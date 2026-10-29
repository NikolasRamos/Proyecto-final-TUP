import { nextTestId } from "./test-id.js";

import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
} from "../services/teams.service.js";

vi.mock("../services/teams.service.js", () => ({
  addTeamMember: vi.fn(),
  createTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeamById: vi.fn(),
  listTeamMembers: vi.fn(),
  listTeams: vi.fn(),
  removeTeamMember: vi.fn(),
  updateTeam: vi.fn(),
}));

const validPayload = {
  name: "Los Halcones",
  description: "Equipo participante de la liga local",
  captainId: nextTestId(),
};

describe("GET /api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve la lista de equipos", async () => {
    const teams = [{ id: nextTestId(), ...validPayload }];
    listTeams.mockResolvedValue({ count: 1, rows: teams });

    const response = await request(app).get("/api/teams");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: teams,
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      },
    });
    expect(listTeams).toHaveBeenCalledWith({ page: 1, limit: 10 });
  });

  it("devuelve una lista vacia cuando no hay equipos", async () => {
    listTeams.mockResolvedValue({ count: 0, rows: [] });

    const response = await request(app).get("/api/teams");

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

  it("aplica la paginacion solicitada", async () => {
    listTeams.mockResolvedValue({ count: 12, rows: [] });

    const response = await request(app).get("/api/teams?page=2&limit=5");

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 12,
      totalPages: 3,
    });
    expect(listTeams).toHaveBeenCalledWith({ page: 2, limit: 5 });
  });

  it("rechaza una paginacion invalida", async () => {
    const response = await request(app).get("/api/teams?page=0&limit=101");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "La paginacion del listado no es valida",
    );
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "page" }),
        expect.objectContaining({ field: "limit" }),
      ]),
    );
    expect(listTeams).not.toHaveBeenCalled();
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    listTeams.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get("/api/teams");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudieron obtener los equipos",
    });
  });
});

describe("GET /api/teams/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve el equipo solicitado", async () => {
    const teamId = nextTestId();
    const team = { id: teamId, ...validPayload };
    getTeamById.mockResolvedValue(team);

    const response = await request(app).get(`/api/teams/${teamId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: team });
    expect(getTeamById).toHaveBeenCalledWith(teamId);
  });

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app).get("/api/teams/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(getTeamById).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    const teamId = nextTestId();
    getTeamById.mockResolvedValue(null);

    const response = await request(app).get(`/api/teams/${teamId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    const teamId = nextTestId();
    getTeamById.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get(`/api/teams/${teamId}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo obtener el equipo",
    });
  });
});

describe("POST /api/teams", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("crea un equipo valido", async () => {
    const createdTeam = {
      id: nextTestId(),
      ...validPayload,
    };
    createTeam.mockResolvedValue(createdTeam);

    const response = await request(app).post("/api/teams").send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Equipo creado correctamente",
      data: createdTeam,
    });
    expect(createTeam).toHaveBeenCalledWith(validPayload);
  });

  it("rechaza datos invalidos antes de llamar al servicio", async () => {
    const response = await request(app)
      .post("/api/teams")
      .send({
        ...validPayload,
        name: "AB",
        captainId: "invalid-id",
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Los datos del equipo no son validos");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: "name" }),
        expect.objectContaining({ field: "captainId" }),
      ]),
    );
    expect(createTeam).not.toHaveBeenCalled();
  });

  it("responde sin exponer detalles cuando falla la persistencia", async () => {
    createTeam.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).post("/api/teams").send(validPayload);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo crear el equipo",
    });
  });
});

describe("PUT /api/teams/:id", () => {
  const updatePayload = {
    name: "Los Halcones renovados",
    description: "Descripcion actualizada del equipo",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("actualiza un equipo existente", async () => {
    const teamId = nextTestId();
    const updatedTeam = {
      id: teamId,
      ...updatePayload,
      captainId: validPayload.captainId,
    };
    updateTeam.mockResolvedValue(updatedTeam);

    const response = await request(app)
      .put(`/api/teams/${teamId}`)
      .send(updatePayload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Equipo actualizado correctamente",
      data: updatedTeam,
    });
    expect(updateTeam).toHaveBeenCalledWith(teamId, updatePayload);
  });

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app)
      .put("/api/teams/invalid-id")
      .send(updatePayload);

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("rechaza datos invalidos antes de llamar al servicio", async () => {
    const response = await request(app)
      .put(`/api/teams/${nextTestId()}`)
      .send({ ...updatePayload, name: "AB" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Los datos del equipo no son validos");
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "name" })]),
    );
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    const teamId = nextTestId();
    updateTeam.mockResolvedValue(null);

    const response = await request(app)
      .put(`/api/teams/${teamId}`)
      .send(updatePayload);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("responde sin exponer detalles cuando falla la actualizacion", async () => {
    updateTeam.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .put(`/api/teams/${nextTestId()}`)
      .send(updatePayload);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo actualizar el equipo",
    });
  });
});

describe("DELETE /api/teams/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("elimina un equipo existente", async () => {
    const teamId = nextTestId();
    deleteTeam.mockResolvedValue({ outcome: "deleted" });

    const response = await request(app).delete(`/api/teams/${teamId}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Equipo eliminado correctamente",
    });
    expect(deleteTeam).toHaveBeenCalledWith(teamId);
  });

  it("rechaza un identificador que no es un entero positivo", async () => {
    const response = await request(app).delete("/api/teams/invalid-id");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(deleteTeam).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    const teamId = nextTestId();
    deleteTeam.mockResolvedValue({ outcome: "team_not_found" });

    const response = await request(app).delete(`/api/teams/${teamId}`);

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("responde 409 cuando el equipo tiene inscripciones registradas", async () => {
    const teamId = nextTestId();
    deleteTeam.mockResolvedValue({ outcome: "has_registrations" });

    const response = await request(app).delete(`/api/teams/${teamId}`);

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "No se puede eliminar un equipo con inscripciones registradas",
    });
  });

  it("responde sin exponer detalles cuando falla la eliminacion", async () => {
    deleteTeam.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).delete(`/api/teams/${nextTestId()}`);

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo eliminar el equipo",
    });
  });
});

describe("POST /api/teams/:teamId/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("agrega un integrante al equipo", async () => {
    const teamId = nextTestId();
    const userId = nextTestId();
    const membership = { id: nextTestId(), teamId, userId };
    addTeamMember.mockResolvedValue({ outcome: "added", membership });

    const response = await request(app)
      .post(`/api/teams/${teamId}/members`)
      .send({ userId });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      message: "Integrante agregado correctamente",
      data: membership,
    });
    expect(addTeamMember).toHaveBeenCalledWith(teamId, userId);
  });

  it("rechaza un identificador de equipo que no es un entero positivo", async () => {
    const response = await request(app)
      .post("/api/teams/invalid-id/members")
      .send({ userId: nextTestId() });

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(addTeamMember).not.toHaveBeenCalled();
  });

  it("rechaza un identificador de usuario que no es un entero positivo", async () => {
    const response = await request(app)
      .post(`/api/teams/${nextTestId()}/members`)
      .send({ userId: "invalid-id" });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Los datos del integrante no son validos",
    );
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "userId" })]),
    );
    expect(addTeamMember).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    addTeamMember.mockResolvedValue({ outcome: "team_not_found" });

    const response = await request(app)
      .post(`/api/teams/${nextTestId()}/members`)
      .send({ userId: nextTestId() });

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("responde 409 cuando el usuario ya pertenece al equipo", async () => {
    addTeamMember.mockResolvedValue({ outcome: "already_member" });

    const response = await request(app)
      .post(`/api/teams/${nextTestId()}/members`)
      .send({ userId: nextTestId() });

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "El usuario ya pertenece al equipo",
    });
  });

  it("responde sin exponer detalles cuando falla la operacion", async () => {
    addTeamMember.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app)
      .post(`/api/teams/${nextTestId()}/members`)
      .send({ userId: nextTestId() });

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo agregar el integrante",
    });
  });
});

describe("GET /api/teams/:teamId/members", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("devuelve los integrantes del equipo", async () => {
    const teamId = nextTestId();
    const members = [
      {
        id: nextTestId(),
        userId: nextTestId(),
        isCaptain: true,
        joinedAt: "2026-10-12T12:00:00.000Z",
      },
    ];
    listTeamMembers.mockResolvedValue({ outcome: "found", members });

    const response = await request(app).get(`/api/teams/${teamId}/members`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: members });
    expect(listTeamMembers).toHaveBeenCalledWith(teamId);
  });

  it("devuelve una lista vacia cuando el equipo no tiene integrantes", async () => {
    listTeamMembers.mockResolvedValue({ outcome: "found", members: [] });

    const response = await request(app).get(
      `/api/teams/${nextTestId()}/members`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
  });

  it("rechaza un identificador de equipo que no es un entero positivo", async () => {
    const response = await request(app).get("/api/teams/invalid-id/members");

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(listTeamMembers).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    listTeamMembers.mockResolvedValue({ outcome: "team_not_found" });

    const response = await request(app).get(
      `/api/teams/${nextTestId()}/members`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("responde sin exponer detalles cuando falla la consulta", async () => {
    listTeamMembers.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).get(
      `/api/teams/${nextTestId()}/members`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudieron obtener los integrantes del equipo",
    });
  });
});

describe("DELETE /api/teams/:teamId/members/:userId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("elimina un integrante del equipo", async () => {
    const teamId = nextTestId();
    const userId = nextTestId();
    removeTeamMember.mockResolvedValue({ outcome: "removed" });

    const response = await request(app).delete(
      `/api/teams/${teamId}/members/${userId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      message: "Integrante eliminado correctamente",
    });
    expect(removeTeamMember).toHaveBeenCalledWith(teamId, userId);
  });

  it("rechaza un identificador de equipo que no es un entero positivo", async () => {
    const response = await request(app).delete(
      `/api/teams/invalid-id/members/${nextTestId()}`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del equipo no es valido",
    });
    expect(removeTeamMember).not.toHaveBeenCalled();
  });

  it("rechaza un identificador de integrante que no es un entero positivo", async () => {
    const response = await request(app).delete(
      `/api/teams/${nextTestId()}/members/invalid-id`,
    );

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      message: "El identificador del integrante no es valido",
    });
    expect(removeTeamMember).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el equipo no existe", async () => {
    removeTeamMember.mockResolvedValue({ outcome: "team_not_found" });

    const response = await request(app).delete(
      `/api/teams/${nextTestId()}/members/${nextTestId()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: "Equipo no encontrado" });
  });

  it("impide eliminar al capitan", async () => {
    removeTeamMember.mockResolvedValue({
      outcome: "captain_cannot_be_removed",
    });

    const response = await request(app).delete(
      `/api/teams/${nextTestId()}/members/${nextTestId()}`,
    );

    expect(response.status).toBe(409);
    expect(response.body).toEqual({
      message: "El capitan no puede ser eliminado del equipo",
    });
  });

  it("responde 404 cuando el usuario no pertenece al equipo", async () => {
    removeTeamMember.mockResolvedValue({ outcome: "member_not_found" });

    const response = await request(app).delete(
      `/api/teams/${nextTestId()}/members/${nextTestId()}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      message: "El usuario no pertenece al equipo",
    });
  });

  it("responde sin exponer detalles cuando falla la eliminacion", async () => {
    removeTeamMember.mockRejectedValue(new Error("database unavailable"));

    const response = await request(app).delete(
      `/api/teams/${nextTestId()}/members/${nextTestId()}`,
    );

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo eliminar el integrante",
    });
  });
});
