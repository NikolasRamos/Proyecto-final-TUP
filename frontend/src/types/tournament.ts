import type { EntityId } from "./id";

export const TOURNAMENT_MODALITIES = [
  "league",
  "single_elimination",
  "groups_playoff",
  "swiss",
  "free_for_all",
  "gauntlet",
] as const;

export type TournamentModality = (typeof TOURNAMENT_MODALITIES)[number];

export const TOURNAMENT_MODALITY_LABELS: Record<TournamentModality, string> = {
  league: "Liga",
  single_elimination: "Eliminación simple",
  groups_playoff: "Grupos + Playoff",
  swiss: "Suizo",
  free_for_all: "Free-for-all",
  gauntlet: "Gauntlet",
};

export type TournamentStatus =
  "draft" | "open" | "in_progress" | "finished" | "cancelled";

export interface Tournament {
  id: EntityId;
  name: string;
  description: string | null;
  modality: TournamentModality;
  maxParticipants: number;
  playoffSpots?: number | null;
  groupCount?: number | null;
  maxParticipantsPerGroup?: number | null;
  swissRounds?: number | null;
  isTeamTournament: boolean;
  minTeamMembers: number | null;
  maxTeamMembers: number | null;
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
  playoffSpots?: number | null;
  groupCount?: number | null;
  maxParticipantsPerGroup?: number | null;
  swissRounds?: number | null;
  isTeamTournament: boolean;
  minTeamMembers: number | null;
  maxTeamMembers: number | null;
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
