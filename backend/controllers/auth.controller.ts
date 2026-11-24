import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { col, fn, UniqueConstraintError, where } from "sequelize";

import Role from "../models/role.js";
import User from "../models/user.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

function emailMatches(email: string) {
  return where(fn("lower", col("email")), email);
}

function duplicateEmail(response: Response): Response {
  return response.status(409).json({
    success: false,
    message: "El correo electrónico ya se encuentra registrado",
  });
}

export async function register(
  request: Request,
  response: Response,
): Promise<Response> {
  const validation = registerSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      success: false,
      message: validation.error.issues[0].message,
    });
  }

  const { nombre, email, password } = validation.data;

  try {
    const existingUser = await User.findOne({
      attributes: ["idUsuario"],
      where: emailMatches(email),
      paranoid: false,
    });

    if (existingUser) return duplicateEmail(response);

    const role = await Role.findOne({ where: { nombre: "participante" } });

    if (!role) {
      return response.status(500).json({
        success: false,
        message: "El registro de usuarios no está disponible",
      });
    }

    const user = await User.create({
      nombre,
      email,
      password,
      idRol: role.idRol,
    });
    const { idUsuario, idRol, createdAt, updatedAt } = user;

    return response.status(201).json({
      success: true,
      message: "Usuario registrado con éxito",
      data: { idUsuario, nombre, email, idRol, createdAt, updatedAt },
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) return duplicateEmail(response);

    return response.status(500).json({
      success: false,
      message: "Error al registrar el usuario",
    });
  }
}

export async function login(
  request: Request,
  response: Response,
): Promise<Response> {
  const validation = loginSchema.safeParse(request.body);

  if (!validation.success) {
    return response.status(400).json({
      success: false,
      message: validation.error.issues[0].message,
    });
  }

  const { email, password } = validation.data;
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    return response.status(500).json({
      success: false,
      message: "El inicio de sesión no está disponible",
    });
  }

  try {
    const users = await User.findAll({ where: emailMatches(email), limit: 2 });
    const [user] = users;

    if (users.length !== 1 || !(await user.validPassword(password))) {
      return response.status(401).json({
        success: false,
        message: "Correo o contraseña incorrectos",
      });
    }

    const { idUsuario, idRol, nombre, email: userEmail } = user;
    const token = jwt.sign({ idUsuario, idRol }, secret, { expiresIn: "8h" });

    return response.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      data: { idUsuario, nombre, email: userEmail, idRol },
    });
  } catch {
    return response.status(500).json({
      success: false,
      message: "Error en el inicio de sesión",
    });
  }
}
