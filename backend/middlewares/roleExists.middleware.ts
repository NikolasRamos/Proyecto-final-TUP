import { Request, Response, NextFunction } from "express";
import Role from "../models/role.js";

export const roleExists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    try {
        const { id } = req.params;
        const idRole = Number(id);

        const rol = await Role.findByPk(idRole);

        if (!rol) {
            return res.status(404).json({
                success: false,
                message: `El rol con el id ${id} no existe`
            });
        }

        res.locals.rol = rol;

        next();
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";

        return res.status(500).json({
            success: false,
            message: "Error al validar la existencia del rol",
            error: errorMessage
        });
    }
};

const systemRoles = new Set(["administrador", "organizador", "participante"]);

export function protectSystemRole(
    _request: Request,
    response: Response,
    next: NextFunction,
): Response | void {
    const role: Role = response.locals.rol;
    if (systemRoles.has(role.nombre)) {
        return response.status(409).json({
            success: false,
            message: "Los roles del sistema se conservan para autenticar y asignar permisos",
        });
    }

    next();
}
