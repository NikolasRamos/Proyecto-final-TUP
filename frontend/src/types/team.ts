import type { EntityId } from "./id";

export interface Team {
  id: EntityId;
  name: string;
  description: string | null;
  captainId: EntityId;
  createdAt: string;
  updatedAt: string;
}
