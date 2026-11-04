import { Request, Response } from "express";
import User from "../models/user.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// --- REGISTRO ---
export const register = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { nombre, email, password, idRol } = req.body;

        if (!nombre || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Los campos (nombre, email, password) son obligatorios"
            });
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "El correo electronico ya se encuentra registrado."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            nombre,
            email,
            password: hashedPassword,
            idRol: idRol || 3
        });

        const userResponse = {
            idUsuario: newUser.idUsuario,
            nombre: newUser.nombre,
            email: newUser.email,
            idRol: newUser.idRol,
            createdAt: newUser.createdAt,
            updatedAt: newUser.updatedAt
        };

        return res.status(201).json({
            success: true,
            message: "Usuario registrado con exito",
            data: userResponse
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al registrar el usuario",
            error: errorMessage
        });
    }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email } });

        if (!user || !(await user.validPassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Credenciales invalidas (correo o contraseña incorrectos)"
            });
        }

        // Genero el Token JWT
        const secret = process.env.JWT_SECRET || "reemplazar_con_secreto_aleatorio";
        const token = jwt.sign(
            { idUsuario: user.idUsuario, idRol: user.idRol },
            secret,
            { expiresIn: "8h" }
        );

        return res.status(200).json({
            success: true,
            message: "Inicio de sesion exitoso",
            token,
            data: {
                idUsuario: user.idUsuario,
                nombre: user.nombre,
                email: user.email,
                idRol: user.idRol
            }
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error en el inicio de sesion",
            error: errorMessage
        });
    }
};