import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import Team from "../models/Team.js";

const validTeam = {
  name: "Los Halcones",
  description: "Equipo participante de la liga local",
  captainId: randomUUID(),
};

describe("Team", () => {
  it("usa UUID para el equipo y para el capitan", () => {
    const attributes = Team.getAttributes();

    expect(attributes.id.type.key).toBe("UUID");
    expect(attributes.captainId.type.key).toBe("UUID");
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

  it("rechaza un identificador de capitan que no es UUID v4", async () => {
    const team = Team.build({
      ...validTeam,
      captainId: "not-a-uuid",
    });

    await expect(team.validate()).rejects.toThrow();
  });
});
