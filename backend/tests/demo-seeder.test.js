import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const {
  DEMO_TEAMS,
  DEMO_TOURNAMENTS,
  DEMO_REGISTRATIONS,
} = require("../seeders/001-demo-data.cjs");

describe("datos de demostración", () => {
  it("define 16 equipos con usuarios sin repetir", () => {
    const teamNames = DEMO_TEAMS.map((team) => team.name);
    const userIds = DEMO_TEAMS.flatMap((team) => [
      team.captainId,
      ...team.memberIds,
    ]);

    expect(DEMO_TEAMS).toHaveLength(16);
    expect(new Set(teamNames).size).toBe(16);
    expect(new Set(userIds).size).toBe(96);
    expect(DEMO_TEAMS.every((team) => team.memberIds.length === 5)).toBe(true);
  });

  it("define seis torneos con fechas y valores válidos", () => {
    const validModalities = new Set([
      "league",
      "single_elimination",
      "group_stage",
    ]);
    const validStatuses = new Set([
      "draft",
      "open",
      "in_progress",
      "finished",
      "cancelled",
    ]);

    expect(DEMO_TOURNAMENTS).toHaveLength(6);
    for (const tournament of DEMO_TOURNAMENTS) {
      expect(validModalities.has(tournament.modality)).toBe(true);
      expect(validStatuses.has(tournament.status)).toBe(true);
      expect(tournament.maxParticipants).toBeGreaterThanOrEqual(2);
      expect(tournament.registrationDeadline <= tournament.startDate).toBe(
        true,
      );
      expect(tournament.startDate <= tournament.endDate).toBe(true);
    }
  });

  it("respeta cupos y referencias al distribuir inscripciones", () => {
    const teamNames = new Set(DEMO_TEAMS.map((team) => team.name));
    const tournamentsByName = new Map(
      DEMO_TOURNAMENTS.map((tournament) => [tournament.name, tournament]),
    );

    expect(DEMO_REGISTRATIONS).toHaveLength(6);
    for (const registrationSet of DEMO_REGISTRATIONS) {
      const tournament = tournamentsByName.get(registrationSet.tournamentName);
      const allTeamNames = [
        ...registrationSet.registeredTeamNames,
        ...registrationSet.withdrawnTeamNames,
      ];

      expect(tournament).toBeDefined();
      expect(registrationSet.registeredTeamNames.length).toBeLessThanOrEqual(
        tournament.maxParticipants,
      );
      expect(new Set(allTeamNames).size).toBe(allTeamNames.length);
      expect(allTeamNames.every((teamName) => teamNames.has(teamName))).toBe(
        true,
      );
    }
  });
});
