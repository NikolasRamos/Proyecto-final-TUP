import { Request, Response } from "express";
import User from "../models/user.js";

// --- OBTENER TODOS ---
export const getAllUsers = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Obtener paginacion (ej: /user?page=1&limit=10)
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: users } = await User.findAndCountAll({
            attributes: { exclude: ['password'] },
            limit: limit,
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            totalUsers: count,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            data: users
        });

    }   catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido"; 

            return res.status(500).json ({
                success: false,
                message: "Error al obtener los usuarios",
                error: errorMessage
            });
    }
};

// --- OBTENER POR ID ---
export const getUserById = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el usuario del middleware
        const user = res.locals.user;

        return res.status(200).json({
            success: true,
            data: user
        })   

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";

        return res.status(500).json({
            success: false,
            message: "Error al obtener el usuario",
            error: errorMessage
        });
    }
};

// --- ACTUALIZAR USUARIO ---
export const updateUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el usuario del middleware
        const user = res.locals.user;

        const { nombre, email, idRol } = req.body;

        await user.update({
            nombre: nombre ?? user.nombre,
            email: email ?? user.email,
            idRol: idRol ?? user.idRol
        });

        const userResponse = user.toJSON();
        delete userResponse.password;

        return res.status(200).json({
            success: true,
            message: "Usuario actualizado con exito",
            data: userResponse
        });
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al actualizar el usuario",
            error: errorMessage
        });
    }
};

// --- ELIMINAR USUARIO --- 
export const deleteUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el usuario del middleware
        const user = res.locals.user;

        await user.destroy();

        return res.status(200).json({
            success: true,
            message: "Usuario eliminado con exito"
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al eliminar el usuario",
            error: errorMessage
        });
    }
};