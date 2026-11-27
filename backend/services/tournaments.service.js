import { Op } from "sequelize";

import Tournament from "../models/Tournament.js";
import { getUserNamesByIds } from "./user-names.service.js";

export const publicTournamentStatuses = Object.freeze(["open", "in_progress"]);

function tournamentVisibility(organizerAccountId, statuses) {
  const publicTournaments = { status: { [Op.in]: statuses } };
  return organizerAccountId === undefined
    ? publicTournaments
    : {
        [Op.or]: [publicTournaments, { organizerAccountId }],
      };
}

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

export function listTournaments(
  {
    search,
    status,
    modality,
    page,
    limit,
    sortBy = "createdAt",
    order = "desc",
  },
  { publicOnly = false, organizerAccountId } = {},
) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${search}%` } },
      { description: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (publicOnly && organizerAccountId !== undefined) {
    where[Op.and] = [
      tournamentVisibility(organizerAccountId, publicTournamentStatuses),
    ];
    if (status) where.status = status;
  } else if (publicOnly) {
    const visibleStatuses = status
      ? publicTournamentStatuses.filter(
          (visibleStatus) => visibleStatus === status,
        )
      : publicTournamentStatuses;
    where.status = { [Op.in]: visibleStatuses };
  } else if (status) {
    where.status = status;
  }

  if (!publicOnly && organizerAccountId !== undefined) {
    where.organizerAccountId = organizerAccountId;
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

export async function getTournamentById(
  tournamentId,
  { publicOnly = false } = {},
) {
  const tournament = publicOnly
    ? await Tournament.findOne({
        where: {
          id: tournamentId,
          status: { [Op.in]: publicTournamentStatuses },
        },
      })
    : await Tournament.findByPk(tournamentId);

  if (!tournament) return tournament;

  const { organizerAccountId } = tournament;
  const namesById = await getUserNamesByIds([organizerAccountId]);
  const organizerName = namesById.get(organizerAccountId) ?? null;

  if (typeof tournament.setDataValue === "function") {
    tournament.setDataValue("organizerName", organizerName);
  } else {
    tournament.organizerName = organizerName;
  }

  return tournament;
}

export async function updateTournament(tournamentId, tournamentData) {
  const tournament = await Tournament.findByPk(tournamentId);

  if (!tournament) {
    return { outcome: "not_found" };
  }

  const formatConfigurationChanged = [
    "playoffSpots",
    "groupCount",
    "maxParticipantsPerGroup",
  ].some(
    (field) =>
      Object.hasOwn(tournamentData, field) &&
      tournament[field] !== tournamentData[field],
  );
  const swissRoundsChanged =
    Object.hasOwn(tournamentData, "swissRounds") &&
    tournament.swissRounds !== tournamentData.swissRounds;
  const participationChanged =
    tournament.modality !== tournamentData.modality ||
    tournament.maxParticipants !== tournamentData.maxParticipants ||
    formatConfigurationChanged ||
    tournament.isTeamTournament !== tournamentData.isTeamTournament ||
    tournament.minTeamMembers !== tournamentData.minTeamMembers ||
    tournament.maxTeamMembers !== tournamentData.maxTeamMembers;

  if (tournament.status !== "draft" && participationChanged) {
    return { outcome: "participation_locked" };
  }

  if (
    ["in_progress", "finished", "cancelled"].includes(tournament.status) &&
    swissRoundsChanged
  ) {
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
