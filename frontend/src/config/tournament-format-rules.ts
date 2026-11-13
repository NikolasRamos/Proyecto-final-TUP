import type { TournamentModality } from "../types/tournament";

interface TournamentFormatUiRule {
  minParticipants: number;
  hint: string | null;
  isValidParticipantCount?: (participantCount: number) => boolean;
  invalidParticipantCountMessage?: string;
}

export interface GroupsPlayoffConfiguration {
  playoffSpots: number;
  groupCount: number;
  maxParticipantsPerGroup: number;
}

export interface SwissConfiguration {
  maxParticipants: number;
  swissRounds: number;
}

const generalRule: TournamentFormatUiRule = {
  minParticipants: 2,
  hint: null,
};

const formatRules: Partial<Record<TournamentModality, TournamentFormatUiRule>> =
  {
    league: {
      minParticipants: 3,
      hint: "Una liga necesita al menos 3 participantes.",
    },
    single_elimination: {
      minParticipants: 2,
      hint: "Usá un cupo de 2, 4, 8, 16, 32… para formar una llave completa.",
      isValidParticipantCount: (participantCount) =>
        Number.isInteger(participantCount) &&
        participantCount >= 2 &&
        Number.isInteger(Math.log2(participantCount)),
      invalidParticipantCountMessage:
        "La eliminación simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...).",
    },
    swiss: {
      minParticipants: 4,
      hint: "El formato Suizo necesita al menos 4 participantes.",
    },
    free_for_all: {
      minParticipants: 3,
      hint: "Un Free-for-all necesita al menos 3 participantes.",
    },
    gauntlet: {
      minParticipants: 2,
      hint: "Un Gauntlet necesita al menos 2 participantes.",
    },
  };

export function getTournamentFormatUiRule(
  format: TournamentModality,
): TournamentFormatUiRule {
  return formatRules[format] ?? generalRule;
}

export function getTournamentFormatParticipantError(
  format: TournamentModality,
  participantCount: number,
): string | null {
  const rule = getTournamentFormatUiRule(format);

  if (participantCount < rule.minParticipants) {
    return rule.hint ?? "El cupo no cumple las reglas del formato.";
  }

  if (
    rule.isValidParticipantCount &&
    !rule.isValidParticipantCount(participantCount)
  ) {
    return (
      rule.invalidParticipantCountMessage ??
      "El cupo no cumple las reglas del formato."
    );
  }

  return null;
}

export function getGroupsPlayoffConfigurationError({
  playoffSpots,
  groupCount,
  maxParticipantsPerGroup,
}: GroupsPlayoffConfiguration): string | null {
  if (
    !Number.isInteger(playoffSpots) ||
    playoffSpots < 2 ||
    !Number.isInteger(Math.log2(playoffSpots))
  ) {
    return "Los lugares del playoff deben ser una potencia de 2 (2, 4, 8, 16...).";
  }

  if (!Number.isInteger(groupCount) || groupCount < 2) {
    return "El torneo debe tener al menos 2 grupos.";
  }

  if (groupCount > playoffSpots) {
    return "La cantidad de grupos no puede superar los lugares del playoff.";
  }

  if (playoffSpots % groupCount !== 0) {
    return "La cantidad de grupos debe dividir exactamente los lugares del playoff.";
  }

  const qualifiersPerGroup = playoffSpots / groupCount;

  if (
    !Number.isInteger(maxParticipantsPerGroup) ||
    maxParticipantsPerGroup <= qualifiersPerGroup
  ) {
    return "El máximo por grupo debe ser mayor que los clasificados por grupo.";
  }

  return null;
}

export function getRecommendedSwissRounds(maxParticipants: number): number {
  return maxParticipants >= 2 ? Math.ceil(Math.log2(maxParticipants)) : 1;
}

export function getSwissConfigurationError({
  maxParticipants,
  swissRounds,
}: SwissConfiguration): string | null {
  if (!Number.isInteger(swissRounds) || swissRounds < 1) {
    return "El torneo Suizo debe tener al menos una ronda.";
  }

  if (swissRounds > maxParticipants - 1) {
    return "Las rondas no pueden superar la cantidad de rivales distintos disponibles.";
  }

  return null;
}
