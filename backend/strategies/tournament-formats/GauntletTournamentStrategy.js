import TournamentFormatStrategy from "./TournamentFormatStrategy.js";

export const GAUNTLET_MIN_PARTICIPANTS = 2;

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
