import type { PaginatedResponse } from "../types/api";
import type {
  CreateTournamentInput,
  CreateTournamentResponse,
  Tournament,
  TournamentModality,
  TournamentStatus,
} from "../types/tournament";
import { apiGet, apiPost } from "./client";

export interface ListTournamentsParams {
  status?: TournamentStatus;
  modality?: TournamentModality;
  page?: number;
  limit?: number;
}

export function listTournaments({
  status,
  modality,
  page = 1,
  limit = 5,
}: ListTournamentsParams = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (status) {
    query.set("status", status);
  }

  if (modality) {
    query.set("modality", modality);
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
