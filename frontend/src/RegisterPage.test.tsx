// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const account = {
  nombre: "Persona de prueba",
  email: "Persona@example.test",
  password: "UnaClaveDePrueba42",
};

function renderRoute(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

async function fillRegistration(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Nombre"), account.nombre);
  await user.type(screen.getByLabelText("Correo electrónico"), account.email);
  await user.type(screen.getByLabelText("Contraseña"), account.password);
}

describe("Registro de una cuenta en React", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("registra la cuenta desde el login y vuelve con el correo normalizado", async () => {
    const email = account.email.toLowerCase();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { data: { idUsuario: 42, email, idRol: 3 } },
          { status: 201 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderRoute("/login");

    await user.click(screen.getByRole("link", { name: "Registrarse" }));
    await fillRegistration(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Tu cuenta se creó");
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue(email);
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/auth\/register$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(account),
      }),
    );
  });

  it("muestra el error de correo registrado y permite corregirlo", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        Response.json(
          { message: "El correo electrónico ya se encuentra registrado" },
          { status: 409 },
        ),
      );
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    renderRoute("/register");

    await fillRegistration(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "El correo electrónico ya se encuentra registrado",
    );
    expect(
      screen.getByRole("heading", { name: "Registrarse" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Correo electrónico")).toHaveValue(
      account.email,
    );
    expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeEnabled();
  });
});
