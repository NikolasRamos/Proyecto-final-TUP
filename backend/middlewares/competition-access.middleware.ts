import type { NextFunction, Request, Response } from "express";

import Role from "../models/role.js";
import type User from "../models/user.js";
import { requireSession } from "./auth.middleware.js";

export function canManageCompetition(role: string | undefined) {
  return role === "administrador" || role === "organizador";
}

export async function loadCompetitionRole(
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  const user: User | undefined = response.locals.authUser;
  if (user) {
    try {
      const role = await Role.findByPk(user.idRol);
      response.locals.authRole = role?.nombre;
    } catch {
      return response.status(500).json({
        success: false,
        message: "No se pudieron comprobar los permisos",
      });
    }
  }

  next();
}

function authorizeRole(hasPermission: (role: string | undefined) => boolean) {
  return (_request: Request, response: Response, next: NextFunction) => {
    if (!hasPermission(response.locals.authRole)) {
      return response.status(403).json({
        success: false,
        message: "Tu rol no tiene permiso para esta operación",
      });
    }

    next();
  };
}

export const requireCompetitionManager = [
  requireSession,
  loadCompetitionRole,
  authorizeRole(canManageCompetition),
];

export const requireTeamCreator = [
  requireSession,
  loadCompetitionRole,
  authorizeRole(
    (role) => role === "participante" || canManageCompetition(role),
  ),
];
