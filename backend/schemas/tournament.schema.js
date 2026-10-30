import { z } from "zod";

import {
  TOURNAMENT_MODALITIES,
  TOURNAMENT_STATUSES,
} from "../models/Tournament.js";
import { entityIdSchema } from "./id.schema.js";

const tournamentSortFields = ["createdAt", "name", "startDate"];

export const tournamentIdSchema = entityIdSchema;

const dateSchema = z.iso.date({
  error: "Debe utilizar el formato de fecha AAAA-MM-DD",
});

const tournamentFields = {
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
  modality: z.enum(TOURNAMENT_MODALITIES, {
    error: "La modalidad no es valida",
  }),
  maxParticipants: z
    .number()
    .int("La cantidad maxima de participantes debe ser un numero entero")
    .min(2, "El torneo debe admitir al menos 2 participantes"),
  registrationDeadline: dateSchema,
  startDate: dateSchema,
  endDate: dateSchema,
};

function validateTournamentDates(tournament, context) {
  if (tournament.registrationDeadline > tournament.startDate) {
    context.addIssue({
      code: "custom",
      path: ["registrationDeadline"],
      message:
        "La fecha limite de inscripcion no puede ser posterior al inicio",
    });
  }

  if (tournament.startDate > tournament.endDate) {
    context.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "La fecha de finalizacion no puede ser anterior al inicio",
    });
  }
}

export const createTournamentSchema = z
  .object({
    ...tournamentFields,
    organizerId: entityIdSchema,
  })
  .superRefine(validateTournamentDates);

export const updateTournamentSchema = z
  .object(tournamentFields)
  .superRefine(validateTournamentDates);

export const updateTournamentStatusSchema = z.object({
  status: z.enum(TOURNAMENT_STATUSES, {
    error: "El estado del torneo no es valido",
  }),
});

export const listTournamentsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .min(1, "La busqueda no puede estar vacia")
    .max(120, "La busqueda no puede superar los 120 caracteres")
    .optional(),
  status: z
    .enum(TOURNAMENT_STATUSES, {
      error: "El estado del torneo no es valido",
    })
    .optional(),
  modality: z
    .enum(TOURNAMENT_MODALITIES, {
      error: "La modalidad no es valida",
    })
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
    .max(100, "El limite no puede superar los 100 torneos")
    .default(10),
  sortBy: z
    .enum(tournamentSortFields, {
      error: "El campo de ordenamiento no es valido",
    })
    .default("createdAt"),
  order: z
    .enum(["asc", "desc"], {
      error: "La direccion de ordenamiento no es valida",
    })
    .default("desc"),
});
