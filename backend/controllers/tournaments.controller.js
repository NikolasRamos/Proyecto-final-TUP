import {
  createTournamentSchema,
  listTournamentsQuerySchema,
  tournamentIdSchema,
  updateTournamentSchema,
  updateTournamentStatusSchema,
} from "../schemas/tournament.schema.js";
import {
  createTournament,
  deleteTournament,
  getTournamentById,
  listTournaments,
  updateTournament,
  updateTournamentStatus,
} from "../services/tournaments.service.js";

export async function listTournamentsHandler(request, response) {
  const validation = listTournamentsQuerySchema.safeParse(request.query);

  if (!validation.success) {
    return response.status(400).json({
      message: "Los filtros del listado no son validos",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const { page, limit } = validation.data;
    const { count, rows } = await listTournaments(validation.data);

    return response.status(200).json({
      data: rows,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch {
    return response.status(500).json({
      message: "No se pudieron obtener los torneos",
    });
  }
}

export async function getTournamentByIdHandler(request, response) {
  const validation = tournamentIdSchema.safeParse(request.params.id);

  if (!validation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  try {
    const tournament = await getTournamentById(validation.data);

    if (!tournament) {
      return response.status(404).json({
        message: "Torneo no encontrado",
      });
    }

    return response.status(200).json({
      data: tournament,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo obtener el torneo",
    });
  }
}

export async function createTournamentHandler(request, response) {
  const validation = createTournamentSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      message: "Los datos del torneo no son validos",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const tournament = await createTournament(validation.data);

    return response.status(201).json({
      message: "Torneo creado correctamente",
      data: tournament,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo crear el torneo",
    });
  }
}

export async function updateTournamentHandler(request, response) {
  const idValidation = tournamentIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  const dataValidation = updateTournamentSchema.safeParse(request.body);

  if (!dataValidation.success) {
    return response.status(400).json({
      message: "Los datos del torneo no son validos",
      errors: dataValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const tournament = await updateTournament(
      idValidation.data,
      dataValidation.data,
    );

    if (!tournament) {
      return response.status(404).json({
        message: "Torneo no encontrado",
      });
    }

    return response.status(200).json({
      message: "Torneo actualizado correctamente",
      data: tournament,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo actualizar el torneo",
    });
  }
}

export async function updateTournamentStatusHandler(request, response) {
  const idValidation = tournamentIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  const dataValidation = updateTournamentStatusSchema.safeParse(request.body);

  if (!dataValidation.success) {
    return response.status(400).json({
      message: "El estado del torneo no es valido",
      errors: dataValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await updateTournamentStatus(
      idValidation.data,
      dataValidation.data.status,
    );

    if (result.outcome === "not_found") {
      return response.status(404).json({
        message: "Torneo no encontrado",
      });
    }

    if (result.outcome === "invalid_transition") {
      return response.status(409).json({
        message: "El cambio de estado del torneo no esta permitido",
      });
    }

    return response.status(200).json({
      message: "Estado del torneo actualizado correctamente",
      data: result.tournament,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo actualizar el estado del torneo",
    });
  }
}

export async function deleteTournamentHandler(request, response) {
  const validation = tournamentIdSchema.safeParse(request.params.id);

  if (!validation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  try {
    const result = await deleteTournament(validation.data);

    if (result.outcome === "not_found") {
      return response.status(404).json({
        message: "Torneo no encontrado",
      });
    }

    if (result.outcome === "not_deletable") {
      return response.status(409).json({
        message: "Solo se pueden eliminar torneos en estado draft",
      });
    }

    return response.status(200).json({
      message: "Torneo eliminado correctamente",
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo eliminar el torneo",
    });
  }
}
