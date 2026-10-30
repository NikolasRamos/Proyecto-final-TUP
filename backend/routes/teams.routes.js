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

const teamsRouter = Router();

teamsRouter.get("/", listTeamsHandler);
teamsRouter.get("/:id", getTeamByIdHandler);
teamsRouter.post("/", createTeamHandler);
teamsRouter.put("/:id", updateTeamHandler);
teamsRouter.delete("/:id", deleteTeamHandler);
teamsRouter.post("/:teamId/members", addTeamMemberHandler);
teamsRouter.get("/:teamId/members", listTeamMembersHandler);
teamsRouter.delete("/:teamId/members/:userId", removeTeamMemberHandler);

export default teamsRouter;
