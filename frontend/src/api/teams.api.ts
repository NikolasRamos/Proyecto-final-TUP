import type { PaginatedResponse } from "../types/api";
import type {
  CreateTeamInput,
  Team,
  TeamMember,
  TeamResponse,
  UpdateTeamInput,
} from "../types/team";
import { apiDelete, apiGet, apiPost, apiPut } from "./client";

export interface ListTeamsParams {
  search?: string;
  page?: number;
  limit?: number;
}

export function listTeams({
  search,
  page = 1,
  limit = 5,
}: ListTeamsParams = {}) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) {
    query.set("search", search);
  }

  return apiGet<PaginatedResponse<Team>>(`/api/teams?${query.toString()}`);
}

export function createTeam(team: CreateTeamInput, token: string) {
  return apiPost<TeamResponse, CreateTeamInput>("/api/teams", team, token);
}

export function getTeam(teamId: number) {
  return apiGet<{ data: Team }>(`/api/teams/${teamId}`);
}

export function updateTeam(
  teamId: number,
  team: UpdateTeamInput,
  token: string,
) {
  return apiPut<TeamResponse, UpdateTeamInput>(
    `/api/teams/${teamId}`,
    team,
    token,
  );
}

export function deleteTeam(teamId: number, token: string) {
  return apiDelete<{ message: string }>(`/api/teams/${teamId}`, token);
}

export function listTeamMembers(teamId: number, token: string) {
  return apiGet<{ data: TeamMember[] }>(`/api/teams/${teamId}/members`, {
    token,
  });
}
