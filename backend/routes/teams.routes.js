import { Router } from "express";

import {
  addTeamMemberHandler,
  assignTeamCaptainHandler,
  createTeamHandler,
  deleteTeamHandler,
  getTeamByIdHandler,
  listTeamMembersHandler,
  listTeamsHandler,
  removeTeamMemberHandler,
  updateTeamHandler,
} from "../controllers/teams.controller.js";
import {
  requireAdministrator,
  requireSession,
} from "../middlewares/auth.middleware.js";
import {
  loadCompetitionRole,
  requireCompetitionManager,
  requireTeamCreator,
} from "../middlewares/competition-access.middleware.js";

const teamsRouter = Router();

teamsRouter.get("/", listTeamsHandler);
teamsRouter.get("/:id", getTeamByIdHandler);
teamsRouter.post("/", requireTeamCreator, createTeamHandler);
teamsRouter.put("/:id", requireCompetitionManager, updateTeamHandler);
teamsRouter.patch(
  "/:id/captain",
  requireSession,
  requireAdministrator,
  assignTeamCaptainHandler,
);
teamsRouter.delete(
  "/:id",
  requireSession,
  loadCompetitionRole,
  deleteTeamHandler,
);
teamsRouter.post(
  "/:teamId/members",
  requireCompetitionManager,
  addTeamMemberHandler,
);
teamsRouter.get(
  "/:teamId/members",
  requireCompetitionManager,
  listTeamMembersHandler,
);
teamsRouter.delete(
  "/:teamId/members/:userId",
  requireCompetitionManager,
  removeTeamMemberHandler,
);

export default teamsRouter;
