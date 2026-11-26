import { Op } from "sequelize";

import User from "../models/user.js";

/**
 * Resuelve los nombres de usuario para una lista de ids de cuenta.
 * Devuelve un Map<idUsuario, nombre> para enriquecer respuestas
 * sin exponer el resto de los datos del usuario.
 */
export async function getUserNamesByIds(ids) {
  const uniqueIds = [
    ...new Set((ids ?? []).filter((id) => id !== null && id !== undefined)),
  ];

  if (uniqueIds.length === 0) {
    return new Map();
  }

  const users = await User.findAll({
    attributes: ["idUsuario", "nombre"],
    where: { idUsuario: { [Op.in]: uniqueIds } },
    raw: true,
  });

  return new Map(users.map((user) => [user.idUsuario, user.nombre]));
}
