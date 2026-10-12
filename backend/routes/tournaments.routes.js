import { Router } from "express";

import {
  createTournamentHandler,
  deleteTournamentHandler,
  getTournamentByIdHandler,
  listTournamentsHandler,
  updateTournamentHandler,
  updateTournamentStatusHandler,
} from "../controllers/tournaments.controller.js";

const tournamentsRouter = Router();

tournamentsRouter.get("/", listTournamentsHandler);
tournamentsRouter.get("/:id", getTournamentByIdHandler);
tournamentsRouter.post("/", createTournamentHandler);
tournamentsRouter.put("/:id", updateTournamentHandler);
tournamentsRouter.patch("/:id/status", updateTournamentStatusHandler);
tournamentsRouter.delete("/:id", deleteTournamentHandler);

export default tournamentsRouter;
