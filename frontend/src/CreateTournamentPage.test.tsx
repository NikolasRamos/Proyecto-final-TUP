// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { createTournament } from "./api/tournaments.api";

vi.mock("./api/tournaments.api", () => ({
  createTournament: vi.fn(),
  deleteTournament: vi.fn(),
  downloadTournamentReport: vi.fn(),
  getTournament: vi.fn(),
  listTournaments: vi.fn(),
  updateTournament: vi.fn(),
  updateTournamentStatus: vi.fn(),
}));

const organizerId = 1;

async function completeRequiredFields() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText("Nombre del torneo"), "Torneo Copa");
  await user.selectOptions(screen.getByLabelText("Modalidad"), "league");
  await user.clear(screen.getByLabelText("Cupo máximo"));
  await user.type(screen.getByLabelText("Cupo máximo"), "16");
  await user.type(screen.getByLabelText("Cierre de inscripción"), "2026-11-01");
  await user.type(screen.getByLabelText("Fecha de inicio"), "2026-11-05");
  await user.type(screen.getByLabelText("Fecha de finalización"), "2026-12-10");
  await user.type(
    screen.getByLabelText("ID del organizador"),
    String(organizerId),
  );

  return user;
}

describe("CreateTournamentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("presenta todos los datos necesarios para crear un torneo", () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Crear torneo" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre del torneo")).toBeRequired();
    expect(screen.getByLabelText("Modalidad")).toHaveValue("league");
    expect(screen.getByLabelText("Cupo máximo")).toHaveValue(2);
    expect(screen.getByLabelText("ID del organizador")).toBeRequired();
  });

  it("envía el formulario y muestra el identificador generado", async () => {
    vi.mocked(createTournament).mockResolvedValue({
      message: "Torneo creado correctamente",
      data: {
        id: 101,
        name: "Torneo Copa",
        description: null,
        modality: "league",
        maxParticipants: 16,
        registrationDeadline: "2026-11-01",
        startDate: "2026-11-05",
        endDate: "2026-12-10",
        status: "draft",
        organizerId,
        createdAt: "2026-10-13T12:00:00.000Z",
        updatedAt: "2026-10-13T12:00:00.000Z",
      },
    });
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();

    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).toHaveBeenCalledWith({
      name: "Torneo Copa",
      description: null,
      modality: "league",
      maxParticipants: 16,
      registrationDeadline: "2026-11-01",
      startDate: "2026-11-05",
      endDate: "2026-12-10",
      organizerId,
    });
    expect(
      await screen.findByText("Torneo creado correctamente"),
    ).toBeInTheDocument();
    expect(screen.getByText(/101/)).toBeInTheDocument();
  });

  it("impide enviar fechas inconsistentes", async () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();
    await user.clear(screen.getByLabelText("Cierre de inscripción"));
    await user.type(
      screen.getByLabelText("Cierre de inscripción"),
      "2026-11-10",
    );

    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "La fecha límite de inscripción no puede ser posterior al inicio.",
      ),
    ).toBeInTheDocument();
  });
});
