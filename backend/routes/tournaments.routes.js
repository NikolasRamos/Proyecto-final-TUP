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
import { allowGuest } from "../middlewares/auth.middleware.js";
import {
  loadCompetitionRole,
  requireCompetitionManager,
} from "../middlewares/competition-access.middleware.js";

const tournamentsRouter = Router();

tournamentsRouter.get(
  "/",
  allowGuest,
  loadCompetitionRole,
  listTournamentsHandler,
);
tournamentsRouter.get(
  "/:id",
  allowGuest,
  loadCompetitionRole,
  getTournamentByIdHandler,
);
tournamentsRouter.get(
  "/:id/report",
  requireCompetitionManager,
  downloadTournamentReportHandler,
);
tournamentsRouter.post("/", requireCompetitionManager, createTournamentHandler);
tournamentsRouter.put(
  "/:id",
  requireCompetitionManager,
  updateTournamentHandler,
);
tournamentsRouter.patch(
  "/:id/status",
  requireCompetitionManager,
  updateTournamentStatusHandler,
);
tournamentsRouter.delete(
  "/:id",
  requireCompetitionManager,
  deleteTournamentHandler,
);
tournamentsRouter.post(
  "/:tournamentId/registrations",
  requireCompetitionManager,
  createRegistrationHandler,
);
tournamentsRouter.delete(
  "/:tournamentId/registrations/:teamId",
  requireCompetitionManager,
  withdrawRegistrationHandler,
);
tournamentsRouter.get(
  "/:tournamentId/registrations",
  requireCompetitionManager,
  listRegistrationsHandler,
);

export default tournamentsRouter;
