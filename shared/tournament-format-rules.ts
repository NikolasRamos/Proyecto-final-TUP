export const MIN_TOURNAMENT_PARTICIPANTS = 2;
export const MIN_KNOCKOUT_SLOTS = 2;
export const MIN_GROUP_COUNT = 2;
export const MIN_SWISS_ROUNDS = 1;
export const MIN_SWISS_ROUNDS_MESSAGE =
  "El torneo Suizo debe tener al menos una ronda";

export const MIN_PARTICIPANTS_BY_FORMAT = Object.freeze({
  league: 3,
  single_elimination: MIN_KNOCKOUT_SLOTS,
  groups_playoff: MIN_TOURNAMENT_PARTICIPANTS,
  swiss: 4,
  free_for_all: 3,
  gauntlet: 2,
});

export interface GroupsPlayoffConfiguration {
  playoffSpots: number;
  groupCount: number;
  maxParticipantsPerGroup: number;
}

interface GroupConfigurationIssue {
  field: keyof GroupsPlayoffConfiguration;
  message: string;
}

export function isPowerOfTwo(value: number) {
  return (
    Number.isInteger(value) &&
    value >= MIN_KNOCKOUT_SLOTS &&
    Number.isInteger(Math.log2(value))
  );
}

export function getGroupsPlayoffCapacity(
  groupCount: number,
  maxParticipantsPerGroup: number,
) {
  return groupCount * maxParticipantsPerGroup;
}

export function validateGroupsPlayoffConfiguration({
  playoffSpots,
  groupCount,
  maxParticipantsPerGroup,
}: GroupsPlayoffConfiguration): GroupConfigurationIssue[] {
  const issues: GroupConfigurationIssue[] = [];
  const validPlayoffSpots = isPowerOfTwo(playoffSpots);

  if (!validPlayoffSpots) {
    issues.push({
      field: "playoffSpots",
      message:
        "Los lugares del playoff deben ser una potencia de 2 (2, 4, 8, 16...)",
    });
  }

  if (!Number.isInteger(groupCount) || groupCount < MIN_GROUP_COUNT) {
    issues.push({
      field: "groupCount",
      message: `El torneo debe tener al menos ${MIN_GROUP_COUNT} grupos`,
    });
  } else if (groupCount > playoffSpots) {
    issues.push({
      field: "groupCount",
      message: "La cantidad de grupos no puede superar los lugares del playoff",
    });
  } else if (playoffSpots % groupCount !== 0) {
    issues.push({
      field: "groupCount",
      message:
        "La cantidad de grupos debe dividir exactamente los lugares del playoff",
    });
  } else if (
    validPlayoffSpots &&
    (!Number.isInteger(maxParticipantsPerGroup) ||
      maxParticipantsPerGroup <= playoffSpots / groupCount)
  ) {
    issues.push({
      field: "maxParticipantsPerGroup",
      message:
        "El maximo por grupo debe ser mayor que los clasificados por grupo",
    });
  }

  return issues;
}

export function getMaxSwissRounds(maxParticipants: number) {
  return maxParticipants - 1;
}

export function validateSwissRounds(
  maxParticipants: number,
  swissRounds: number,
) {
  if (!Number.isInteger(swissRounds) || swissRounds < MIN_SWISS_ROUNDS) {
    return MIN_SWISS_ROUNDS_MESSAGE;
  }

  if (swissRounds > getMaxSwissRounds(maxParticipants)) {
    return "Las rondas no pueden superar la cantidad de rivales distintos disponibles";
  }

  return null;
}
