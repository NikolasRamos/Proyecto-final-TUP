// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";
import { ApiError } from "./api/client";
import {
  createTeam,
  deleteTeam,
  getTeam,
  listTeams,
  updateTeam,
} from "./api/teams.api";

vi.mock("./api/teams.api", () => ({
  createTeam: vi.fn(),
  deleteTeam: vi.fn(),
  getTeam: vi.fn(),
  listTeams: vi.fn(),
  updateTeam: vi.fn(),
}));

const team = {
  id: 201,
  name: "Los Halcones",
  description: "Equipo de prueba",
  captainId: 1,
  createdAt: "2026-10-13T12:00:00.000Z",
  updatedAt: "2026-10-13T12:00:00.000Z",
};

function renderPage(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("pantallas principales de equipos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listTeams).mockResolvedValue({
      data: [team],
      pagination: { page: 1, limit: 10, total: 12, totalPages: 2 },
    });
    vi.mocked(getTeam).mockResolvedValue({ data: team });
  });

  it("lista equipos y muestra la cantidad total", async () => {
    renderPage("/teams");

    expect(
      screen.getByRole("heading", { name: "Equipos" }),
    ).toBeInTheDocument();
    expect(await screen.findByText("Los Halcones")).toBeInTheDocument();
    expect(screen.getByText("12 equipos encontrados")).toBeInTheDocument();
    expect(listTeams).toHaveBeenCalledWith({
      search: undefined,
      page: 1,
      limit: 10,
    });
  });

  it("busca equipos y navega entre páginas", async () => {
    vi.mocked(listTeams).mockImplementation((params = {}) =>
      Promise.resolve({
        data: [team],
        pagination: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          total: 12,
          totalPages: 2,
        },
      }),
    );
    renderPage("/teams");
    await screen.findByText("Los Halcones");

    fireEvent.change(screen.getByLabelText("Buscar equipos"), {
      target: { value: " halcones " },
    });
    fireEvent.submit(screen.getByRole("search"));

    await waitFor(() =>
      expect(listTeams).toHaveBeenLastCalledWith({
        search: "halcones",
        page: 1,
        limit: 10,
      }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Siguiente →" }));

    await waitFor(() =>
      expect(listTeams).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "halcones", page: 2 }),
      ),
    );
  });

  it("crea un equipo y registra automáticamente al capitán", async () => {
    const user = userEvent.setup();
    vi.mocked(createTeam).mockResolvedValue({
      message: "Equipo creado correctamente",
      data: team,
    });
    renderPage("/teams/new");

    await user.type(screen.getByLabelText("Nombre del equipo"), "Los Halcones");
    await user.type(screen.getByLabelText("Descripción"), "Equipo de prueba");
    await user.type(screen.getByLabelText("ID del capitán"), "1");
    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(createTeam).toHaveBeenCalledWith({
      name: "Los Halcones",
      description: "Equipo de prueba",
      captainId: 1,
    });
    expect(
      await screen.findByText("Equipo creado correctamente"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ver equipo creado" }),
    ).toHaveAttribute("href", "/teams/201");
  });

  it("muestra el detalle completo del equipo", async () => {
    renderPage("/teams/201");

    expect(
      await screen.findByRole("heading", { name: "Los Halcones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Equipo de prueba")).toBeInTheDocument();
    expect(screen.getByText("Usuario #1")).toBeInTheDocument();
    expect(getTeam).toHaveBeenCalledWith(201);
  });

  it("edita el nombre y la descripción del equipo", async () => {
    const user = userEvent.setup();
    const updatedTeam = {
      ...team,
      name: "Halcones renovados",
      description: "Descripción actualizada",
    };
    vi.mocked(updateTeam).mockResolvedValue({
      message: "Equipo actualizado correctamente",
      data: updatedTeam,
    });
    renderPage("/teams/201");

    await user.click(
      await screen.findByRole("button", { name: "Editar equipo" }),
    );
    await user.clear(screen.getByLabelText("Nombre del equipo"));
    await user.type(
      screen.getByLabelText("Nombre del equipo"),
      "Halcones renovados",
    );
    await user.clear(screen.getByLabelText("Descripción"));
    await user.type(
      screen.getByLabelText("Descripción"),
      "Descripción actualizada",
    );
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(updateTeam).toHaveBeenCalledWith(201, {
      name: "Halcones renovados",
      description: "Descripción actualizada",
    });
    expect(
      await screen.findByText("Equipo actualizado correctamente"),
    ).toBeInTheDocument();
  });

  it("confirma y elimina un equipo sin inscripciones", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTeam).mockResolvedValue({
      message: "Equipo eliminado correctamente",
    });
    renderPage("/teams/201");

    await user.click(
      await screen.findByRole("button", { name: "Eliminar equipo" }),
    );
    expect(
      screen.getByRole("heading", { name: "¿Eliminar este equipo?" }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(deleteTeam).toHaveBeenCalledWith(201);
    expect(
      await screen.findByText("Equipo eliminado correctamente"),
    ).toBeInTheDocument();
  });

  it("informa el conflicto si el equipo posee inscripciones", async () => {
    const user = userEvent.setup();
    vi.mocked(deleteTeam).mockRejectedValue(
      new ApiError(409, {
        message: "No se puede eliminar un equipo con inscripciones registradas",
      }),
    );
    renderPage("/teams/201");

    await user.click(
      await screen.findByRole("button", { name: "Eliminar equipo" }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "No se puede eliminar un equipo con inscripciones registradas",
    );
  });

  it("rechaza un identificador inválido sin consultar la API", () => {
    renderPage("/teams/incorrecto");

    expect(screen.getByRole("alert")).toHaveTextContent(
      "El identificador del equipo no es válido.",
    );
    expect(getTeam).not.toHaveBeenCalled();
  });
});
