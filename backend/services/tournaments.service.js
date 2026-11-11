import { Op } from "sequelize";

import Tournament from "../models/Tournament.js";

const allowedStatusTransitions = Object.freeze({
  draft: ["open", "cancelled"],
  open: ["in_progress", "cancelled"],
  in_progress: ["finished", "cancelled"],
  finished: [],
  cancelled: [],
});

export function createTournament(tournamentData) {
  return Tournament.create(tournamentData);
}

export function listTournaments({
  search,
  status,
  modality,
  page,
  limit,
  sortBy = "createdAt",
  order = "desc",
}) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (status) {
    where.status = status;
  }

  if (modality) {
    where.modality = modality;
  }

  return Tournament.findAndCountAll({
    where,
    order: [
      [sortBy, order.toUpperCase()],
      ["id", "ASC"],
    ],
    limit,
    offset: (page - 1) * limit,
  });
}

export function getTournamentById(tournamentId) {
  return Tournament.findByPk(tournamentId);
}

export async function updateTournament(tournamentId, tournamentData) {
  const tournament = await Tournament.findByPk(tournamentId);

  if (!tournament) {
    return { outcome: "not_found" };
  }

  const participationChanged =
    tournament.maxParticipants !== tournamentData.maxParticipants ||
    tournament.isTeamTournament !== tournamentData.isTeamTournament ||
    tournament.minTeamMembers !== tournamentData.minTeamMembers ||
    tournament.maxTeamMembers !== tournamentData.maxTeamMembers;

  if (tournament.status !== "draft" && participationChanged) {
    return { outcome: "participation_locked" };
  }

  const updatedTournament = await tournament.update(tournamentData);

  return { outcome: "updated", tournament: updatedTournament };
}

export async function updateTournamentStatus(tournamentId, nextStatus) {
  const tournament = await Tournament.findByPk(tournamentId);

  if (!tournament) {
    return { outcome: "not_found" };
  }

  if (tournament.status === nextStatus) {
    return { outcome: "updated", tournament };
  }

  if (!allowedStatusTransitions[tournament.status]?.includes(nextStatus)) {
    return { outcome: "invalid_transition" };
  }

  const updatedTournament = await tournament.update({ status: nextStatus });

  return { outcome: "updated", tournament: updatedTournament };
}

export async function deleteTournament(tournamentId) {
  const tournament = await Tournament.findByPk(tournamentId);

  if (!tournament) {
    return { outcome: "not_found" };
  }

  if (tournament.status !== "draft") {
    return { outcome: "not_deletable" };
  }

  await tournament.destroy();

  return { outcome: "deleted" };
}
