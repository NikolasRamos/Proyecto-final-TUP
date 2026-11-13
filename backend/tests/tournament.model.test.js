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
  isTeamTournament: true,
  minTeamMembers: 2,
  maxTeamMembers: 5,
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

  it("mapea las reglas de participacion a sus columnas", () => {
    const attributes = Tournament.getAttributes();

    expect(attributes.isTeamTournament.type.key).toBe("BOOLEAN");
    expect(attributes.isTeamTournament.field).toBe("is_team_tournament");
    expect(attributes.isTeamTournament.defaultValue).toBe(true);
    expect(attributes.minTeamMembers.field).toBe("min_team_members");
    expect(attributes.maxTeamMembers.field).toBe("max_team_members");
  });

  it("mapea la configuracion de Grupos + Playoff", () => {
    const attributes = Tournament.getAttributes();

    expect(attributes.playoffSpots.field).toBe("playoff_spots");
    expect(attributes.groupCount.field).toBe("group_count");
    expect(attributes.maxParticipantsPerGroup.field).toBe(
      "max_participants_per_group",
    );
    expect(attributes.playoffSpots.defaultValue).toBeNull();
    expect(attributes.groupCount.defaultValue).toBeNull();
    expect(attributes.maxParticipantsPerGroup.defaultValue).toBeNull();
  });

  it("mapea la cantidad de rondas del formato Suizo", () => {
    const attributes = Tournament.getAttributes();

    expect(attributes.swissRounds.field).toBe("swiss_rounds");
    expect(attributes.swissRounds.defaultValue).toBeNull();
  });

  it("declara las modalidades y estados permitidos", () => {
    expect(TOURNAMENT_MODALITIES).toEqual([
      "league",
      "single_elimination",
      "groups_playoff",
      "swiss",
      "free_for_all",
      "gauntlet",
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

  it("acepta un torneo individual sin limites de equipo", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      isTeamTournament: false,
      minTeamMembers: null,
      maxTeamMembers: null,
    });

    await expect(tournament.validate()).resolves.toBe(tournament);
  });

  it("mantiene compatibles los torneos por equipos anteriores sin limites", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      minTeamMembers: null,
      maxTeamMembers: null,
    });

    await expect(tournament.validate()).resolves.toBe(tournament);
  });

  it("rechaza limites de equipo en un torneo individual", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      isTeamTournament: false,
    });

    await expect(tournament.validate()).rejects.toThrow(
      "Un torneo individual no puede definir limites de equipo",
    );
  });

  it("rechaza un torneo por equipos con un solo limite definido", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      maxTeamMembers: null,
    });

    await expect(tournament.validate()).rejects.toThrow(
      "Los limites minimo y maximo del equipo deben definirse juntos",
    );
  });

  it("rechaza menos de dos integrantes por equipo", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      minTeamMembers: 1,
    });

    await expect(tournament.validate()).rejects.toThrow();
  });

  it("rechaza un maximo de integrantes menor que el minimo", async () => {
    const tournament = Tournament.build({
      ...validTournament,
      minTeamMembers: 5,
      maxTeamMembers: 3,
    });

    await expect(tournament.validate()).rejects.toThrow(
      "El maximo de integrantes no puede ser menor que el minimo",
    );
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
