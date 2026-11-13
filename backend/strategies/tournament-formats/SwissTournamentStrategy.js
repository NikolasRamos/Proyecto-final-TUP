import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const SWISS_MIN_PARTICIPANTS = 4;

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

    if (
      !Number.isInteger(tournament.swissRounds) ||
      tournament.swissRounds < 1
    ) {
      issues.push({
        path: ["swissRounds"],
        message: "El torneo Suizo debe tener al menos una ronda",
      });
    } else if (tournament.swissRounds > tournament.maxParticipants - 1) {
      issues.push({
        path: ["swissRounds"],
        message:
          "Las rondas no pueden superar la cantidad de rivales distintos disponibles",
      });
    }

    return issues;
  }
}
