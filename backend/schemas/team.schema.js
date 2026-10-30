import { z } from "zod";

import { entityIdSchema } from "./id.schema.js";

export const teamIdSchema = entityIdSchema;

export const teamMemberUserIdSchema = entityIdSchema;

const teamFields = {
  name: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120, "El nombre no puede superar los 120 caracteres"),
  description: z
    .string()
    .trim()
    .max(2000, "La descripcion no puede superar los 2000 caracteres")
    .nullable()
    .optional(),
};

export const createTeamSchema = z.object({
  ...teamFields,
  captainId: entityIdSchema,
});

export const updateTeamSchema = z.object(teamFields);

export const addTeamMemberSchema = z.object({
  userId: teamMemberUserIdSchema,
});

export const listTeamsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, "La busqueda no puede estar vacia")
    .max(120, "La busqueda no puede superar los 120 caracteres")
    .optional(),
  page: z.coerce
    .number({ error: "La pagina debe ser un numero" })
    .int("La pagina debe ser un numero entero")
    .min(1, "La pagina debe ser mayor o igual a 1")
    .default(1),
  limit: z.coerce
    .number({ error: "El limite debe ser un numero" })
    .int("El limite debe ser un numero entero")
    .min(1, "El limite debe ser mayor o igual a 1")
    .max(100, "El limite no puede superar los 100 equipos")
    .default(10),
});
