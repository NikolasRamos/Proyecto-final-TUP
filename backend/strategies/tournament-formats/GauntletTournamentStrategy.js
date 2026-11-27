import { MIN_PARTICIPANTS_BY_FORMAT } from "../../../shared/tournament-format-rules.js";
import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const GAUNTLET_MIN_PARTICIPANTS = MIN_PARTICIPANTS_BY_FORMAT.gauntlet;

export default class GauntletTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("gauntlet");
  }

  validate(tournament) {
    if (tournament.maxParticipants < GAUNTLET_MIN_PARTICIPANTS) {
      return [
        {
          path: ["maxParticipants"],
          message: `Un torneo Gauntlet necesita al menos ${GAUNTLET_MIN_PARTICIPANTS} participantes`,
        },
      ];
    }

    return [];
  }
}
