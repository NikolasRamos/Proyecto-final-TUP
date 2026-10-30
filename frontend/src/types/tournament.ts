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

export type UpdateTournamentInput = Omit<CreateTournamentInput, "organizerId">;

export interface TournamentResponse {
  message: string;
  data: Tournament;
}

export type CreateTournamentResponse = TournamentResponse;
import type { EntityId } from "./id";
