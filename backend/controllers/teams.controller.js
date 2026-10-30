import {
  addTeamMemberSchema,
  createTeamSchema,
  listTeamsQuerySchema,
  teamIdSchema,
  teamMemberUserIdSchema,
  updateTeamSchema,
} from "../schemas/team.schema.js";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
} from "../services/teams.service.js";

export async function listTeamsHandler(request, response) {
  const validation = listTeamsQuerySchema.safeParse(request.query);

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
    const { count, rows } = await listTeams(validation.data);

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
      message: "No se pudieron obtener los equipos",
    });
  }
}

export async function getTeamByIdHandler(request, response) {
  const validation = teamIdSchema.safeParse(request.params.id);

  if (!validation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  try {
    const team = await getTeamById(validation.data);

    if (!team) {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    return response.status(200).json({
      data: team,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo obtener el equipo",
    });
  }
}

export async function createTeamHandler(request, response) {
  const validation = createTeamSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      message: "Los datos del equipo no son validos",
      errors: validation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const team = await createTeam(validation.data);

    return response.status(201).json({
      message: "Equipo creado correctamente",
      data: team,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo crear el equipo",
    });
  }
}

export async function updateTeamHandler(request, response) {
  const idValidation = teamIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  const dataValidation = updateTeamSchema.safeParse(request.body);

  if (!dataValidation.success) {
    return response.status(400).json({
      message: "Los datos del equipo no son validos",
      errors: dataValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const team = await updateTeam(idValidation.data, dataValidation.data);

    if (!team) {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    return response.status(200).json({
      message: "Equipo actualizado correctamente",
      data: team,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo actualizar el equipo",
    });
  }
}

export async function deleteTeamHandler(request, response) {
  const validation = teamIdSchema.safeParse(request.params.id);

  if (!validation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  try {
    const result = await deleteTeam(validation.data);

    if (result.outcome === "team_not_found") {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    if (result.outcome === "has_registrations") {
      return response.status(409).json({
        message: "No se puede eliminar un equipo con inscripciones registradas",
      });
    }

    return response.status(200).json({
      message: "Equipo eliminado correctamente",
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo eliminar el equipo",
    });
  }
}

export async function addTeamMemberHandler(request, response) {
  const teamIdValidation = teamIdSchema.safeParse(request.params.teamId);

  if (!teamIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  const dataValidation = addTeamMemberSchema.safeParse(request.body);

  if (!dataValidation.success) {
    return response.status(400).json({
      message: "Los datos del integrante no son validos",
      errors: dataValidation.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
  }

  try {
    const result = await addTeamMember(
      teamIdValidation.data,
      dataValidation.data.userId,
    );

    if (result.outcome === "team_not_found") {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    if (result.outcome === "already_member") {
      return response.status(409).json({
        message: "El usuario ya pertenece al equipo",
      });
    }

    return response.status(201).json({
      message: "Integrante agregado correctamente",
      data: result.membership,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo agregar el integrante",
    });
  }
}

export async function listTeamMembersHandler(request, response) {
  const validation = teamIdSchema.safeParse(request.params.teamId);

  if (!validation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  try {
    const result = await listTeamMembers(validation.data);

    if (result.outcome === "team_not_found") {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    return response.status(200).json({
      data: result.members,
    });
  } catch {
    return response.status(500).json({
      message: "No se pudieron obtener los integrantes del equipo",
    });
  }
}

export async function removeTeamMemberHandler(request, response) {
  const teamIdValidation = teamIdSchema.safeParse(request.params.teamId);

  if (!teamIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del equipo no es valido",
    });
  }

  const userIdValidation = teamMemberUserIdSchema.safeParse(
    request.params.userId,
  );

  if (!userIdValidation.success) {
    return response.status(400).json({
      message: "El identificador del integrante no es valido",
    });
  }

  try {
    const result = await removeTeamMember(
      teamIdValidation.data,
      userIdValidation.data,
    );

    if (result.outcome === "team_not_found") {
      return response.status(404).json({
        message: "Equipo no encontrado",
      });
    }

    if (result.outcome === "captain_cannot_be_removed") {
      return response.status(409).json({
        message: "El capitan no puede ser eliminado del equipo",
      });
    }

    if (result.outcome === "member_not_found") {
      return response.status(404).json({
        message: "El usuario no pertenece al equipo",
      });
    }

    return response.status(200).json({
      message: "Integrante eliminado correctamente",
    });
  } catch {
    return response.status(500).json({
      message: "No se pudo eliminar el integrante",
    });
  }
}
