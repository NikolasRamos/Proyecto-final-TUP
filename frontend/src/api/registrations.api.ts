import type { PaginatedResponse } from "../types/api";
import type {
  RegistrationResponse,
  RegistrationStatus,
  TournamentRegistration,
} from "../types/registration";
import { apiDelete, apiGet, apiPost } from "./client";

interface ListTournamentRegistrationsParams {
  status?: RegistrationStatus;
  page?: number;
  limit?: number;
}

export function listTournamentRegistrations(
  tournamentId: number,
  {
    status = "registered",
    page = 1,
    limit = 100,
  }: ListTournamentRegistrationsParams = {},
) {
  const query = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  });

  return apiGet<PaginatedResponse<TournamentRegistration>>(
    `/api/tournaments/${tournamentId}/registrations?${query.toString()}`,
  );
}

export function registerTeamInTournament(tournamentId: number, teamId: number) {
  return apiPost<RegistrationResponse, { teamId: number }>(
    `/api/tournaments/${tournamentId}/registrations`,
    { teamId },
  );
}

export function withdrawTeamFromTournament(
  tournamentId: number,
  teamId: number,
) {
  return apiDelete<RegistrationResponse>(
    `/api/tournaments/${tournamentId}/registrations/${teamId}`,
  );
}
