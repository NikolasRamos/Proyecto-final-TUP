// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { listTournaments } from "./api/tournaments.api";

vi.mock("./api/tournaments.api", () => ({
  createTournament: vi.fn(),
  listTournaments: vi.fn(),
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

function renderPage() {
  render(
    <MemoryRouter initialEntries={["/tournaments"]}>
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
    expect(listTournaments).toHaveBeenCalledWith({ page: 1, limit: 10 });
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
});
