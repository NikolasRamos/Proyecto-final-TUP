import type { Request, Response } from "express";
import { z } from "zod";

import Role from "../models/role.js";
import User from "../models/user.js";
import { entityIdSchema } from "../schemas/id.schema.js";

const assignmentSchema = z.strictObject({
  role: z.enum(["organizador", "administrador"]),
});

export async function assignUserRole(
  request: Request,
  response: Response,
): Promise<Response> {
  const target = entityIdSchema.max(2_147_483_647).safeParse(request.params.id);
  const assignment = assignmentSchema.safeParse(request.body);

  if (!target.success || !assignment.success) {
    return response.status(400).json({
      success: false,
      message: "Indicá un usuario válido y el rol organizador o administrador",
    });
  }

  const idUsuario = target.data;
  const { role } = assignment.data;

  try {
    const user = await User.findByPk(idUsuario, {
      attributes: ["idUsuario", "idRol"],
    });
    if (!user) {
      return response.status(404).json({
        success: false,
        message: "El usuario especificado no existe",
      });
    }

    const [currentRole, assignedRole] = await Promise.all([
      Role.findByPk(user.idRol),
      Role.findOne({ where: { nombre: role } }),
    ]);
    if (!currentRole || !assignedRole) {
      return response.status(500).json({
        success: false,
        message: "Los roles de la cuenta no están disponibles",
      });
    }

    if (user.idRol !== assignedRole.idRol) {
      if (currentRole.nombre !== "participante") {
        return response.status(409).json({
          success: false,
          message: "La asignación requiere una cuenta participante",
        });
      }

      const [updated] = await User.update(
        { idRol: assignedRole.idRol },
        { where: { idUsuario, idRol: currentRole.idRol } },
      );
      if (updated === 0) {
        return response.status(409).json({
          success: false,
          message:
            "La cuenta cambió durante la asignación. Volvé a consultarla",
        });
      }
    }

    return response.status(200).json({
      success: true,
      data: { idUsuario, idRol: assignedRole.idRol, role },
    });
  } catch {
    return response.status(500).json({
      success: false,
      message: "No se pudo asignar el rol",
    });
  }
}
