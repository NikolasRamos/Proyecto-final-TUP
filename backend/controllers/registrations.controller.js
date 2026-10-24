import {
  createRegistrationSchema,
  listRegistrationsQuerySchema,
} from "../schemas/registration.schema.js";
import { teamIdSchema } from "../schemas/team.schema.js";
import { tournamentIdSchema } from "../schemas/tournament.schema.js";
import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "../services/registrations.service.js";

export async function createRegistrationHandler(request, response) {
  const tournamentIdValidation = tournamentIdSchema.safeParse(
    request.params.tournamentId,
  );

  if (!tournamentIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  const dataValidation = createRegistrationSchema.safeParse(request.body);

  if (!dataValidation.success) {
    return response.status(400).json({
      message: "Los datos de la inscripcion no son validos",
      errors: dataValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await registerTeamInTournament(
      tournamentIdValidation.data,
      dataValidation.data.teamId,
    );

    if (result.outcome === "tournament_not_found") {
      return response.status(404).json({ message: "Torneo no encontrado" });
    }

    if (result.outcome === "team_not_found") {
      return response.status(404).json({ message: "Equipo no encontrado" });
    }

    if (result.outcome === "tournament_not_open") {
      return response.status(409).json({
        message: "El torneo no esta abierto para inscripciones",
      });
    }

    if (result.outcome === "already_registered") {
      return response.status(409).json({
        message: "El equipo ya esta inscrito en el torneo",
      });
    }

    if (result.outcome === "tournament_full") {
      return response.status(409).json({
        message: "El torneo alcanzo su cupo maximo",
      });
    }

    return response.status(201).json({
      message: "Equipo inscrito correctamente",
      data: result.registration,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo inscribir el equipo",
    });
  }
}

export async function withdrawRegistrationHandler(request, response) {
  const tournamentIdValidation = tournamentIdSchema.safeParse(
    request.params.tournamentId,
  );

  if (!tournamentIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  const teamIdValidation = teamIdSchema.safeParse(request.params.teamId);

  if (!teamIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  try {
    const result = await withdrawTeamFromTournament(
      tournamentIdValidation.data,
      teamIdValidation.data,
    );

    if (result.outcome === "tournament_not_found") {
      return response.status(404).json({ message: "Torneo no encontrado" });
    }

    if (result.outcome === "tournament_not_open") {
      return response.status(409).json({
        message: "El torneo no esta abierto para modificar inscripciones",
      });
    }

    if (result.outcome === "registration_not_found") {
      return response.status(404).json({
        message: "El equipo no esta inscrito en el torneo",
      });
    }

    if (result.outcome === "already_withdrawn") {
      return response.status(409).json({
        message: "El equipo ya fue retirado del torneo",
      });
    }

    return response.status(200).json({
      message: "Equipo retirado correctamente",
      data: result.registration,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo retirar el equipo del torneo",
    });
  }
}

export async function listRegistrationsHandler(request, response) {
  const tournamentIdValidation = tournamentIdSchema.safeParse(
    request.params.tournamentId,
  );

  if (!tournamentIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  const queryValidation = listRegistrationsQuerySchema.safeParse(request.query);

  if (!queryValidation.success) {
    return response.status(400).json({
      message: "Los filtros de inscripciones no son validos",
      errors: queryValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await listTournamentRegistrations(
      tournamentIdValidation.data,
      queryValidation.data,
    );

    if (result.outcome === "tournament_not_found") {
      return response.status(404).json({ message: "Torneo no encontrado" });
    }

    const { page, limit } = queryValidation.data;

    return response.status(200).json({
      data: result.registrations,
      pagination: {
        page,
        limit,
        total: result.count,
        totalPages: Math.ceil(result.count / limit),
      },
    });
  } catch {
    return response.status(500).json({
      message: "No se pudieron obtener las inscripciones del torneo",
    });
  }
}
