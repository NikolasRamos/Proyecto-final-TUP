import {
  getGroupsPlayoffCapacity,
  validateGroupsPlayoffConfiguration,
} from "../../../shared/tournament-format-rules.js";
import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

const CONFIGURATION_FIELDS = [
  ["playoffSpots", "Debe indicar la cantidad de lugares del playoff"],
  ["groupCount", "Debe indicar la cantidad de grupos"],
  [
    "maxParticipantsPerGroup",
    "Debe indicar el maximo de participantes por grupo",
  ],
];

export default class GroupsPlayoffTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("groups_playoff");
  }

  validate(tournament) {
    const issues = CONFIGURATION_FIELDS.filter(
      ([field]) =>
        tournament[field] === null || tournament[field] === undefined,
    ).map(([field, message]) => ({ path: [field], message }));

    if (issues.length > 0) {
      return issues;
    }

    issues.push(
      ...validateGroupsPlayoffConfiguration(tournament).map(
        ({ field, message }) => ({
          path: [field],
          message,
        }),
      ),
    );

    const expectedMaxParticipants = getGroupsPlayoffCapacity(
      tournament.groupCount,
      tournament.maxParticipantsPerGroup,
    );
    if (
      Number.isInteger(expectedMaxParticipants) &&
      tournament.maxParticipants !== expectedMaxParticipants
    ) {
      issues.push({
        path: ["maxParticipants"],
        message: `El cupo maximo debe ser ${expectedMaxParticipants} segun la configuracion de grupos`,
      });
    }

    return issues;
  }
}
