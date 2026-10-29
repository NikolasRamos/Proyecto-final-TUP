import { afterEach, describe, expect, it, vi } from "vitest";

import { listTeams } from "./teams.api";
import { createTournament, listTournaments } from "./tournaments.api";

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
});
