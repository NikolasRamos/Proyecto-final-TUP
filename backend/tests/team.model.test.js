import { nextTestId } from "./test-id.js";

import { describe, expect, it } from "vitest";

import Team from "../models/Team.js";

const validTeam = {
  name: "Los Halcones",
  description: "Equipo participante de la liga local",
  captainId: nextTestId(),
};

describe("Team", () => {
  it("usa enteros autoincrementales para el equipo y el capitan", () => {
    const attributes = Team.getAttributes();

    expect(attributes.id.type.key).toBe("INTEGER");
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.captainId.type.key).toBe("INTEGER");
    expect(attributes.captainId.field).toBe("captain_id");
  });

  it("acepta un equipo valido", async () => {
    const team = Team.build(validTeam);

    await expect(team.validate()).resolves.toBe(team);
  });

  it("rechaza un nombre demasiado corto", async () => {
    const team = Team.build({
      ...validTeam,
      name: "AB",
    });

    await expect(team.validate()).rejects.toThrow();
  });

  it("rechaza una descripcion demasiado extensa", async () => {
    const team = Team.build({
      ...validTeam,
      description: "a".repeat(2001),
    });

    await expect(team.validate()).rejects.toThrow();
  });

  it("rechaza un identificador de capitan que no es un entero positivo", async () => {
    const team = Team.build({
      ...validTeam,
      captainId: "invalid-id",
    });

    await expect(team.validate()).rejects.toThrow();
  });
});
