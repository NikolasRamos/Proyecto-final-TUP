import type { PaginatedResponse } from "../types/api";
import type {
  CreateTournamentInput,
  CreateTournamentResponse,
  Tournament,
  TournamentModality,
  TournamentResponse,
  TournamentStatus,
  UpdateTournamentInput,
} from "../types/tournament";
import {
  apiDelete,
  apiDownload,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "./client";

export interface ListTournamentsParams {
  search?: string;
  status?: TournamentStatus;
  modality?: TournamentModality;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "startDate";
  order?: "asc" | "desc";
}

export function listTournaments({
  search,
  status,
  modality,
  page = 1,
  limit = 5,
  sortBy,
  order,
}: ListTournamentsParams = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    query.set("search", search);
  }

  if (status) {
    query.set("status", status);
  }

  if (modality) {
    query.set("modality", modality);
  }

  if (sortBy) {
    query.set("sortBy", sortBy);
  }

  if (order) {
    query.set("order", order);
  }

  return apiGet<PaginatedResponse<Tournament>>(
    `/api/tournaments?${query.toString()}`,
  );
}

export function createTournament(tournament: CreateTournamentInput) {
  return apiPost<CreateTournamentResponse, CreateTournamentInput>(
    "/api/tournaments",
    tournament,
  );
}

export function getTournament(tournamentId: number) {
  return apiGet<{ data: Tournament }>(`/api/tournaments/${tournamentId}`);
}

export function updateTournament(
  tournamentId: number,
  tournament: UpdateTournamentInput,
) {
  return apiPut<TournamentResponse, UpdateTournamentInput>(
    `/api/tournaments/${tournamentId}`,
    tournament,
  );
}

export function deleteTournament(tournamentId: number) {
  return apiDelete<{ message: string }>(`/api/tournaments/${tournamentId}`);
}

export function updateTournamentStatus(
  tournamentId: number,
  status: TournamentStatus,
) {
  return apiPatch<TournamentResponse, { status: TournamentStatus }>(
    `/api/tournaments/${tournamentId}/status`,
    { status },
  );
}

export function downloadTournamentReport(tournamentId: number) {
  return apiDownload(`/api/tournaments/${tournamentId}/report`);
}
