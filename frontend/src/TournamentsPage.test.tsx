// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
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

const tournament = {
  id: 101,
  name: "Torneo Apertura",
  description: "Competencia de prueba",
  modality: "league" as const,
  maxParticipants: 16,
  registrationDeadline: "2026-11-01",
  startDate: "2026-11-05",
  endDate: "2026-12-10",
  status: "open" as const,
  organizerId: 1,
  createdAt: "2026-10-13T12:00:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
};

function renderPage(initialEntry = "/tournaments") {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TournamentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra la primera pagina y la cantidad total", async () => {
    vi.mocked(listTournaments).mockResolvedValue({
      data: [tournament],
      pagination: { page: 1, limit: 10, total: 12, totalPages: 2 },
    });

    renderPage();

    expect(
      screen.getByRole("heading", { name: "Torneos" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Torneo Apertura")).toBeInTheDocument();
    expect(screen.getByText("12 torneos encontrados")).toBeInTheDocument();
    expect(listTournaments).toHaveBeenCalledWith({
      search: undefined,
      status: undefined,
      modality: undefined,
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      order: "desc",
    });
  });

  it("muestra un estado de carga accesible", () => {
    vi.mocked(listTournaments).mockReturnValue(new Promise(() => undefined));

    renderPage();

    expect(
      screen.getByText("Cargando listado de torneos…"),
    ).toBeInTheDocument();
  });

  it("informa cuando todavia no hay torneos", async () => {
    vi.mocked(listTournaments).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });

    renderPage();

    expect(
      await screen.findByText("Todavía no hay torneos registrados."),
    ).toBeInTheDocument();
    expect(screen.getByText("0 torneos encontrados")).toBeInTheDocument();
  });

  it("muestra un mensaje entendible cuando falla la consulta", async () => {
    vi.mocked(listTournaments).mockRejectedValue(
      new Error("El servidor no responde"),
    );

    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se pudo cargar el listado. El servidor no responde",
    );
  });

  it("envia la busqueda, los filtros y el orden seleccionados", async () => {
    vi.mocked(listTournaments).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    renderPage();
    await screen.findByText("Todavía no hay torneos registrados.");

    fireEvent.change(screen.getByLabelText("Buscar torneos"), {
      target: { value: " apertura " },
    });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(listTournaments).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "apertura", page: 1 }),
      ),
    );

    fireEvent.change(screen.getByLabelText("Estado"), {
      target: { value: "open" },
    });
    fireEvent.change(screen.getByLabelText("Modalidad"), {
      target: { value: "league" },
    });
    fireEvent.change(screen.getByLabelText("Ordenar por"), {
      target: { value: "name-asc" },
    });
    fireEvent.change(screen.getByLabelText("Por página"), {
      target: { value: "20" },
    });

    await waitFor(() =>
      expect(listTournaments).toHaveBeenLastCalledWith({
        search: "apertura",
        status: "open",
        modality: "league",
        page: 1,
        limit: 20,
        sortBy: "name",
        order: "asc",
      }),
    );
  });

  it("permite avanzar y retroceder entre paginas", async () => {
    vi.mocked(listTournaments).mockImplementation((params = {}) =>
      Promise.resolve({
        data: [tournament],
        pagination: {
          page: params.page ?? 1,
          limit: 10,
          total: 12,
          totalPages: 2,
        },
      }),
    );

    renderPage();

    await screen.findByRole("navigation", {
      name: "Paginación de torneos",
    });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    await waitFor(() =>
      expect(listTournaments).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );

    await waitFor(() =>
      expect(
        screen.getByRole("navigation", { name: "Paginación de torneos" }),
      ).toHaveTextContent(/Página\s*2\s*de\s*2/),
    );
    fireEvent.click(screen.getByRole("button", { name: "← Anterior" }));

    await waitFor(() =>
      expect(listTournaments).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
      ),
    );
  });

  it("corrige una pagina inexistente al ultimo valor disponible", async () => {
    vi.mocked(listTournaments).mockImplementation((params = {}) =>
      Promise.resolve({
        data: [tournament],
        pagination: {
          page: params.page ?? 1,
          limit: 10,
          total: 12,
          totalPages: 2,
        },
      }),
    );

    renderPage("/tournaments?page=99");

    await waitFor(() =>
      expect(listTournaments).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
  });
});
