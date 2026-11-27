import { col, fn, QueryTypes, where } from "sequelize";

import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import TeamMembershipRequest from "../models/TeamMembershipRequest.js";
import User from "../models/user.js";
import {
  attachMemberNames,
  linkTeamMember,
  lockTeam,
} from "./teams.service.js";

function findActiveAccount(userId, transaction) {
  return User.findByPk(userId, {
    attributes: ["idUsuario"],
    transaction,
    lock: transaction.LOCK.SHARE,
  });
}

function findLinkedMember(teamId, userId, transaction) {
  return TeamMember.findOne({
    where: { teamId, userId, accountLinked: true },
    attributes: ["id"],
    transaction,
  });
}

function findPendingRequest(teamId, userId, transaction) {
  return TeamMembershipRequest.findOne({
    where: { teamId, userId, status: "pending" },
    transaction,
  });
}

export async function getTeamMembershipState(teamId, userId) {
  const team = await Team.findByPk(teamId, {
    attributes: ["id", "captainAccountId"],
  });
  if (!team) return { outcome: "team_not_found" };
  if (await findLinkedMember(teamId, userId)) return { state: "member" };
  const pending = await findPendingRequest(teamId, userId);
  if (pending) return { state: pending.kind };
  return { state: team.captainAccountId ? "available" : "unavailable" };
}

export function createMembershipRequest({ teamId, initiatorId, kind, email }) {
  return database.transaction(async (transaction) => {
    const team = await lockTeam(teamId, transaction);
    if (!team) return { outcome: "team_not_found" };

    let userId = initiatorId;
    if (kind === "invitation") {
      if (team.captainAccountId !== initiatorId)
        return { outcome: "forbidden" };
      const accounts = await User.findAll({
        where: where(fn("lower", col("email")), email),
        attributes: ["idUsuario"],
        limit: 2,
        transaction,
        lock: transaction.LOCK.SHARE,
      });
      if (accounts.length !== 1) return { outcome: "account_not_found" };
      userId = accounts[0].idUsuario;
    } else if (
      !team.captainAccountId ||
      !(await findActiveAccount(team.captainAccountId, transaction))
    ) {
      return { outcome: "no_captain" };
    }

    if (
      team.captainAccountId === userId ||
      (await findLinkedMember(teamId, userId, transaction))
    ) {
      return { outcome: "already_member" };
    }
    if (await findPendingRequest(teamId, userId, transaction))
      return { outcome: "already_pending" };

    const membershipRequest = await TeamMembershipRequest.create(
      { teamId, initiatorId, userId, kind },
      { transaction },
    );
    return { outcome: "created", request: membershipRequest };
  });
}

export function decideMembershipRequest({
  teamId,
  requestId,
  actorId,
  status,
}) {
  return database.transaction(async (transaction) => {
    const team = await lockTeam(teamId, transaction);
    if (!team) return { outcome: "team_not_found" };

    const membershipRequest = await TeamMembershipRequest.findOne({
      where: { id: requestId, teamId },
      transaction,
    });
    if (!membershipRequest) return { outcome: "request_not_found" };
    const recipientId =
      membershipRequest.kind === "request"
        ? team.captainAccountId
        : membershipRequest.userId;
    if (recipientId !== actorId || membershipRequest.initiatorId === actorId)
      return { outcome: "forbidden" };
    if (membershipRequest.status === status)
      return { outcome: "decided", request: membershipRequest };
    if (membershipRequest.status !== "pending")
      return { outcome: "already_decided" };

    if (status === "accepted") {
      if (!(await findActiveAccount(membershipRequest.userId, transaction)))
        return { outcome: "account_not_found" };
      await linkTeamMember(teamId, membershipRequest.userId, transaction);
    }
    await membershipRequest.update({ status }, { transaction });
    return { outcome: "decided", request: membershipRequest };
  });
}

async function paginate(select, bind, page, limit, order) {
  const [data, counts] = await Promise.all([
    database.query(`${select} ORDER BY ${order} LIMIT $limit OFFSET $offset`, {
      bind: { ...bind, limit, offset: (page - 1) * limit },
      type: QueryTypes.SELECT,
    }),
    database.query(`SELECT COUNT(*)::int AS total FROM (${select}) AS listed`, {
      bind,
      type: QueryTypes.SELECT,
    }),
  ]);
  const { total } = counts[0];
  return {
    data,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export function listMembershipRequests(
  userId,
  { box, page, limit, requestId },
) {
  const visibility =
    box === "sent"
      ? "r.initiator_id = $userId"
      : `
    r.initiator_id <> $userId AND (
      (r.kind = 'request' AND t.captain_account_id = $userId) OR
      (r.kind = 'invitation' AND r.user_id = $userId)
    )`;

  return paginate(
    `
    SELECT r.id, r.team_id AS "teamId", t.name AS "teamName", r.kind, r.status,
           u.nombre AS "memberName", r.updated_at AS "updatedAt"
    FROM team_membership_requests r
    JOIN teams t ON t.id = r.team_id
    LEFT JOIN usuario u ON u."idUsuario" = r.user_id AND u."deletedAt" IS NULL
    WHERE (${visibility}) AND ($requestId::int IS NULL OR r.id = $requestId)
  `,
    { userId, requestId: requestId ?? null },
    page,
    limit,
    '"updatedAt" DESC, id DESC',
  );
}

export async function listMyTeams(userId, { page, limit }) {
  const result = await paginate(
    `
    SELECT t.id, t.name, t.description, t.captain_id AS "captainId",
      t.captain_account_id AS "captainAccountId", u.nombre AS "captainName",
      t.created_at AS "createdAt", t.updated_at AS "updatedAt"
    FROM team_members m JOIN teams t ON t.id = m.team_id
    LEFT JOIN usuario u ON u."idUsuario" = t.captain_account_id AND u."deletedAt" IS NULL
    WHERE m.user_id = $userId AND m.account_linked
  `,
    { userId },
    page,
    limit,
    "name ASC, id ASC",
  );

  await attachMemberNames(result.data);
  return result;
}
