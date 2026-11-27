import { MIN_PARTICIPANTS_BY_FORMAT } from "../../../shared/tournament-format-rules.js";
import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const LEAGUE_MIN_PARTICIPANTS = MIN_PARTICIPANTS_BY_FORMAT.league;

export default class LeagueTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("league");
  }

  validate(tournament) {
    if (tournament.maxParticipants < LEAGUE_MIN_PARTICIPANTS) {
      return [
        {
          path: ["maxParticipants"],
          message: `Una liga necesita al menos ${LEAGUE_MIN_PARTICIPANTS} participantes`,
        },
      ];
    }

    return [];
  }
}
