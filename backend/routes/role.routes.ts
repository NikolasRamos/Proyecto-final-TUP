import { Router } from "express";
import { getAllRoles, getRoleById, createRole, updateRole, deleteRole } from "../controllers/role.controller.js";
import { roleExists } from "../middlewares/roleExists.middleware.js";

const router = Router();

router.get("/", getAllRoles);
router.get("/:id", roleExists, getRoleById);
router.post("/", createRole);
router.put("/:id", roleExists, updateRole);
router.delete("/:id", roleExists, deleteRole);

export default router;