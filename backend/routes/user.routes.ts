import { Router } from "express";
import { validateUserExists } from "../middlewares/userExists.middleware.js";
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = Router();

router.get("/", getAllUsers);
router.get("/:id", validateUserExists, getUserById);
router.put("/:id", validateUserExists, updateUser);
router.delete("/:id", validateUserExists, deleteUser);

export default router;