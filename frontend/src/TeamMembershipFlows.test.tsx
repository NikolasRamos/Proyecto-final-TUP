// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

const team = {
  id: 9,
  name: "Los Halcones",
  description: null,
  captainId: 1,
  captainAccountId: 1,
  createdAt: "2026-10-13T12:00:00Z",
  updatedAt: "2026-10-13T12:00:00Z",
};

function renderWithAccount(path: string, idUsuario: number) {
  window.sessionStorage.setItem(
    "gestion-torneos.session",
    "token-local-de-prueba",
  );
  const fetchMock = vi.fn<typeof fetch>(async (input, options) => {
    const endpoint = new URL(String(input), "http://localhost:3000").pathname;
    if (endpoint === "/api/auth/me")
      return Response.json({
        data: { idUsuario, nombre: "Cuenta", role: "participante" },
      });
    if (endpoint === "/api/teams/9") return Response.json({ data: team });
    if (endpoint === "/api/teams/9/membership")
      return Response.json({ data: { state: "available" } });
    if (endpoint === "/api/teams/membership-requests")
      return Response.json({
        data: [
          {
            id: 8,
            teamId: 9,
            teamName: team.name,
            memberName: "Participante",
            kind: "request",
            status: "pending",
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    if (options?.method === "PATCH")
      return Response.json({ data: { status: "accepted" } });
    return Response.json({ data: { id: 8 } }, { status: 201 });
  });
  vi.stubGlobal("fetch", fetchMock);
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  return fetchMock;
}

describe("Solicitudes e invitaciones en React", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("envía la solicitud desde el detalle de otro equipo", async () => {
    const fetchMock = renderWithAccount("/teams/9", 2);
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Pedir ingreso" }),
    );

    expect(
      await screen.findByText("Solicitud enviada al capitán."),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/teams\/9\/join-requests$/),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("envía la invitación desde la ficha del equipo que capitanea", async () => {
    const fetchMock = renderWithAccount("/teams/9", 1);
    const user = userEvent.setup();
    await user.type(
      await screen.findByLabelText("Correo de la cuenta registrada"),
      "jugador@example.test",
    );
    await user.click(screen.getByRole("button", { name: "Enviar invitación" }));

    expect(await screen.findByText("Invitación enviada.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/teams\/9\/invitations$/),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "jugador@example.test" }),
      }),
    );
  });

  it("actualiza el estado después de aceptar una solicitud recibida", async () => {
    const fetchMock = renderWithAccount("/team-requests", 1);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Aceptar" }));

    expect(await screen.findByText("Aceptada")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Aceptar" }),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/teams\/9\/membership-requests\/8$/),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "accepted" }),
      }),
    );
  });
});
