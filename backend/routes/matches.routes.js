import express from "express";
import matchesController from "../controllers/matches.controller.js";

const router = express.Router();

// Rutas para manejar partidos y posiciones del torneo
router.post("/tournaments/:tournamentId/generate", matchesController.generate);
router.get(
  "/tournaments/:tournamentId/matches",
  matchesController.getByTournament,
);
router.post("/matches/:id/result", matchesController.setResult);
router.get(
  "/tournaments/:tournamentId/standings",
  matchesController.getStandings,
);

export default router;
