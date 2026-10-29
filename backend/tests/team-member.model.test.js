import { nextTestId } from "./test-id.js";

import { describe, expect, it } from "vitest";

import TeamMember from "../models/TeamMember.js";

describe("TeamMember", () => {
  it("usa enteros autoincrementales para membresia, equipo y usuario", () => {
    const attributes = TeamMember.getAttributes();

    expect(attributes.id.type.key).toBe("INTEGER");
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.teamId.type.key).toBe("INTEGER");
    expect(attributes.teamId.field).toBe("team_id");
    expect(attributes.userId.type.key).toBe("INTEGER");
    expect(attributes.userId.field).toBe("user_id");
  });

  it("acepta una membresia valida", async () => {
    const membership = TeamMember.build({
      teamId: nextTestId(),
      userId: nextTestId(),
    });

    await expect(membership.validate()).resolves.toBe(membership);
  });

  it("rechaza un identificador de equipo invalido", async () => {
    const membership = TeamMember.build({
      teamId: "invalid-id",
      userId: nextTestId(),
    });

    await expect(membership.validate()).rejects.toThrow();
  });

  it("rechaza un identificador de usuario invalido", async () => {
    const membership = TeamMember.build({
      teamId: nextTestId(),
      userId: "invalid-id",
    });

    await expect(membership.validate()).rejects.toThrow();
  });
});
