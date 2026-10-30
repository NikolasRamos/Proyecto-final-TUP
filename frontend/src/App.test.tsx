// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { listTeams } from "./api/teams.api";
import { listTournaments } from "./api/tournaments.api";

vi.mock("./api/tournaments.api", () => ({
  createTournament: vi.fn(),
  deleteTournament: vi.fn(),
  downloadTournamentReport: vi.fn(),
  getTournament: vi.fn(),
  listTournaments: vi.fn(),
  updateTournament: vi.fn(),
  updateTournamentStatus: vi.fn(),
}));

vi.mock("./api/teams.api", () => ({
  createTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeam: vi.fn(),
  listTeams: vi.fn(),
  updateTeam: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listTournaments).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });
    vi.mocked(listTeams).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });
  });

  it("presenta el panel interno con textos editables", async () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Título X" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Panel interno")).toBeInTheDocument();
    expect(screen.getByText("Descripción X")).toBeInTheDocument();
    expect(screen.getByText("Partidas y resultados")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Módulos planificados" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Torneos", { selector: "li" })).toBeNull();
    expect(screen.queryByText("Equipos", { selector: "li" })).toBeNull();
    expect(
      await screen.findByText("Todavía no hay torneos para mostrar."),
    ).toBeInTheDocument();
  });

  it("muestra esqueletos accesibles mientras carga los datos", () => {
    vi.mocked(listTournaments).mockReturnValue(new Promise(() => undefined));
    vi.mocked(listTeams).mockReturnValue(new Promise(() => undefined));

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(screen.getByText("Cargando torneos…")).toBeInTheDocument();
    expect(screen.getByText("Cargando equipos…")).toBeInTheDocument();
  });

  it("muestra los torneos y equipos obtenidos desde la API", async () => {
    vi.mocked(listTournaments).mockResolvedValue({
      data: [
        {
          id: 101,
          name: "Torneo Apertura",
          description: "Competencia de prueba",
          modality: "league",
          maxParticipants: 16,
          registrationDeadline: "2026-11-01",
          startDate: "2026-11-05",
          endDate: "2026-12-10",
          status: "open",
          organizerId: 1,
          createdAt: "2026-10-13T12:00:00.000Z",
          updatedAt: "2026-10-13T12:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });
    vi.mocked(listTeams).mockResolvedValue({
      data: [
        {
          id: 201,
          name: "Los Halcones",
          description: "Equipo de prueba",
          captainId: 1,
          createdAt: "2026-10-13T12:00:00.000Z",
          updatedAt: "2026-10-13T12:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Torneo Apertura")).toBeInTheDocument();
    expect(await screen.findByText("Los Halcones")).toBeInTheDocument();
    expect(
      screen.getByText("Torneos registrados").nextElementSibling,
    ).toHaveTextContent("1");
    expect(
      screen.getByText("Equipos registrados").nextElementSibling,
    ).toHaveTextContent("1");
  });

  it("informa cuando una consulta a la API falla", async () => {
    vi.mocked(listTournaments).mockRejectedValue(
      new Error("El servidor no responde"),
    );

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/No se pudieron cargar los torneos/),
    ).toHaveTextContent("El servidor no responde");
    expect(
      await screen.findByText("Todavía no hay equipos para mostrar."),
    ).toBeInTheDocument();
  });

  it("traduce los errores de conexión del navegador", async () => {
    vi.mocked(listTeams).mockRejectedValue(new TypeError("Failed to fetch"));

    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText(/No se pudieron cargar los equipos/),
    ).toHaveTextContent("No pudimos conectarnos con el servidor.");
    expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
  });
});
