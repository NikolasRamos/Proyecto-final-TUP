import { Op } from "sequelize";

import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import User from "../models/user.js";

function findActiveCaptain(captainId, transaction) {
  return User.findByPk(captainId, {
    attributes: ["idUsuario"],
    transaction,
    lock: transaction.LOCK.SHARE,
  });
}

function lockTeam(teamId, transaction) {
  return Team.findByPk(teamId, { transaction, lock: transaction.LOCK.UPDATE });
}

export function createTeam(teamData) {
  return database.transaction(async (transaction) => {
    const captain = await findActiveCaptain(teamData.captainId, transaction);
    if (!captain) return null;

    const team = await Team.create(
      { ...teamData, captainAccountId: captain.idUsuario },
      { transaction },
    );

    await TeamMember.create(
      {
        teamId: team.id,
        userId: team.captainId,
      },
      { transaction },
    );

    return team;
  });
}

export function assignTeamCaptain(teamId, captainId) {
  return database.transaction(async (transaction) => {
    const team = await lockTeam(teamId, transaction);
    if (!team) return { outcome: "team_not_found" };

    const captain = await findActiveCaptain(captainId, transaction);
    if (!captain) return { outcome: "captain_not_found" };

    await TeamMember.findOrCreate({
      where: { teamId, userId: captain.idUsuario },
      transaction,
    });
    await team.update(
      { captainId: captain.idUsuario, captainAccountId: captain.idUsuario },
      { transaction },
    );
    return { outcome: "assigned", team };
  });
}

export function listTeams({ search, page, limit }) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  return Team.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
    limit,
    offset: (page - 1) * limit,
  });
}

export function getTeamById(teamId) {
  return Team.findByPk(teamId);
}

export async function updateTeam(teamId, teamData) {
  const team = await Team.findByPk(teamId);

  if (!team) {
    return null;
  }

  return team.update(teamData);
}

export async function deleteTeam(teamId, { userId, role }) {
  try {
    return await database.transaction(async (transaction) => {
      const team = await lockTeam(teamId, transaction);
      if (!team) return { outcome: "team_not_found" };
      if (role !== "administrador" && team.captainAccountId !== userId) {
        return { outcome: "forbidden" };
      }

      const count = await TournamentRegistration.count({
        where: { teamId },
        transaction,
      });
      if (count > 0) return { outcome: "has_registrations" };

      await team.destroy({ transaction });
      return { outcome: "deleted" };
    });
  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      return { outcome: "has_registrations" };
    }

    throw error;
  }
}

export async function addTeamMember(teamId, userId) {
  const team = await Team.findByPk(teamId, {
    attributes: ["id"],
  });

  if (!team) {
    return { outcome: "team_not_found" };
  }

  const existingMembership = await TeamMember.findOne({
    where: { teamId, userId },
  });

  if (existingMembership) {
    return { outcome: "already_member" };
  }

  try {
    const membership = await TeamMember.create({ teamId, userId });

    return { outcome: "added", membership };
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return { outcome: "already_member" };
    }

    throw error;
  }
}

export async function listTeamMembers(teamId) {
  const team = await Team.findByPk(teamId, {
    attributes: ["id", "captainId"],
  });

  if (!team) {
    return { outcome: "team_not_found" };
  }

  const memberships = await TeamMember.findAll({
    attributes: ["id", "userId", "createdAt"],
    where: { teamId },
    order: [["createdAt", "ASC"]],
    raw: true,
  });

  return {
    outcome: "found",
    members: memberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      isCaptain: membership.userId === team.captainId,
      joinedAt: membership.createdAt,
    })),
  };
}

export function removeTeamMember(teamId, userId) {
  return database.transaction(async (transaction) => {
    const team = await lockTeam(teamId, transaction);
    if (!team) return { outcome: "team_not_found" };
    if (team.captainId === userId)
      return { outcome: "captain_cannot_be_removed" };

    const membership = await TeamMember.findOne({
      where: { teamId, userId },
      transaction,
    });
    if (!membership) return { outcome: "member_not_found" };

    await membership.destroy({ transaction });
    return { outcome: "removed" };
  });
}
