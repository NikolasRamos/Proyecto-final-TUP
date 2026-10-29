import { nextTestId } from "./test-id.js";

import { describe, expect, it } from "vitest";

import Tournament, {
  TOURNAMENT_MODALITIES,
  TOURNAMENT_STATUSES,
} from "../models/Tournament.js";

const validTournament = {
  name: "Torneo de apertura",
  description: "Competencia inicial de la temporada",
  modality: "league",
  maxParticipants: 16,
  registrationDeadline: "2026-11-01",
  startDate: "2026-11-05",
  endDate: "2026-12-10",
  organizerId: nextTestId(),
};

describe("Tournament", () => {
  it("usa enteros autoincrementales para el torneo y el organizador", () => {
    const attributes = Tournament.getAttributes();

    expect(attributes.id.type.key).toBe("INTEGER");
    expect(attributes.id.autoIncrement).toBe(true);
    expect(attributes.organizerId.type.key).toBe("INTEGER");
    expect(attributes.organizerId.field).toBe("organizer_id");
  });

  it("declara las modalidades y estados permitidos", () => {
    expect(TOURNAMENT_MODALITIES).toEqual([
      "league",
      "single_elimination",
      "group_stage",
    ]);
    expect(TOURNAMENT_STATUSES).toEqual([
      "draft",
      "open",
      "in_progress",
      "finished",
      "cancelled",
    ]);
  });

  it("acepta un torneo valido y usa draft como estado inicial", async () => {
    const tournament = Tournament.build(validTournament);

    await expect(tournament.validate()).resolves.toBe(tournament);
    expect(tournament.status).toBe("draft");
  });

  it("rechaza una modalidad desconocida", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      modality: "unknown",
    });

    await expect(tournament.validate()).rejects.toThrow();
  });

  it("rechaza menos de dos participantes", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      maxParticipants: 1,
    });

    await expect(tournament.validate()).rejects.toThrow();
  });

  it("rechaza fechas de inscripcion e inicio inconsistentes", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      registrationDeadline: "2026-11-06",
    });

    await expect(tournament.validate()).rejects.toThrow(
      "La fecha limite de inscripcion no puede ser posterior al inicio",
    );
  });

  it("rechaza una fecha de finalizacion anterior al inicio", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      endDate: "2026-11-04",
    });

    await expect(tournament.validate()).rejects.toThrow(
      "La fecha de finalizacion no puede ser anterior al inicio",
    );
  });
});
