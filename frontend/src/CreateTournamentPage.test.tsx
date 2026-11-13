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
  await user.clear(screen.getByLabelText("Cupo máximo de equipos"));
  await user.type(screen.getByLabelText("Cupo máximo de equipos"), "16");
  await user.clear(screen.getByLabelText("Máximo de integrantes por equipo"));
  await user.type(
    screen.getByLabelText("Máximo de integrantes por equipo"),
    "5",
  );
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
    const formatSelect = screen.getByLabelText("Modalidad");
    expect(formatSelect).toHaveValue("league");
    expect(
      Array.from((formatSelect as HTMLSelectElement).options).map((option) => [
        option.value,
        option.text,
      ]),
    ).toEqual([
      ["league", "Liga"],
      ["single_elimination", "Eliminación simple"],
      ["groups_playoff", "Grupos + Playoff"],
      ["swiss", "Suizo"],
      ["free_for_all", "Free-for-all"],
      ["gauntlet", "Gauntlet"],
    ]);
    expect(screen.getByLabelText("Por equipos")).toBeChecked();
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveValue(3);
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveAttribute(
      "min",
      "3",
    );
    expect(
      screen.getByText("Una liga necesita al menos 3 participantes."),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mínimo de integrantes por equipo"),
    ).toHaveValue(2);
    expect(
      screen.getByLabelText("Máximo de integrantes por equipo"),
    ).toHaveValue(2);
    expect(screen.getByLabelText("ID del organizador")).toBeRequired();
  });

  it("muestra la regla de participantes de Gauntlet", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText("Modalidad"), "gauntlet");

    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveAttribute(
      "min",
      "2",
    );
    expect(
      screen.getByText("Un Gauntlet necesita al menos 2 participantes."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Una liga necesita al menos 3 participantes."),
    ).not.toBeInTheDocument();
  });

  it("muestra y aplica el minimo de participantes de Free-for-all", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByLabelText("Modalidad"),
      "free_for_all",
    );

    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveAttribute(
      "min",
      "3",
    );
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveValue(3);
    expect(
      screen.getByText("Un Free-for-all necesita al menos 3 participantes."),
    ).toBeInTheDocument();
  });

  it("muestra la configuracion y recomendacion del formato Suizo", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText("Modalidad"), "swiss");

    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveAttribute(
      "min",
      "4",
    );
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveValue(4);
    expect(screen.getByLabelText("Cantidad de rondas")).toHaveValue(3);
    expect(
      screen.getByText("Recomendación para 4 participantes: 2 rondas."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Resumen del formato Suizo" }),
    ).toHaveTextContent("Máximo sin repetir rivales: 3 rondas.");
  });

  it("envia una configuracion valida del formato Suizo", async () => {
    vi.mocked(createTournament).mockResolvedValue({
      message: "Torneo creado correctamente",
      data: {
        id: 104,
        name: "Torneo Copa",
        description: null,
        modality: "swiss",
        maxParticipants: 16,
        swissRounds: 5,
        isTeamTournament: true,
        minTeamMembers: 2,
        maxTeamMembers: 5,
        registrationDeadline: "2026-11-01",
        startDate: "2026-11-05",
        endDate: "2026-12-10",
        status: "draft",
        organizerId,
        createdAt: "2026-11-13T12:00:00.000Z",
        updatedAt: "2026-11-13T12:00:00.000Z",
      },
    });
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();

    await user.selectOptions(screen.getByLabelText("Modalidad"), "swiss");
    await user.clear(screen.getByLabelText("Cantidad de rondas"));
    await user.type(screen.getByLabelText("Cantidad de rondas"), "5");
    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        modality: "swiss",
        maxParticipants: 16,
        swissRounds: 5,
      }),
    );
  });

  it("advierte cuando las rondas Suizas superan los rivales disponibles", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    await user.selectOptions(screen.getByLabelText("Modalidad"), "swiss");
    await user.clear(screen.getByLabelText("Cantidad de rondas"));
    await user.type(screen.getByLabelText("Cantidad de rondas"), "4");

    expect(
      screen.getByRole("status", { name: "Resumen del formato Suizo" }),
    ).toHaveTextContent(
      "Las rondas no pueden superar la cantidad de rivales distintos disponibles.",
    );
    expect(createTournament).not.toHaveBeenCalled();
  });

  it("muestra y aplica la regla de Eliminacion simple", async () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();

    await user.selectOptions(
      screen.getByLabelText("Modalidad"),
      "single_elimination",
    );

    expect(
      screen.getByText(
        "Usá un cupo de 2, 4, 8, 16, 32… para formar una llave completa.",
      ),
    ).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Cupo máximo de equipos"));
    await user.type(screen.getByLabelText("Cupo máximo de equipos"), "6");
    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "La eliminación simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...).",
      ),
    ).toBeInTheDocument();
  });

  it("muestra la configuracion de Grupos + Playoff y calcula el cupo", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );

    await user.selectOptions(
      screen.getByLabelText("Modalidad"),
      "groups_playoff",
    );

    expect(screen.getByLabelText("Lugares en el playoff")).toHaveValue(8);
    expect(screen.getByLabelText("Cantidad de grupos")).toHaveValue(4);
    expect(
      screen.getByLabelText("Máximo de participantes por grupo"),
    ).toHaveValue(4);
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveValue(16);
    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveAttribute(
      "readonly",
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      "Clasifican 2 por grupo · Cupo máximo total: 16",
    );

    await user.clear(
      screen.getByLabelText("Máximo de participantes por grupo"),
    );
    await user.type(
      screen.getByLabelText("Máximo de participantes por grupo"),
      "5",
    );

    expect(screen.getByLabelText("Cupo máximo de equipos")).toHaveValue(20);
  });

  it("envia la configuracion valida de Grupos + Playoff", async () => {
    vi.mocked(createTournament).mockResolvedValue({
      message: "Torneo creado correctamente",
      data: {
        id: 103,
        name: "Torneo Copa",
        description: null,
        modality: "groups_playoff",
        maxParticipants: 20,
        playoffSpots: 8,
        groupCount: 4,
        maxParticipantsPerGroup: 5,
        isTeamTournament: true,
        minTeamMembers: 2,
        maxTeamMembers: 5,
        registrationDeadline: "2026-11-01",
        startDate: "2026-11-05",
        endDate: "2026-12-10",
        status: "draft",
        organizerId,
        createdAt: "2026-11-13T12:00:00.000Z",
        updatedAt: "2026-11-13T12:00:00.000Z",
      },
    });
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();

    await user.selectOptions(
      screen.getByLabelText("Modalidad"),
      "groups_playoff",
    );
    await user.clear(
      screen.getByLabelText("Máximo de participantes por grupo"),
    );
    await user.type(
      screen.getByLabelText("Máximo de participantes por grupo"),
      "5",
    );
    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        modality: "groups_playoff",
        maxParticipants: 20,
        playoffSpots: 8,
        groupCount: 4,
        maxParticipantsPerGroup: 5,
      }),
    );
  });

  it("rechaza una cantidad de grupos incompatible con el playoff", async () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();

    await user.selectOptions(
      screen.getByLabelText("Modalidad"),
      "groups_playoff",
    );
    await user.clear(screen.getByLabelText("Cantidad de grupos"));
    await user.type(screen.getByLabelText("Cantidad de grupos"), "3");
    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "La cantidad de grupos debe dividir exactamente los lugares del playoff.",
    );
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
        isTeamTournament: true,
        minTeamMembers: 2,
        maxTeamMembers: 5,
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
      isTeamTournament: true,
      minTeamMembers: 2,
      maxTeamMembers: 5,
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

  it("crea un torneo individual sin limites de equipo", async () => {
    vi.mocked(createTournament).mockResolvedValue({
      message: "Torneo creado correctamente",
      data: {
        id: 102,
        name: "Torneo Copa",
        description: null,
        modality: "league",
        maxParticipants: 16,
        isTeamTournament: false,
        minTeamMembers: null,
        maxTeamMembers: null,
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

    await user.click(screen.getByLabelText("Individual"));

    expect(
      screen.queryByLabelText("Mínimo de integrantes por equipo"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Cupo máximo de personas")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).toHaveBeenCalledWith(
      expect.objectContaining({
        isTeamTournament: false,
        minTeamMembers: null,
        maxTeamMembers: null,
      }),
    );
  });

  it("rechaza un maximo de integrantes menor que el minimo", async () => {
    render(
      <MemoryRouter initialEntries={["/tournaments/new"]}>
        <App />
      </MemoryRouter>,
    );
    const user = await completeRequiredFields();
    await user.clear(screen.getByLabelText("Mínimo de integrantes por equipo"));
    await user.type(
      screen.getByLabelText("Mínimo de integrantes por equipo"),
      "6",
    );

    await user.click(screen.getByRole("button", { name: "Crear torneo" }));

    expect(createTournament).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        "El máximo de integrantes no puede ser menor que el mínimo.",
      ),
    ).toBeInTheDocument();
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
