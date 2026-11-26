import { describe, expect, it } from "vitest";

import Match, { MATCH_STATUSES } from "../models/Match.js";
import Result from "../models/Result.js";
import Standing from "../models/Standing.js";

describe("modelo Match", () => {
  const validMatch = {
    tournamentId: 1,
    homeTeamId: 1,
    awayTeamId: 2,
    status: "scheduled",
    round: "Fecha 1",
    matchDate: new Date("2026-11-15T18:00:00.000Z"),
  };

  it("acepta un partido válido", async () => {
    const match = Match.build(validMatch);

    await expect(match.validate()).resolves.toBe(match);
    expect(MATCH_STATUSES).toContain(match.status);
  });

  it("rechaza un partido entre el mismo equipo", async () => {
    const match = Match.build({
      ...validMatch,
      awayTeamId: validMatch.homeTeamId,
    });

    await expect(match.validate()).rejects.toThrow(
      "Un equipo no puede jugar contra sí mismo",
    );
  });

  it("rechaza un estado desconocido", async () => {
    const match = Match.build({ ...validMatch, status: "unknown" });

    await expect(match.validate()).rejects.toThrow();
  });
});

describe("modelo Result", () => {
  it("acepta un resultado válido", async () => {
    const result = Result.build({
      matchId: 1,
      homeScore: 3,
      awayScore: 1,
    });

    await expect(result.validate()).resolves.toBe(result);
  });

  it("rechaza marcadores negativos", async () => {
    const result = Result.build({
      matchId: 1,
      homeScore: -1,
      awayScore: 0,
    });

    await expect(result.validate()).rejects.toThrow();
  });
});

describe("modelo Standing", () => {
  it("acepta una posición válida y diferencia negativa", async () => {
    const standing = Standing.build({
      tournamentId: 1,
      teamId: 2,
      played: 2,
      won: 0,
      drawn: 1,
      lost: 1,
      goalsFor: 1,
      goalsAgainst: 3,
      goalDifference: -2,
      points: 1,
    });

    await expect(standing.validate()).resolves.toBe(standing);
  });

  it("rechaza estadísticas negativas", async () => {
    const standing = Standing.build({
      tournamentId: 1,
      teamId: 2,
      played: -1,
    });

    await expect(standing.validate()).rejects.toThrow();
  });
});
