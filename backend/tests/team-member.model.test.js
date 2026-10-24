import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import TeamMember from "../models/TeamMember.js";

describe("TeamMember", () => {
  it("usa UUID para la membresia, el equipo y el usuario", () => {
    const attributes = TeamMember.getAttributes();

    expect(attributes.id.type.key).toBe("UUID");
    expect(attributes.teamId.type.key).toBe("UUID");
    expect(attributes.teamId.field).toBe("team_id");
    expect(attributes.userId.type.key).toBe("UUID");
    expect(attributes.userId.field).toBe("user_id");
  });

  it("acepta una membresia valida", async () => {
    const membership = TeamMember.build({
      teamId: randomUUID(),
      userId: randomUUID(),
    });

    await expect(membership.validate()).resolves.toBe(membership);
  });

  it("rechaza un identificador de equipo invalido", async () => {
    const membership = TeamMember.build({
      teamId: "not-a-uuid",
      userId: randomUUID(),
    });

    await expect(membership.validate()).rejects.toThrow();
  });

  it("rechaza un identificador de usuario invalido", async () => {
    const membership = TeamMember.build({
      teamId: randomUUID(),
      userId: "not-a-uuid",
    });

    await expect(membership.validate()).rejects.toThrow();
  });
});
