import { Router } from "express";
import { assignUserRole } from "../controllers/user-role.controller.js";
import { requireAdministrator, requireSession } from "../middlewares/auth.middleware.js";
import { validateUserExists } from "../middlewares/userExists.middleware.js";
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = Router();

router.use(requireSession, requireAdministrator);
router.get("/", getAllUsers);
router.get("/:id", validateUserExists, getUserById);
router.patch("/:id/role", assignUserRole);
router.put("/:id", validateUserExists, updateUser);
router.delete("/:id", validateUserExists, deleteUser);

export default router;
