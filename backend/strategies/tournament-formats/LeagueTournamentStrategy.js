import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const LEAGUE_MIN_PARTICIPANTS = 3;

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
