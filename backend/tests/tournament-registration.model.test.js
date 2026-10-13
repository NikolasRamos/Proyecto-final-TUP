import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import TournamentRegistration, {
  REGISTRATION_STATUSES,
} from "../models/TournamentRegistration.js";

describe("TournamentRegistration", () => {
  it("usa UUID para la inscripcion, el torneo y el equipo", () => {
    const attributes = TournamentRegistration.getAttributes();

    expect(attributes.id.type.key).toBe("UUID");
    expect(attributes.tournamentId.type.key).toBe("UUID");
    expect(attributes.tournamentId.field).toBe("tournament_id");
    expect(attributes.teamId.type.key).toBe("UUID");
    expect(attributes.teamId.field).toBe("team_id");
  });

  it("acepta una inscripcion valida con estado registered", async () => {
    const registration = TournamentRegistration.build({
      tournamentId: randomUUID(),
      teamId: randomUUID(),
    });

    await expect(registration.validate()).resolves.toBe(registration);
    expect(registration.status).toBe("registered");
    expect(REGISTRATION_STATUSES).toEqual(["registered", "withdrawn"]);
  });

  it("rechaza un estado desconocido", async () => {
    const registration = TournamentRegistration.build({
      tournamentId: randomUUID(),
      teamId: randomUUID(),
      status: "unknown",
    });

    await expect(registration.validate()).rejects.toThrow();
  });
});
