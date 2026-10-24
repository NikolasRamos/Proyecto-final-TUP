import { Op } from "sequelize";

import database from "../config/database.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import TournamentRegistration from "../models/TournamentRegistration.js";

export function registerTeamInTournament(tournamentId, teamId) {
  return database.transaction(async (transaction) => {
    const tournament = await Tournament.findByPk(tournamentId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!tournament) {
      return { outcome: "tournament_not_found" };
    }

    if (tournament.status !== "open") {
      return { outcome: "tournament_not_open" };
    }

    const team = await Team.findByPk(teamId, {
      attributes: ["id"],
      transaction,
    });

    if (!team) {
      return { outcome: "team_not_found" };
    }

    const existingRegistration = await TournamentRegistration.findOne({
      where: { tournamentId, teamId },
      transaction,
    });

    if (existingRegistration?.status === "registered") {
      return { outcome: "already_registered" };
    }

    const registrationCount = await TournamentRegistration.count({
      where: { tournamentId, status: "registered" },
      transaction,
    });

    if (registrationCount >= tournament.maxParticipants) {
      return { outcome: "tournament_full" };
    }

    try {
      const registration = existingRegistration
        ? await existingRegistration.update(
            { status: "registered" },
            { transaction },
          )
        : await TournamentRegistration.create(
            { tournamentId, teamId },
            { transaction },
          );

      return { outcome: "registered", registration };
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return { outcome: "already_registered" };
      }

      throw error;
    }
  });
}

export function withdrawTeamFromTournament(tournamentId, teamId) {
  return database.transaction(async (transaction) => {
    const tournament = await Tournament.findByPk(tournamentId, {
      attributes: ["id", "status"],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!tournament) {
      return { outcome: "tournament_not_found" };
    }

    if (tournament.status !== "open") {
      return { outcome: "tournament_not_open" };
    }

    const registration = await TournamentRegistration.findOne({
      where: { tournamentId, teamId },
      transaction,
    });

    if (!registration) {
      return { outcome: "registration_not_found" };
    }

    if (registration.status === "withdrawn") {
      return { outcome: "already_withdrawn" };
    }

    const withdrawnRegistration = await registration.update(
      { status: "withdrawn" },
      { transaction },
    );

    return { outcome: "withdrawn", registration: withdrawnRegistration };
  });
}

export async function listTournamentRegistrations(
  tournamentId,
  { status, page, limit },
) {
  const tournament = await Tournament.findByPk(tournamentId, {
    attributes: ["id"],
  });

  if (!tournament) {
    return { outcome: "tournament_not_found" };
  }

  const { count, rows } = await TournamentRegistration.findAndCountAll({
    attributes: ["id", "teamId", "status", "createdAt", "updatedAt"],
    where: { tournamentId, status },
    order: [["createdAt", "ASC"]],
    limit,
    offset: (page - 1) * limit,
    raw: true,
  });

  const teamIds = rows.map((registration) => registration.teamId);
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
    count,
    registrations: rows.map((registration) => ({
      id: registration.id,
      status: registration.status,
      registeredAt: registration.createdAt,
      updatedAt: registration.updatedAt,
      team: teamsById.get(registration.teamId) ?? {
        id: registration.teamId,
        name: null,
      },
    })),
  };
}
