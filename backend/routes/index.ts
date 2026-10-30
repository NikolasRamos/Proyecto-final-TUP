import { Router } from "express";
import userRoutes from "./user.routes.js";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/api", userRoutes);
router.use("/api", authRoutes);

export default router;