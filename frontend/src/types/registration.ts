import type { EntityId } from "./id";

export type RegistrationStatus = "registered" | "withdrawn";

export interface TournamentRegistration {
  id: EntityId;
  status: RegistrationStatus;
  registeredAt: string;
  updatedAt: string;
  team: {
    id: EntityId;
    name: string | null;
  };
}

export interface RegistrationRecord {
  id: EntityId;
  tournamentId: EntityId;
  teamId: EntityId;
  status: RegistrationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RegistrationResponse {
  message: string;
  data: RegistrationRecord;
}
