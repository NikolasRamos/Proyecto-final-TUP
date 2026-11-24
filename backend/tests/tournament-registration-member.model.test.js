import { describe, expect, it } from "vitest";

import TournamentRegistrationMember from "../models/TournamentRegistrationMember.js";

describe("TournamentRegistrationMember", () => {
  it("usa identificadores enteros para la inscripcion y el usuario", () => {
    const attributes = TournamentRegistrationMember.getAttributes();

    expect(attributes.id.type.key).toBe("INTEGER");
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.registrationId.type.key).toBe("INTEGER");
    expect(attributes.registrationId.field).toBe("registration_id");
    expect(attributes.userId.type.key).toBe("INTEGER");
    expect(attributes.userId.field).toBe("user_id");
  });

  it("acepta un integrante valido", async () => {
    const member = TournamentRegistrationMember.build({
      registrationId: 301,
      userId: 1,
    });

    await expect(member.validate()).resolves.toBe(member);
  });
});
