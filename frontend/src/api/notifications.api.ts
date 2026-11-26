import { apiGet, apiPatch } from "./client";
import type { MembershipStatus } from "./team-memberships.api";
import type { PaginatedResponse } from "../types/api";

export interface TeamNotification {
  requestId: number;
  teamId: number;
  teamName: string;
  kind: "request" | "invitation";
  status: MembershipStatus;
  event: "received" | "resolved";
  createdAt: string;
  isRead: boolean;
}

export type NotificationPage = PaginatedResponse<TeamNotification> & {
  unread: number;
};

export function listNotifications(
  page: number,
  token: string,
  signal: AbortSignal,
) {
  return apiGet<NotificationPage>(`/api/notifications?page=${page}`, {
    token,
    signal,
  });
}

export function markNotificationRead(requestId: number, token: string) {
  return apiPatch<{ data: { isRead: true } }, Record<string, never>>(
    `/api/notifications/${requestId}/read`,
    {},
    token,
  );
}
