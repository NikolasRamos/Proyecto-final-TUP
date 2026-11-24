import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import Role from "../models/role.js";
import User from "../models/user.js";

function unauthorized(response: Response): Response {
  return response.status(401).json({
    success: false,
    message: "Se necesita una sesión válida",
  });
}

export async function requireSession(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<Response | void> {
  const authorization = request.get("Authorization");
  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return unauthorized(response);

  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) {
    return response.status(500).json({
      success: false,
      message: "La autenticación no está disponible",
    });
  }

  let userId: number;
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (
      typeof payload === "string" ||
      typeof payload.idUsuario !== "number" ||
      !Number.isInteger(payload.idUsuario) ||
      payload.idUsuario < 1 ||
      payload.idUsuario > 2_147_483_647 ||
      typeof payload.exp !== "number"
    ) {
      return unauthorized(response);
    }
    userId = payload.idUsuario;
  } catch {
    return unauthorized(response);
  }

  try {
    const user = await User.findByPk(userId, {
      attributes: ["idUsuario", "idRol"],
    });
    if (!user) return unauthorized(response);
    response.locals.authUser = user;
  } catch {
    return response.status(500).json({
      success: false,
      message: "No se pudo comprobar la sesión",
    });
  }

  next();
}

export async function requireAdministrator(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<Response | void> {
  const user: User | undefined = response.locals.authUser;
  if (!user) return unauthorized(response);

  try {
    const role = await Role.findByPk(user.idRol);
    if (role?.nombre !== "administrador") {
      return response.status(403).json({
        success: false,
        message: "Se necesitan permisos de administrador",
      });
    }
  } catch {
    return response.status(500).json({
      success: false,
      message: "No se pudieron comprobar los permisos",
    });
  }

  next();
}
