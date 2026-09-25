// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import App from "./App";

describe("App", () => {
  it("presenta el sistema y sus módulos principales", () => {
    render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "Sistema de Gestión de Torneos" }),
    ).toBeInTheDocument();
    expect(screen.getByText("React + TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Partidas y resultados")).toBeInTheDocument();
  });
});
