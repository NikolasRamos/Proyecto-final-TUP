import FreeForAllTournamentStrategy from "./FreeForAllTournamentStrategy.js";
import GauntletTournamentStrategy from "./GauntletTournamentStrategy.js";
import GroupsPlayoffTournamentStrategy from "./GroupsPlayoffTournamentStrategy.js";
import LeagueTournamentStrategy from "./LeagueTournamentStrategy.js";
import SingleEliminationTournamentStrategy from "./SingleEliminationTournamentStrategy.js";
import SwissTournamentStrategy from "./SwissTournamentStrategy.js";

const freeForAllStrategy = new FreeForAllTournamentStrategy();
const gauntletStrategy = new GauntletTournamentStrategy();
const groupsPlayoffStrategy = new GroupsPlayoffTournamentStrategy();
const leagueStrategy = new LeagueTournamentStrategy();
const singleEliminationStrategy = new SingleEliminationTournamentStrategy();
const swissStrategy = new SwissTournamentStrategy();
const strategies = new Map([
  [leagueStrategy.format, leagueStrategy],
  [singleEliminationStrategy.format, singleEliminationStrategy],
  [groupsPlayoffStrategy.format, groupsPlayoffStrategy],
  [swissStrategy.format, swissStrategy],
  [freeForAllStrategy.format, freeForAllStrategy],
  [gauntletStrategy.format, gauntletStrategy],
]);

export function getTournamentFormatStrategy(format) {
  return strategies.get(format) ?? null;
}

export function getImplementedTournamentFormatStrategies() {
  return [...strategies.values()];
}
