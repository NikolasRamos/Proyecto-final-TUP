import { Request, Response, NextFunction } from "express";
import User from "../models/user.js";

export const validateUserExists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const userId = Number(id);

        const user = await User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "El usuario especificado no existe."
            });
        }

        // Guardo el usuario para que el controlador lo use
        res.locals.user = user;

        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
          
        return res.status(500).json({
            success: false,
            message: "Error al validar la existencia del usuario",
            error: errorMessage
        });
    }
}
