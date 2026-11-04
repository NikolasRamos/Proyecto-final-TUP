import { Request, Response } from "express";
import Role from "../models/role.js";

// --- OBTENER TODOS ---
export const getAllRoles = async (req: Request, res: Response): Promise<Response> => {
    try {
        const roles = await Role.findAll({
            order: [['createdAt', 'DESC']]
        });

        return res.status(200).json({
            success: true,
            data: roles
        });

    }   catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error desconocido"; 

            return res.status(500).json ({
                success: false,
                message: "Error al obtener los roles",
                error: errorMessage
            });
    }
};

// --- OBTENER POR ID ---
export const getRoleById = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el rol del middleware
        const rol = res.locals.rol;

        return res.status(200).json({
            success: true,
            data: rol
        })   

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";

        return res.status(500).json({
            success: false,
            message: "Error al obtener el rol",
            error: errorMessage
        });
    }
};

// --- CREAR ROL ---
export const createRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { nombre } = req.body;

        const existingRole = await Role.findOne({where: { nombre }});
        if (existingRole) {
            return res.status(400).json({
                success: false,
                message: "Ya existe un rol con ese nombre."
            })
        }

        const newRole = await Role.create({nombre,});

        return res.status(201).json({
            success: true,
            message: "Rol registrado con exito",
            data: newRole
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al crear el rol",
            error: errorMessage
        });
    }
};

// --- ACTUALIZAR ROL ---
export const updateRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el rol del middleware
        const rol = res.locals.rol;

        const { nombre } = req.body;

        await rol.update({
            nombre: nombre ?? rol.nombre
        });

        return res.status(200).json({
            success: true,
            message: "Rol actualizado con exito",
            data: rol
        });
        
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al actualizar el rol",
            error: errorMessage
        });
    }
};

// --- ELIMINAR ROL --- 
export const deleteRole = async (req: Request, res: Response): Promise<Response> => {
    try {
        // Recupero el rol del middleware
        const rol = res.locals.rol;

        await rol.destroy();

        return res.status(200).json({
            success: true,
            message: "Rol eliminado con exito"
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        return res.status(500).json({
            success: false,
            message: "Error al eliminar el rol",
            error: errorMessage
        });
    }
};

