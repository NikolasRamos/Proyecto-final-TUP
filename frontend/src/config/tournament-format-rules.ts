import {
  isPowerOfTwo,
  MIN_PARTICIPANTS_BY_FORMAT,
  MIN_TOURNAMENT_PARTICIPANTS,
  validateGroupsPlayoffConfiguration,
  validateSwissRounds,
  type GroupsPlayoffConfiguration,
} from "../../../shared/tournament-format-rules.ts";
import type { TournamentModality } from "../types/tournament";

const formatHints: Partial<Record<TournamentModality, string>> = {
  league: `Una liga necesita al menos ${MIN_PARTICIPANTS_BY_FORMAT.league} participantes.`,
  single_elimination:
    "Usá un cupo de 2, 4, 8, 16, 32… para formar una llave completa.",
  swiss: `El formato Suizo necesita al menos ${MIN_PARTICIPANTS_BY_FORMAT.swiss} participantes.`,
  free_for_all: `Un Free-for-all necesita al menos ${MIN_PARTICIPANTS_BY_FORMAT.free_for_all} participantes.`,
  gauntlet: `Un Gauntlet necesita al menos ${MIN_PARTICIPANTS_BY_FORMAT.gauntlet} participantes.`,
};

export function getTournamentFormatUiRule(format: TournamentModality) {
  return {
    minParticipants:
      MIN_PARTICIPANTS_BY_FORMAT[format] ?? MIN_TOURNAMENT_PARTICIPANTS,
    hint: formatHints[format] ?? null,
  };
}

export function getTournamentFormatParticipantError(
  format: TournamentModality,
  participantCount: number,
): string | null {
  const rule = getTournamentFormatUiRule(format);

  if (participantCount < rule.minParticipants) {
    return rule.hint ?? "El cupo no cumple las reglas del formato.";
  }

  if (format === "single_elimination" && !isPowerOfTwo(participantCount)) {
    return "La eliminación simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...).";
  }

  return null;
}

export function getGroupsPlayoffConfigurationError(
  configuration: GroupsPlayoffConfiguration,
): string | null {
  const [issue] = validateGroupsPlayoffConfiguration(configuration);
  if (!issue) return null;

  if (issue.field === "maxParticipantsPerGroup") {
    return "El máximo por grupo debe ser mayor que los clasificados por grupo.";
  }
  return `${issue.message}.`;
}

export function getRecommendedSwissRounds(maxParticipants: number): number {
  return maxParticipants >= 2 ? Math.ceil(Math.log2(maxParticipants)) : 1;
}

export function getSwissConfigurationError({
  maxParticipants,
  swissRounds,
}: {
  maxParticipants: number;
  swissRounds: number;
}): string | null {
  const error = validateSwissRounds(maxParticipants, swissRounds);
  return error ? `${error}.` : null;
}
