export type TournamentModality =
  "league" | "single_elimination" | "group_stage";

export type TournamentStatus =
  "draft" | "open" | "in_progress" | "finished" | "cancelled";

export interface Tournament {
  id: EntityId;
  name: string;
  description: string | null;
  modality: TournamentModality;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  organizerId: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTournamentInput {
  name: string;
  description?: string | null;
  modality: TournamentModality;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  organizerId: EntityId;
}

export interface CreateTournamentResponse {
  message: string;
  data: Tournament;
}
import type { EntityId } from "./id";
