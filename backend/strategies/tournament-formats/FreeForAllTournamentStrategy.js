import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const FREE_FOR_ALL_MIN_PARTICIPANTS = 3;

export default class FreeForAllTournamentStrategy extends TournamentFormatStrategy {
  constructor() {
    super("free_for_all");
  }

  validate(tournament) {
    if (tournament.maxParticipants < FREE_FOR_ALL_MIN_PARTICIPANTS) {
      return [
        {
          path: ["maxParticipants"],
          message: `Un torneo Free-for-all necesita al menos ${FREE_FOR_ALL_MIN_PARTICIPANTS} participantes`,
        },
      ];
    }

    return [];
  }
}
