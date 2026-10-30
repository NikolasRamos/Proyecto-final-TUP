import { Router } from "express";
import { validateUserExists } from "../middlewares/userExists.middleware.js";
import { getAllUsers, getUserById, updateUser, deleteUser } from "../controllers/user.controller.js";

const router = Router();

router.get("/users", getAllUsers);

router.get("/users/:id", validateUserExists, getUserById);
router.put("/users/:id", validateUserExists, updateUser);
router.delete("/users/:id", validateUserExists, deleteUser);

export default router;