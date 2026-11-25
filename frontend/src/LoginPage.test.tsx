// @vitest-environment jsdom

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const sessionKey = "gestion-torneos.session";
const token = "token-de-sesion-de-prueba";
const account = {
  idUsuario: 42,
  nombre: "Persona de prueba",
  email: "cuenta@example.test",
  idRol: 20,
  role: "organizador",
};

function renderRoute(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

function mockApi({ loginStatus = 200, sessionStatus = 200 } = {}) {
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const path = new URL(String(input), "http://localhost:3000").pathname;

    if (path === "/api/auth/login") {
      expect(options?.method).toBe("POST");
      expect(JSON.parse(String(options?.body))).toEqual({
        email: account.email,
        password: "UnaClaveDePrueba42",
      });
      return loginStatus === 200
        ? Response.json({ token })
        : Response.json(
            { message: "Correo o contraseña incorrectos" },
            { status: loginStatus },
          );
    }

    if (path === "/api/auth/me") {
      expect(new Headers(options?.headers).get("Authorization")).toBe(
        `Bearer ${token}`,
      );
      return sessionStatus === 200
        ? Response.json({ data: account })
        : Response.json(
            { message: "Se necesita una sesión válida" },
            { status: sessionStatus },
          );
    }

    return Response.json({
      data: [],
      pagination: { page: 1, limit: 5, total: 0, totalPages: 0 },
    });
  });

  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

async function submitLogin() {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Correo electrónico"), account.email);
  await user.type(screen.getByLabelText("Contraseña"), "UnaClaveDePrueba42");
  await user.click(screen.getByRole("button", { name: "Iniciar sesión" }));
  return user;
}

describe("Inicio de sesión en React", () => {
  beforeEach(() => window.sessionStorage.clear());

  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
  });

  it("inicia sesión, conserva el perfil al recargar y permite cerrar la sesión", async () => {
    const fetchMock = mockApi();
    const page = renderRoute();
    const user = await submitLogin();

    expect(
      await screen.findByRole("heading", { name: "Título X" }),
    ).toBeInTheDocument();
    const accountNav = within(
      screen.getByRole("navigation", { name: "Cuenta" }),
    );
    expect(accountNav.getByText(account.nombre)).toBeInTheDocument();
    expect(accountNav.getByText("organizador")).toBeInTheDocument();
    expect(window.sessionStorage.getItem(sessionKey)).toBe(token);

    page.unmount();
    renderRoute("/");

    const reloadedNav = within(
      screen.getByRole("navigation", { name: "Cuenta" }),
    );
    expect(await reloadedNav.findByText(account.nombre)).toBeInTheDocument();
    expect(
      fetchMock.mock.calls.filter(([url]) =>
        String(url).endsWith("/api/auth/me"),
      ),
    ).toHaveLength(2);

    await user.click(
      reloadedNav.getByRole("button", { name: "Cerrar sesión" }),
    );
    expect(
      reloadedNav.getByRole("link", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(window.sessionStorage.getItem(sessionKey)).toBeNull();
  });

  it("informa las credenciales incorrectas y conserva el formulario disponible", async () => {
    const fetchMock = mockApi({ loginStatus: 401 });
    renderRoute();
    await submitLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Correo o contraseña incorrectos",
    );
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem(sessionKey)).toBeNull();
  });

  it("descarta el token almacenado cuando la sesión deja de ser válida", async () => {
    const fetchMock = mockApi({ sessionStatus: 401 });
    window.sessionStorage.setItem(sessionKey, token);
    renderRoute();

    await waitFor(() =>
      expect(window.sessionStorage.getItem(sessionKey)).toBeNull(),
    );
    expect(
      screen.getByRole("button", { name: "Iniciar sesión" }),
    ).toBeEnabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
