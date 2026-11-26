import {
  MIN_PARTICIPANTS_BY_FORMAT,
  validateSwissRounds,
} from "../../../shared/tournament-format-rules.ts";
import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const SWISS_MIN_PARTICIPANTS = MIN_PARTICIPANTS_BY_FORMAT.swiss;

export default class SwissTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("swiss");
  }

  validate(tournament) {
    const issues = [];

    if (tournament.maxParticipants < SWISS_MIN_PARTICIPANTS) {
      issues.push({
        path: ["maxParticipants"],
        message: `Un torneo Suizo necesita al menos ${SWISS_MIN_PARTICIPANTS} participantes`,
      });
    }

    if (
      tournament.swissRounds === null ||
      tournament.swissRounds === undefined
    ) {
      issues.push({
        path: ["swissRounds"],
        message: "Debe indicar la cantidad de rondas del torneo Suizo",
      });
      return issues;
    }

    const roundsError = validateSwissRounds(
      tournament.maxParticipants,
      tournament.swissRounds,
    );
    if (roundsError)
      issues.push({ path: ["swissRounds"], message: roundsError });

    return issues;
  }
}
