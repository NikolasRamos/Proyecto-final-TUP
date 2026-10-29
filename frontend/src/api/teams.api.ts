import type { PaginatedResponse } from "../types/api";
import type { Team } from "../types/team";
import { apiGet } from "./client";

export interface ListTeamsParams {
  page?: number;
  limit?: number;
}

export function listTeams({ page = 1, limit = 5 }: ListTeamsParams = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  return apiGet<PaginatedResponse<Team>>(`/api/teams?${query.toString()}`);
}
