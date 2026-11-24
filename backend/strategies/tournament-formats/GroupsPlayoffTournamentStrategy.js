import TournamentFormatStrategy from "./TournamentFormatStrategy.js";
import { isPowerOfTwo } from "./tournament-format.utils.js";

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

    const { playoffSpots, groupCount, maxParticipantsPerGroup } = tournament;

    if (!isPowerOfTwo(playoffSpots)) {
      issues.push({
        path: ["playoffSpots"],
        message:
          "Los lugares del playoff deben ser una potencia de 2 (2, 4, 8, 16...)",
      });
    }

    const validGroupCount = Number.isInteger(groupCount) && groupCount >= 2;

    if (!validGroupCount) {
      issues.push({
        path: ["groupCount"],
        message: "El torneo debe tener al menos 2 grupos",
      });
    } else if (groupCount > playoffSpots) {
      issues.push({
        path: ["groupCount"],
        message:
          "La cantidad de grupos no puede superar los lugares del playoff",
      });
    } else if (playoffSpots % groupCount !== 0) {
      issues.push({
        path: ["groupCount"],
        message:
          "La cantidad de grupos debe dividir exactamente los lugares del playoff",
      });
    } else if (isPowerOfTwo(playoffSpots)) {
      const qualifiersPerGroup = playoffSpots / groupCount;

      if (
        !Number.isInteger(maxParticipantsPerGroup) ||
        maxParticipantsPerGroup <= qualifiersPerGroup
      ) {
        issues.push({
          path: ["maxParticipantsPerGroup"],
          message:
            "El maximo por grupo debe ser mayor que los clasificados por grupo",
        });
      }
    }

    const expectedMaxParticipants = groupCount * maxParticipantsPerGroup;

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
