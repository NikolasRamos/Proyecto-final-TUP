import { nextTestId } from "./test-id.js";

import { describe, expect, it } from "vitest";

import TournamentRegistration, {
  REGISTRATION_STATUSES,
} from "../models/TournamentRegistration.js";

describe("TournamentRegistration", () => {
  it("usa enteros autoincrementales para inscripcion, torneo y equipo", () => {
    const attributes = TournamentRegistration.getAttributes();

    expect(attributes.id.type.key).toBe("INTEGER");
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.tournamentId.type.key).toBe("INTEGER");
    expect(attributes.tournamentId.field).toBe("tournament_id");
    expect(attributes.teamId.type.key).toBe("INTEGER");
    expect(attributes.teamId.field).toBe("team_id");
  });

  it("acepta una inscripcion valida con estado registered", async () => {
    const registration = TournamentRegistration.build({
      tournamentId: nextTestId(),
      teamId: nextTestId(),
    });

    await expect(registration.validate()).resolves.toBe(registration);
    expect(registration.status).toBe("registered");
    expect(REGISTRATION_STATUSES).toEqual(["registered", "withdrawn"]);
  });

  it("rechaza un estado desconocido", async () => {
    const registration = TournamentRegistration.build({
      tournamentId: nextTestId(),
      teamId: nextTestId(),
      status: "unknown",
    });

    await expect(registration.validate()).rejects.toThrow();
  });
});
