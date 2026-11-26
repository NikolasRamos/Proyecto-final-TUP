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

function renderSession(
  path: string,
  role = "participante",
  captainAccountId: number | null = profile.idUsuario,
) {
  window.sessionStorage.setItem("gestion-torneos.session", token);
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const endpoint = new URL(String(input), "http://localhost:3000").pathname;
    if (endpoint === "/api/auth/me")
      return Response.json({ data: { ...profile, role } });
    if (endpoint === "/api/users") {
      return Response.json({
        data: [
          {
            idUsuario: 9,
            nombre: "Nueva capitana",
            email: "capitana@example.test",
          },
        ],
        totalPages: 1,
      });
    }
    if (endpoint === "/api/teams" && options?.method === "POST") {
      return Response.json(
        {
          message: "Equipo creado correctamente",
          data: { id: 42, captainId: profile.idUsuario },
        },
        { status: 201 },
      );
    }
    if (endpoint === "/api/teams/42") {
      if (options?.method === "DELETE") {
        return Response.json({ message: "Equipo eliminado correctamente" });
      }
      return Response.json({
        data: {
          id: 42,
          name: "Equipo propio",
          description: null,
          captainId: profile.idUsuario,
          captainAccountId,
          createdAt: "2026-11-26T12:00:00Z",
          updatedAt: "2026-11-26T12:00:00Z",
        },
      });
    }
    if (endpoint === "/api/teams/42/captain" && options?.method === "PATCH") {
      return Response.json({
        message: "Capitán asignado correctamente",
        data: {
          id: 42,
          name: "Equipo propio",
          description: null,
          captainId: 9,
          captainAccountId: 9,
          createdAt: "2026-11-26T12:00:00Z",
          updatedAt: "2026-11-26T12:00:00Z",
        },
      });
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
    renderSession("/");

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
    renderSession("/tournaments/new");

    expect(
      await screen.findByRole("heading", { name: "Torneos vigentes" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("option", { name: "Borrador" }),
    ).not.toBeInTheDocument();
  });

  it("envía la sesión y los datos del equipo sin pedir el ID del capitán", async () => {
    const fetchMock = renderSession("/teams/new");
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

  it("permite al participante confirmar el borrado del equipo que capitanea", async () => {
    const fetchMock = renderSession("/teams/42");
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Eliminar equipo" }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    expect(
      await screen.findByText("Equipo eliminado correctamente"),
    ).toBeInTheDocument();
    const request = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "DELETE",
    );
    expect(String(request?.[0])).toMatch(/\/api\/teams\/42$/);
    expect(new Headers(request?.[1]?.headers).get("Authorization")).toBe(
      `Bearer ${token}`,
    );
  });

  it("un capitán de demostración no puede borrar por coincidencia de ID", async () => {
    renderSession("/teams/42", "participante", null);

    expect(await screen.findByText("Sin cuenta vinculada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Eliminar equipo" }),
    ).not.toBeInTheDocument();
  });

  it("un administrador puede elegir la cuenta y ver el cambio de capitán", async () => {
    const fetchMock = renderSession("/teams/42", "administrador", null);
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", { name: "Asignar capitán" }),
    );
    const selector = await screen.findByLabelText("Cuenta para capitán");
    await user.selectOptions(
      selector,
      screen.getByRole("option", { name: /Nueva capitana/ }),
    );
    await user.click(screen.getByRole("button", { name: "Guardar capitán" }));

    expect(
      await screen.findByText("Capitán asignado correctamente"),
    ).toBeInTheDocument();
    expect(screen.getByText("Usuario #9")).toBeInTheDocument();
    const patch = fetchMock.mock.calls.find(
      ([, options]) => options?.method === "PATCH",
    );
    expect(patch?.[1]?.body).toBe(JSON.stringify({ captainId: 9 }));
    expect(new Headers(patch?.[1]?.headers).get("Authorization")).toBe(
      `Bearer ${token}`,
    );
  });
});
