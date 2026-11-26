// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import App from "./App";

function renderInbox() {
  render(
    <MemoryRouter initialEntries={["/notifications"]}>
      <App />
    </MemoryRouter>,
  );
}

describe("Bandeja de notificaciones", () => {
  afterEach(() => {
    window.sessionStorage.clear();
    vi.unstubAllGlobals();
  });

  it("pide iniciar sesión para abrir la bandeja", async () => {
    renderInbox();
    expect(
      await screen.findByRole("heading", { name: "Iniciar sesión" }),
    ).toBeInTheDocument();
  });

  it("abre el trámite exacto y reduce el contador al marcar un aviso", async () => {
    window.sessionStorage.setItem(
      "gestion-torneos.session",
      "token-local-de-prueba",
    );
    const fetchMock = vi.fn<typeof fetch>(async (input) => {
      const endpoint = new URL(String(input), "http://localhost:3000").pathname;
      if (endpoint === "/api/auth/me")
        return Response.json({
          data: { idUsuario: 2, nombre: "Usuario", role: "organizador" },
        });
      if (endpoint === "/api/notifications/7/read")
        return Response.json({ data: { isRead: true } });
      return Response.json({
        data: [
          {
            requestId: 7,
            teamId: 9,
            teamName: "Los Halcones",
            kind: "invitation",
            status: "pending",
            event: "received",
            isRead: false,
            createdAt: "2026-11-26T12:00:00Z",
          },
        ],
        unread: 1,
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });
    });
    vi.stubGlobal("fetch", fetchMock);
    renderInbox();
    const user = userEvent.setup();

    expect(await screen.findByText("1 aviso sin leer")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Ir a responder" }),
    ).toHaveAttribute("href", "/team-requests?box=received&requestId=7");
    await user.click(screen.getByRole("button", { name: "Marcar como leída" }));

    expect(await screen.findByText("0 avisos sin leer")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Marcar como leída" }),
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/notifications\/7\/read$/),
      expect.objectContaining({ method: "PATCH" }),
    );
  });
});
