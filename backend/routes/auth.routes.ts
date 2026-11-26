import { Router } from "express";
import {
  getCurrentSession,
  login,
  register,
} from "../controllers/auth.controller.js";
import { requireSession } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireSession, getCurrentSession);

export default router;
