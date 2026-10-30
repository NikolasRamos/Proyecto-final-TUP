import { afterEach, describe, expect, it, vi } from "vitest";

import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "./registrations.api";
import {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam,
} from "./teams.api";
import {
  createTournament,
  deleteTournament,
  downloadTournamentReport,
  getTournament,
  listTournaments,
  updateTournament,
  updateTournamentStatus,
} from "./tournaments.api";

const emptyPage = {
  data: [],
  pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
};

describe("API de recursos", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("consulta los últimos torneos con paginación", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(emptyPage),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(listTournaments()).resolves.toEqual(emptyPage);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments?page=1&limit=5",
      expect.any(Object),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("Accept")).toBe("application/json");
  });

  it("envía búsqueda, filtros y ordenamiento al listar torneos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(emptyPage),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listTournaments({
      search: "apertura",
      status: "open",
      modality: "league",
      page: 2,
      limit: 20,
      sortBy: "name",
      order: "asc",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments?page=2&limit=20&search=apertura&status=open&modality=league&sortBy=name&order=asc",
      expect.any(Object),
    );
  });

  it("consulta los últimos equipos con paginación", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(emptyPage),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(listTeams()).resolves.toEqual(emptyPage);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/teams?page=1&limit=5",
      expect.any(Object),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("Accept")).toBe("application/json");
  });

  it("envía la búsqueda al listar equipos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(emptyPage),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listTeams({ search: "halcones", page: 2, limit: 10 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/teams?page=2&limit=10&search=halcones",
      expect.any(Object),
    );
  });

  it("crea, consulta, actualiza y elimina equipos", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        message: "Operación correcta",
        data: { id: 201 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const createPayload = {
      name: "Los Halcones",
      description: null,
      captainId: 1,
    };
    const updatePayload = {
      name: "Halcones renovados",
      description: "Descripción actualizada",
    };

    await createTeam(createPayload);
    await getTeam(201);
    await updateTeam(201, updatePayload);
    await deleteTeam(201);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/teams",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(createPayload),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/api/teams/201",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3000/api/teams/201",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(updatePayload),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      "http://localhost:3000/api/teams/201",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("envía los datos necesarios para crear un torneo", async () => {
    const tournament = {
      id: 101,
      name: "Torneo Apertura",
      description: null,
      modality: "league" as const,
      maxParticipants: 16,
      registrationDeadline: "2026-11-01",
      startDate: "2026-11-05",
      endDate: "2026-12-10",
      status: "draft" as const,
      organizerId: 1,
      createdAt: "2026-10-13T12:00:00.000Z",
      updatedAt: "2026-10-13T12:00:00.000Z",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: vi.fn().mockResolvedValue({
        message: "Torneo creado correctamente",
        data: tournament,
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const payload = {
      name: tournament.name,
      description: tournament.description,
      modality: tournament.modality,
      maxParticipants: tournament.maxParticipants,
      registrationDeadline: tournament.registrationDeadline,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      organizerId: tournament.organizerId,
    };

    await createTournament(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(new Headers(request.headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("consulta un torneo por su identificador", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ data: { id: 101 } }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getTournament(101);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments/101",
      expect.any(Object),
    );
  });

  it("actualiza los datos editables de un torneo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        message: "Torneo actualizado correctamente",
        data: { id: 101 },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const payload = {
      name: "Torneo actualizado",
      description: null,
      modality: "league" as const,
      maxParticipants: 20,
      registrationDeadline: "2026-11-01",
      startDate: "2026-11-05",
      endDate: "2026-12-10",
    };

    await updateTournament(101, payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments/101",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    );
  });

  it("elimina un torneo por su identificador", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        message: "Torneo eliminado correctamente",
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await deleteTournament(101);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments/101",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("cambia el estado de un torneo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        message: "Estado actualizado",
        data: { id: 101, status: "open" },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await updateTournamentStatus(101, "open");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments/101/status",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "open" }),
      }),
    );
  });

  it("lista, crea y retira inscripciones de un torneo", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue(emptyPage),
    });
    vi.stubGlobal("fetch", fetchMock);

    await listTournamentRegistrations(101);
    await registerTeamInTournament(101, 201);
    await withdrawTeamFromTournament(101, 201);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/tournaments/101/registrations?status=registered&page=1&limit=100",
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/api/tournaments/101/registrations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ teamId: 201 }),
      }),
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      "http://localhost:3000/api/tournaments/101/registrations/201",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("descarga el reporte PDF de un torneo", async () => {
    const report = new Blob(["%PDF-1.3"], { type: "application/pdf" });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: vi.fn().mockResolvedValue(report),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(downloadTournamentReport(101)).resolves.toBe(report);
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/tournaments/101/report",
      {
        headers: { Accept: "application/pdf" },
      },
    );
  });
});
