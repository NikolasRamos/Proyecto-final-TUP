// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { ApiError } from "./api/client";
import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "./api/registrations.api";
import { listTeams } from "./api/teams.api";
import {
  deleteTournament,
  downloadTournamentReport,
  getTournament,
  listTournaments,
  updateTournament,
  updateTournamentStatus,
} from "./api/tournaments.api";

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
  listTeams: vi.fn(),
}));

vi.mock("./api/registrations.api", () => ({
  listTournamentRegistrations: vi.fn(),
  registerTeamInTournament: vi.fn(),
  withdrawTeamFromTournament: vi.fn(),
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
  status: "draft" as const,
  organizerId: 1,
  createdAt: "2026-10-13T12:00:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
};

function renderPage(path = "/tournaments/101") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("TournamentDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getTournament).mockResolvedValue({ data: tournament });
    vi.mocked(listTournaments).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
    vi.mocked(listTeams).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
    });
    vi.mocked(listTournamentRegistrations).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 0 },
    });
  });

  it("muestra todos los datos principales del torneo", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Torneo Apertura" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Competencia de prueba")).toBeInTheDocument();
    expect(screen.getByText("Liga")).toBeInTheDocument();
    expect(screen.getByText("16 equipos")).toBeInTheDocument();
    expect(screen.getByText("Usuario #1")).toBeInTheDocument();
    expect(getTournament).toHaveBeenCalledWith(101);
  });

  it("descarga el reporte exportable del torneo", async () => {
    const user = userEvent.setup();
    const report = new Blob(["%PDF-1.3"], { type: "application/pdf" });
    const createObjectURL = vi.fn(() => "blob:reporte");
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });
    vi.mocked(downloadTournamentReport).mockResolvedValue(report);
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Exportar reporte" }),
    );

    expect(downloadTournamentReport).toHaveBeenCalledWith(101);
    expect(createObjectURL).toHaveBeenCalledWith(report);
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:reporte");
    expect(
      await screen.findByText("Reporte descargado correctamente"),
    ).toBeInTheDocument();
  });

  it("edita los datos permitidos y actualiza la vista", async () => {
    const user = userEvent.setup();
    const updatedTournament = {
      ...tournament,
      name: "Torneo Apertura renovado",
      maxParticipants: 20,
      updatedAt: "2026-10-30T12:00:00.000Z",
    };
    vi.mocked(updateTournament).mockResolvedValue({
      message: "Torneo actualizado correctamente",
      data: updatedTournament,
    });
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Editar torneo" }),
    );
    const nameInput = screen.getByLabelText("Nombre del torneo");
    const capacityInput = screen.getByLabelText("Cupo máximo");
    await user.clear(nameInput);
    await user.type(nameInput, "Torneo Apertura renovado");
    await user.clear(capacityInput);
    await user.type(capacityInput, "20");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(updateTournament).toHaveBeenCalledWith(101, {
      name: "Torneo Apertura renovado",
      description: "Competencia de prueba",
      modality: "league",
      maxParticipants: 20,
      registrationDeadline: "2026-11-01",
      startDate: "2026-11-05",
      endDate: "2026-12-10",
    });
    expect(
      await screen.findByText("Torneo actualizado correctamente"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Torneo Apertura renovado" }),
    ).toBeInTheDocument();
  });

  it("impide guardar fechas inconsistentes", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Editar torneo" }),
    );
    const deadlineInput = screen.getByLabelText("Cierre de inscripción");
    await user.clear(deadlineInput);
    await user.type(deadlineInput, "2026-11-20");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(updateTournament).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La fecha límite de inscripción no puede ser posterior al inicio.",
    );
  });

  it("solicita confirmación y elimina un torneo en borrador", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTournament).mockResolvedValue({
      message: "Torneo eliminado correctamente",
    });
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Eliminar torneo" }),
    );
    expect(
      screen.getByRole("heading", { name: "¿Eliminar este torneo?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(deleteTournament).toHaveBeenCalledWith(101);
    expect(
      await screen.findByText("Torneo eliminado correctamente"),
    ).toBeInTheDocument();
  });

  it("explica por qué un torneo abierto no se puede eliminar", async () => {
    vi.mocked(getTournament).mockResolvedValue({
      data: { ...tournament, status: "open" },
    });
    renderPage();

    expect(
      await screen.findByText(/ya no puede eliminarse/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar torneo" }),
    ).not.toBeInTheDocument();
  });

  it("abre las inscripciones desde el detalle del torneo", async () => {
    const user = userEvent.setup();
    const openTournament = { ...tournament, status: "open" as const };
    vi.mocked(updateTournamentStatus).mockResolvedValue({
      message: "Estado del torneo actualizado correctamente",
      data: openTournament,
    });
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Abrir inscripciones" }),
    );

    expect(updateTournamentStatus).toHaveBeenCalledWith(101, "open");
    expect(
      await screen.findByText("Estado del torneo actualizado correctamente"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Inscribir equipo" }),
    ).toBeDisabled();
  });

  it("inscribe un equipo disponible y actualiza el listado", async () => {
    const user = userEvent.setup();
    vi.mocked(getTournament).mockResolvedValue({
      data: { ...tournament, status: "open" },
    });
    vi.mocked(listTeams).mockResolvedValue({
      data: [
        {
          id: 201,
          name: "Los Halcones",
          description: null,
          captainId: 1,
          createdAt: "2026-10-30T10:00:00.000Z",
          updatedAt: "2026-10-30T10:00:00.000Z",
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(registerTeamInTournament).mockResolvedValue({
      message: "Equipo inscrito correctamente",
      data: {
        id: 301,
        tournamentId: 101,
        teamId: 201,
        status: "registered",
        createdAt: "2026-10-30T12:00:00.000Z",
        updatedAt: "2026-10-30T12:00:00.000Z",
      },
    });
    renderPage();

    await user.selectOptions(
      await screen.findByLabelText("Equipo a inscribir"),
      "201",
    );
    await user.click(screen.getByRole("button", { name: "Inscribir equipo" }));

    expect(registerTeamInTournament).toHaveBeenCalledWith(101, 201);
    expect(
      await screen.findByText("Equipo inscrito correctamente"),
    ).toBeInTheDocument();
  });

  it("retira un equipo inscrito desde el detalle", async () => {
    const user = userEvent.setup();
    vi.mocked(getTournament).mockResolvedValue({
      data: { ...tournament, status: "open" },
    });
    vi.mocked(listTournamentRegistrations).mockResolvedValue({
      data: [
        {
          id: 301,
          status: "registered",
          registeredAt: "2026-10-30T12:00:00.000Z",
          updatedAt: "2026-10-30T12:00:00.000Z",
          team: { id: 201, name: "Los Halcones" },
        },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(withdrawTeamFromTournament).mockResolvedValue({
      message: "Equipo retirado correctamente",
      data: {
        id: 301,
        tournamentId: 101,
        teamId: 201,
        status: "withdrawn",
        createdAt: "2026-10-30T12:00:00.000Z",
        updatedAt: "2026-10-30T13:00:00.000Z",
      },
    });
    renderPage();

    expect(await screen.findByText("Los Halcones")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirar" }));

    expect(withdrawTeamFromTournament).toHaveBeenCalledWith(101, 201);
    expect(
      await screen.findByText("Equipo retirado correctamente"),
    ).toBeInTheDocument();
  });

  it("muestra el conflicto si el estado cambia antes del borrado", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTournament).mockRejectedValue(
      new ApiError(409, {
        message: "Solo se pueden eliminar torneos en estado draft",
      }),
    );
    renderPage();

    await user.click(
      await screen.findByRole("button", { name: "Eliminar torneo" }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Solo se pueden eliminar torneos en estado draft",
    );
  });

  it("muestra un error entendible cuando el torneo no existe", async () => {
    vi.mocked(getTournament).mockRejectedValue(
      new ApiError(404, { message: "Torneo no encontrado" }),
    );
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Torneo no encontrado",
    );
  });

  it("rechaza un identificador inválido sin consultar la API", () => {
    renderPage("/tournaments/no-es-un-id");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El identificador del torneo no es válido.",
    );
    expect(getTournament).not.toHaveBeenCalled();
  });
});
