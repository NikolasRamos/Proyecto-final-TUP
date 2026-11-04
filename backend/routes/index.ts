import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";
import roleRoutes from "./role.routes.js";

const router = Router();

router.use("/api/users", userRoutes);
router.use("/api/auth", authRoutes);
router.use("/api/roles", roleRoutes);

export default router;