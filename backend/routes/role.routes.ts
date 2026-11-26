import { Router } from "express";
import { requireAdministrator, requireSession } from "../middlewares/auth.middleware.js";
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from "../controllers/role.controller.js";
import { protectSystemRole, roleExists } from "../middlewares/roleExists.middleware.js";

const router = Router();

router.get("/", getAllRoles);
router.get("/:id", roleExists, getRoleById);
router.use(requireSession, requireAdministrator);
router.post("/", createRole);
router.put("/:id", roleExists, protectSystemRole, updateRole);
router.delete("/:id", roleExists, protectSystemRole, deleteRole);

export default router;
