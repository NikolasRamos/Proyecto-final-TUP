import { z } from "zod";

import { REGISTRATION_STATUSES } from "../models/TournamentRegistration.js";
import { entityIdSchema } from "./id.schema.js";

export const createRegistrationSchema = z.object({
  teamId: entityIdSchema,
});

export const listRegistrationsQuerySchema = z.object({
  status: z
    .enum(REGISTRATION_STATUSES, {
      error: "El estado de la inscripcion no es valido",
    })
    .default("registered"),
  page: z.coerce
    .number({ error: "La pagina debe ser un numero" })
    .int("La pagina debe ser un numero entero")
    .min(1, "La pagina debe ser mayor o igual a 1")
    .default(1),
  limit: z.coerce
    .number({ error: "El limite debe ser un numero" })
    .int("El limite debe ser un numero entero")
    .min(1, "El limite debe ser mayor o igual a 1")
    .max(100, "El limite no puede superar las 100 inscripciones")
    .default(10),
});
