import { Op } from "sequelize";

import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import TournamentRegistration from "../models/TournamentRegistration.js";

export async function getTournamentReportData(tournamentId) {
  const tournament = await Tournament.findByPk(tournamentId, { raw: true });

  if (!tournament) {
    return { outcome: "not_found" };
  }

  const registrations = await TournamentRegistration.findAll({
    attributes: ["id", "teamId", "createdAt"],
    where: { tournamentId, status: "registered" },
    order: [
      ["createdAt", "ASC"],
      ["id", "ASC"],
    ],
    raw: true,
  });
  const teamIds = registrations.map((registration) => registration.teamId);
  const teams =
    teamIds.length === 0
      ? []
      : await Team.findAll({
          attributes: ["id", "name"],
          where: { id: { [Op.in]: teamIds } },
          raw: true,
        });
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return {
    outcome: "found",
    report: {
      tournament,
      generatedAt: new Date(),
      registrations: registrations.map((registration) => ({
        id: registration.id,
        registeredAt: registration.createdAt,
        team: teamsById.get(registration.teamId) ?? {
          id: registration.teamId,
          name: null,
        },
      })),
    },
  };
}
