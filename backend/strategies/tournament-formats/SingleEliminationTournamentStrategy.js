import TournamentFormatStrategy from "./TournamentFormatStrategy.js";
import { isPowerOfTwo } from "./tournament-format.utils.js";

export const SINGLE_ELIMINATION_MIN_PARTICIPANTS = 2;
export { isPowerOfTwo };

export default class SingleEliminationTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("single_elimination");
  }

  validate(tournament) {
    if (!isPowerOfTwo(tournament.maxParticipants)) {
      return [
        {
          path: ["maxParticipants"],
          message:
            "La eliminacion simple necesita un cupo que sea potencia de 2 (2, 4, 8, 16...)",
        },
      ];
    }

    return [];
  }
}
