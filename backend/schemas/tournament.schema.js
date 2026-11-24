import { z } from "zod";

import {
  TOURNAMENT_MODALITIES,
  TOURNAMENT_STATUSES,
} from "../models/Tournament.js";
import { getTournamentFormatStrategy } from "../strategies/tournament-formats/tournament-format-strategy.registry.js";
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
  playoffSpots: z
    .number({ error: "Los lugares del playoff deben ser un numero" })
    .int("Los lugares del playoff deben ser un numero entero")
    .min(2, "El playoff debe admitir al menos 2 participantes")
    .nullable()
    .optional(),
  groupCount: z
    .number({ error: "La cantidad de grupos debe ser un numero" })
    .int("La cantidad de grupos debe ser un numero entero")
    .min(2, "El torneo debe tener al menos 2 grupos")
    .nullable()
    .optional(),
  maxParticipantsPerGroup: z
    .number({ error: "El maximo por grupo debe ser un numero" })
    .int("El maximo por grupo debe ser un numero entero")
    .min(2, "Cada grupo debe admitir al menos 2 participantes")
    .nullable()
    .optional(),
  swissRounds: z
    .number({ error: "La cantidad de rondas debe ser un numero" })
    .int("La cantidad de rondas debe ser un numero entero")
    .min(1, "El torneo Suizo debe tener al menos una ronda")
    .nullable()
    .optional(),
  isTeamTournament: z.boolean({
    error: "Debe indicar si el torneo es individual o por equipos",
  }),
  minTeamMembers: z
    .number({
      error: "El minimo de integrantes debe ser un numero",
    })
    .int("El minimo de integrantes debe ser un numero entero")
    .min(2, "Un equipo debe admitir al menos 2 integrantes")
    .nullable(),
  maxTeamMembers: z
    .number({
      error: "El maximo de integrantes debe ser un numero",
    })
    .int("El maximo de integrantes debe ser un numero entero")
    .min(2, "Un equipo debe admitir al menos 2 integrantes")
    .nullable(),
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

function validateTournamentParticipation(
  tournament,
  context,
  { allowUnsetTeamLimits = false } = {},
) {
  if (!tournament.isTeamTournament) {
    if (tournament.minTeamMembers !== null) {
      context.addIssue({
        code: "custom",
        path: ["minTeamMembers"],
        message: "Un torneo individual no puede definir limites de equipo",
      });
    }

    if (tournament.maxTeamMembers !== null) {
      context.addIssue({
        code: "custom",
        path: ["maxTeamMembers"],
        message: "Un torneo individual no puede definir limites de equipo",
      });
    }

    return;
  }

  if (
    allowUnsetTeamLimits &&
    tournament.minTeamMembers === null &&
    tournament.maxTeamMembers === null
  ) {
    return;
  }

  if (tournament.minTeamMembers === null) {
    context.addIssue({
      code: "custom",
      path: ["minTeamMembers"],
      message: "Debe indicar el minimo de integrantes por equipo",
    });
  }

  if (tournament.maxTeamMembers === null) {
    context.addIssue({
      code: "custom",
      path: ["maxTeamMembers"],
      message: "Debe indicar el maximo de integrantes por equipo",
    });
  }

  if (
    tournament.minTeamMembers !== null &&
    tournament.maxTeamMembers !== null &&
    tournament.maxTeamMembers < tournament.minTeamMembers
  ) {
    context.addIssue({
      code: "custom",
      path: ["maxTeamMembers"],
      message: "El maximo de integrantes no puede ser menor que el minimo",
    });
  }
}

function validateTournamentFormat(
  tournament,
  context,
  {
    allowUnsetGroupConfiguration = false,
    allowUnsetSwissConfiguration = false,
  } = {},
) {
  const groupConfigurationFields = [
    "playoffSpots",
    "groupCount",
    "maxParticipantsPerGroup",
  ];
  const groupConfigurationIsUnset = groupConfigurationFields.every(
    (field) => tournament[field] === null || tournament[field] === undefined,
  );

  if (tournament.modality !== "groups_playoff") {
    for (const field of groupConfigurationFields) {
      if (tournament[field] !== null && tournament[field] !== undefined) {
        context.addIssue({
          code: "custom",
          path: [field],
          message: "Esta configuracion solo corresponde a Grupos + Playoff",
        });
      }
    }
  }

  if (
    tournament.modality !== "swiss" &&
    tournament.swissRounds !== null &&
    tournament.swissRounds !== undefined
  ) {
    context.addIssue({
      code: "custom",
      path: ["swissRounds"],
      message: "Esta configuracion solo corresponde al formato Suizo",
    });
  }

  if (
    allowUnsetGroupConfiguration &&
    tournament.modality === "groups_playoff" &&
    groupConfigurationIsUnset
  ) {
    return;
  }

  if (
    allowUnsetSwissConfiguration &&
    tournament.modality === "swiss" &&
    (tournament.swissRounds === null || tournament.swissRounds === undefined)
  ) {
    return;
  }

  const strategy = getTournamentFormatStrategy(tournament.modality);

  if (!strategy) {
    return;
  }

  for (const issue of strategy.validate(tournament)) {
    context.addIssue({
      code: "custom",
      path: issue.path,
      message: issue.message,
    });
  }
}

function validateTournament(tournament, context) {
  validateTournamentDates(tournament, context);
  validateTournamentParticipation(tournament, context);
  validateTournamentFormat(tournament, context);
}

function validateTournamentUpdate(tournament, context) {
  validateTournamentDates(tournament, context);
  validateTournamentParticipation(tournament, context, {
    allowUnsetTeamLimits: true,
  });
  validateTournamentFormat(tournament, context, {
    allowUnsetGroupConfiguration: true,
    allowUnsetSwissConfiguration: true,
  });
}

export const createTournamentSchema = z
  .object({
    ...tournamentFields,
    organizerId: entityIdSchema,
  })
  .superRefine(validateTournament);

export const updateTournamentSchema = z
  .object(tournamentFields)
  .superRefine(validateTournamentUpdate);

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
