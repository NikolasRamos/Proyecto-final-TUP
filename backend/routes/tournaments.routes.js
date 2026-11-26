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
import { allowGuest, requireSession } from "../middlewares/auth.middleware.js";

const tournamentsRouter = Router();

tournamentsRouter.get("/", allowGuest, listTournamentsHandler);
tournamentsRouter.get("/:id", allowGuest, getTournamentByIdHandler);
tournamentsRouter.get(
  "/:id/report",
  requireSession,
  downloadTournamentReportHandler,
);
tournamentsRouter.post("/", requireSession, createTournamentHandler);
tournamentsRouter.put("/:id", requireSession, updateTournamentHandler);
tournamentsRouter.patch(
  "/:id/status",
  requireSession,
  updateTournamentStatusHandler,
);
tournamentsRouter.delete("/:id", requireSession, deleteTournamentHandler);
tournamentsRouter.post(
  "/:tournamentId/registrations",
  requireSession,
  createRegistrationHandler,
);
tournamentsRouter.delete(
  "/:tournamentId/registrations/:teamId",
  requireSession,
  withdrawRegistrationHandler,
);
tournamentsRouter.get(
  "/:tournamentId/registrations",
  requireSession,
  listRegistrationsHandler,
);

export default tournamentsRouter;
