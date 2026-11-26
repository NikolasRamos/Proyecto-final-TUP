import { Router } from "express";

import {
  decideMembershipRequestHandler,
  getTeamMembershipStateHandler,
  inviteMemberHandler,
  listMembershipRequestsHandler,
  listMyTeamsHandler,
  requestMembershipHandler,
} from "../controllers/team-membership-requests.controller.js";
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
teamsRouter.get("/mine", requireSession, listMyTeamsHandler);
teamsRouter.get(
  "/membership-requests",
  requireSession,
  listMembershipRequestsHandler,
);
teamsRouter.get(
  "/:teamId/membership",
  requireSession,
  getTeamMembershipStateHandler,
);
teamsRouter.post(
  "/:teamId/join-requests",
  requireSession,
  loadCompetitionRole,
  requestMembershipHandler,
);
teamsRouter.post("/:teamId/invitations", requireSession, inviteMemberHandler);
teamsRouter.patch(
  "/:teamId/membership-requests/:requestId",
  requireSession,
  decideMembershipRequestHandler,
);
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
