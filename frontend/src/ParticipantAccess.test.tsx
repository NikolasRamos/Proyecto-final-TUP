// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const token = "token-de-participante-de-prueba";
const profile = {
  idUsuario: 7,
  nombre: "Participante de prueba",
  email: "participante@example.test",
  idRol: 3,
  role: "participante",
};

function renderAsParticipant(path: string) {
  window.sessionStorage.setItem("gestion-torneos.session", token);
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const endpoint = new URL(String(input), "http://localhost:3000").pathname;
    if (endpoint === "/api/auth/me") return Response.json({ data: profile });
    if (endpoint === "/api/teams" && options?.method === "POST") {
      return Response.json(
        {
          message: "Equipo creado correctamente",
          data: { id: 42, captainId: profile.idUsuario },
        },
        { status: 201 },
      );
    }
    return Response.json({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    });
  });
  vi.stubGlobal("fetch", fetchMock);

  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return fetchMock;
}

describe("Permisos del participante en React", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("ofrece el catálogo público y un acceso para crear equipos", async () => {
    renderAsParticipant("/");

    expect(
      await screen.findByRole("link", { name: "Crear equipo" }),
    ).toHaveAttribute("href", "/teams/new");
    expect(
      screen.getByRole("link", { name: "Buscar equipos" }),
    ).toHaveAttribute("href", "/teams");
    expect(
      screen.getByRole("link", { name: "Buscar torneos" }),
    ).toHaveAttribute("href", "/tournaments");
    expect(
      screen.queryByRole("link", { name: "Crear torneo" }),
    ).not.toBeInTheDocument();
  });

  it("redirige una URL de creación de torneos hacia el listado vigente", async () => {
    renderAsParticipant("/tournaments/new");

    expect(
      await screen.findByRole("heading", { name: "Torneos vigentes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Borrador" }),
    ).not.toBeInTheDocument();
  });

  it("envía la sesión y los datos del equipo sin pedir el ID del capitán", async () => {
    const fetchMock = renderAsParticipant("/teams/new");
    const user = userEvent.setup();

    await user.type(
      await screen.findByLabelText("Nombre del equipo"),
      "Los Halcones",
    );
    expect(screen.queryByLabelText("ID del capitán")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Crear equipo" }));

    expect(
      await screen.findByRole("link", { name: "Ver equipo creado" }),
    ).toHaveAttribute("href", "/teams/42");
    const postRequest = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "POST",
    );
    expect(postRequest?.[1]?.body).toBe(
      JSON.stringify({ name: "Los Halcones", description: null }),
    );
    expect(new Headers(postRequest?.[1]?.headers).get("Authorization")).toBe(
      `Bearer ${token}`,
    );
  });
});
