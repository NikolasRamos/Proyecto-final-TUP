import { Router } from "express";

import {
  createRegistrationHandler,
  listRegistrationsHandler,
  withdrawRegistrationHandler,
} from "../controllers/registrations.controller.js";
import { downloadTournamentReportHandler } from "../controllers/tournament-reports.controller.js";
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
tournamentsRouter.get("/:id/report", downloadTournamentReportHandler);
tournamentsRouter.get("/:id", getTournamentByIdHandler);
tournamentsRouter.post("/", createTournamentHandler);
tournamentsRouter.put("/:id", updateTournamentHandler);
tournamentsRouter.patch("/:id/status", updateTournamentStatusHandler);
tournamentsRouter.delete("/:id", deleteTournamentHandler);
tournamentsRouter.post(
  "/:tournamentId/registrations",
  createRegistrationHandler,
);
tournamentsRouter.delete(
  "/:tournamentId/registrations/:teamId",
  withdrawRegistrationHandler,
);
tournamentsRouter.get("/:tournamentId/registrations", listRegistrationsHandler);

export default tournamentsRouter;
