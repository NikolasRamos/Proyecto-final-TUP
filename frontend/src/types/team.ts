import type { EntityId } from "./id";

export interface Team {
  id: EntityId;
  name: string;
  description: string | null;
  captainId: EntityId;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamInput {
  name: string;
  description?: string | null;
  captainId: EntityId;
}

export type UpdateTeamInput = Omit<CreateTeamInput, "captainId">;

export interface TeamResponse {
  message: string;
  data: Team;
}
