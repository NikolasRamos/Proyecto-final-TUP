import { z } from "zod";

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const teamIdSchema = z
  .string()
  .regex(uuidV4Pattern, "El identificador del equipo debe ser un UUID v4");

export const teamMemberUserIdSchema = z
  .string()
  .regex(uuidV4Pattern, "El identificador del integrante debe ser un UUID v4");

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
  captainId: z
    .string()
    .regex(uuidV4Pattern, "El identificador del capitan debe ser un UUID v4"),
});

export const updateTeamSchema = z.object(teamFields);

export const addTeamMemberSchema = z.object({
  userId: teamMemberUserIdSchema,
});

export const listTeamsQuerySchema = z.object({
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
