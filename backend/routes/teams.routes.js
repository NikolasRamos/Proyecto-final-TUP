import { Router } from "express";

import {
  addTeamMemberHandler,
  createTeamHandler,
  deleteTeamHandler,
  getTeamByIdHandler,
  listTeamMembersHandler,
  listTeamsHandler,
  removeTeamMemberHandler,
  updateTeamHandler,
} from "../controllers/teams.controller.js";
import { requireSession } from "../middlewares/auth.middleware.js";

const teamsRouter = Router();

teamsRouter.get("/", listTeamsHandler);
teamsRouter.get("/:id", getTeamByIdHandler);
teamsRouter.post("/", requireSession, createTeamHandler);
teamsRouter.put("/:id", requireSession, updateTeamHandler);
teamsRouter.delete("/:id", requireSession, deleteTeamHandler);
teamsRouter.post("/:teamId/members", requireSession, addTeamMemberHandler);
teamsRouter.get("/:teamId/members", requireSession, listTeamMembersHandler);
teamsRouter.delete(
  "/:teamId/members/:userId",
  requireSession,
  removeTeamMemberHandler,
);

export default teamsRouter;
