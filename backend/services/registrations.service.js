import { Op } from "sequelize";

import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import Tournament from "../models/Tournament.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import TournamentRegistrationMember from "../models/TournamentRegistrationMember.js";

export function registerTeamInTournament(tournamentId, teamId, memberIds) {
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

    if (tournament.isTeamTournament === false) {
      return { outcome: "individual_tournament" };
    }

    const team = await Team.findByPk(teamId, {
      attributes: ["id"],
      transaction,
    });

    if (!team) {
      return { outcome: "team_not_found" };
    }

    const memberships = await TeamMember.findAll({
      attributes: ["userId"],
      where: { teamId },
      transaction,
      raw: true,
    });
    const teamMemberIds = new Set(
      memberships.map((membership) => membership.userId),
    );

    if (memberIds.some((memberId) => !teamMemberIds.has(memberId))) {
      return { outcome: "member_not_in_team" };
    }

    const minimumMembers = tournament.minTeamMembers ?? 1;
    const maximumMembers = tournament.maxTeamMembers ?? teamMemberIds.size;

    if (
      memberIds.length < minimumMembers ||
      memberIds.length > maximumMembers
    ) {
      return {
        outcome: "invalid_roster_size",
        minimumMembers,
        maximumMembers,
      };
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

      if (existingRegistration) {
        await TournamentRegistrationMember.destroy({
          where: { registrationId: registration.id },
          transaction,
        });
      }

      await TournamentRegistrationMember.bulkCreate(
        memberIds.map((userId) => ({
          registrationId: registration.id,
          userId,
        })),
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
  const registrationIds = rows.map((registration) => registration.id);
  const registrationMembers = await TournamentRegistrationMember.findAll({
    attributes: ["registrationId", "userId"],
    where: { registrationId: { [Op.in]: registrationIds } },
    order: [
      ["registrationId", "ASC"],
      ["createdAt", "ASC"],
    ],
    raw: true,
  });
  const memberIdsByRegistration = new Map();

  for (const member of registrationMembers) {
    const memberIds = memberIdsByRegistration.get(member.registrationId) ?? [];
    memberIds.push(member.userId);
    memberIdsByRegistration.set(member.registrationId, memberIds);
  }

  return {
    outcome: "found",
    count,
    registrations: rows.map((registration) => ({
      id: registration.id,
      status: registration.status,
      registeredAt: registration.createdAt,
      updatedAt: registration.updatedAt,
      memberIds: memberIdsByRegistration.get(registration.id) ?? [],
      team: teamsById.get(registration.teamId) ?? {
        id: registration.teamId,
        name: null,
      },
    })),
  };
}
