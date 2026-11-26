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

export function listTournaments(
  {
    search,
    status,
    modality,
    page = 1,
    limit = 5,
    sortBy,
    order,
  }: ListTournamentsParams = {},
  token?: string,
) {
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
    { token },
  );
}

export function createTournament(
  tournament: CreateTournamentInput,
  token: string,
) {
  return apiPost<CreateTournamentResponse, CreateTournamentInput>(
    "/api/tournaments",
    tournament,
    token,
  );
}

export function getTournament(tournamentId: number, token?: string) {
  return apiGet<{ data: Tournament }>(`/api/tournaments/${tournamentId}`, {
    token,
  });
}

export function updateTournament(
  tournamentId: number,
  tournament: UpdateTournamentInput,
  token: string,
) {
  return apiPut<TournamentResponse, UpdateTournamentInput>(
    `/api/tournaments/${tournamentId}`,
    tournament,
    token,
  );
}

export function deleteTournament(tournamentId: number, token: string) {
  return apiDelete<{ message: string }>(
    `/api/tournaments/${tournamentId}`,
    token,
  );
}

export function updateTournamentStatus(
  tournamentId: number,
  status: TournamentStatus,
  token: string,
) {
  return apiPatch<TournamentResponse, { status: TournamentStatus }>(
    `/api/tournaments/${tournamentId}/status`,
    { status },
    token,
  );
}

export function downloadTournamentReport(tournamentId: number, token: string) {
  return apiDownload(`/api/tournaments/${tournamentId}/report`, token);
}
