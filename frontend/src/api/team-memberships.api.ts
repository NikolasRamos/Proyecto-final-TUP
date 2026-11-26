import { apiGet, apiPatch, apiPost } from "./client";
import type { PaginatedResponse } from "../types/api";
import type { Team } from "../types/team";

export type MembershipState =
  "member" | "invitation" | "request" | "available" | "unavailable";
export type MembershipDecision = "accepted" | "rejected";
export type MembershipStatus = "pending" | MembershipDecision;
export type RequestBox = "received" | "sent";

export interface MembershipRequest {
  id: number;
  teamId: number;
  teamName: string;
  memberName: string | null;
  kind: "request" | "invitation";
  status: MembershipStatus;
}

export function getMembershipState(
  teamId: number,
  token: string,
  signal: AbortSignal,
) {
  return apiGet<{ data: { state: MembershipState } }>(
    `/api/teams/${teamId}/membership`,
    { token, signal },
  );
}

export function requestTeamMembership(teamId: number, token: string) {
  return apiPost(`/api/teams/${teamId}/join-requests`, {}, token);
}

export function inviteTeamMember(teamId: number, email: string, token: string) {
  return apiPost(`/api/teams/${teamId}/invitations`, { email }, token);
}

export function listTeamRequests(
  box: RequestBox,
  page: number,
  token: string,
  signal: AbortSignal,
  requestId?: string,
) {
  const query = new URLSearchParams({ box, page: String(page) });
  if (requestId) query.set("requestId", requestId);
  return apiGet<PaginatedResponse<MembershipRequest>>(
    `/api/teams/membership-requests?${query}`,
    { token, signal },
  );
}

export function decideTeamRequest(
  request: MembershipRequest,
  status: MembershipDecision,
  token: string,
) {
  return apiPatch<
    { data: { status: MembershipStatus } },
    { status: MembershipDecision }
  >(
    `/api/teams/${request.teamId}/membership-requests/${request.id}`,
    { status },
    token,
  );
}

export function listMyTeams(page: number, token: string, signal: AbortSignal) {
  return apiGet<PaginatedResponse<Team>>(`/api/teams/mine?page=${page}`, {
    token,
    signal,
  });
}
