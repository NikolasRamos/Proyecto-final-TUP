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

export function listTournaments({ status, modality, page, limit }) {
  const where = {};

  if (status) {
    where.status = status;
  }

  if (modality) {
    where.modality = modality;
  }

  return Tournament.findAndCountAll({
    where,
    order: [["createdAt", "DESC"]],
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
    return null;
  }

  return tournament.update(tournamentData);
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
