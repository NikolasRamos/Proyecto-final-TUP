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
  listMyTournamentsHandler,
  listTournamentsHandler,
  updateTournamentHandler,
  updateTournamentStatusHandler,
} from "../controllers/tournaments.controller.js";
import { allowGuest } from "../middlewares/auth.middleware.js";
import {
  loadCompetitionRole,
  requireCompetitionManager,
} from "../middlewares/competition-access.middleware.js";
import { requireTournamentManager } from "../middlewares/tournament-access.middleware.js";

const tournamentsRouter = Router();

tournamentsRouter.get(
  "/",
  allowGuest,
  loadCompetitionRole,
  listTournamentsHandler,
);
tournamentsRouter.get(
  "/mine",
  requireCompetitionManager,
  listMyTournamentsHandler,
);
tournamentsRouter.get(
  "/:id",
  allowGuest,
  loadCompetitionRole,
  getTournamentByIdHandler,
);
tournamentsRouter.get(
  "/:id/report",
  requireTournamentManager,
  downloadTournamentReportHandler,
);
tournamentsRouter.post("/", requireCompetitionManager, createTournamentHandler);
tournamentsRouter.put(
  "/:id",
  requireTournamentManager,
  updateTournamentHandler,
);
tournamentsRouter.patch(
  "/:id/status",
  requireTournamentManager,
  updateTournamentStatusHandler,
);
tournamentsRouter.delete(
  "/:id",
  requireTournamentManager,
  deleteTournamentHandler,
);
tournamentsRouter.post(
  "/:tournamentId/registrations",
  requireTournamentManager,
  createRegistrationHandler,
);
tournamentsRouter.delete(
  "/:tournamentId/registrations/:teamId",
  requireTournamentManager,
  withdrawRegistrationHandler,
);
tournamentsRouter.get(
  "/:tournamentId/registrations",
  requireTournamentManager,
  listRegistrationsHandler,
);

export default tournamentsRouter;
