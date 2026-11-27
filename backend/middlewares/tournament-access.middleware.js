import Tournament from "../models/Tournament.js";
import { tournamentIdSchema } from "../schemas/tournament.schema.js";
import { publicTournamentStatuses } from "../services/tournaments.service.js";
import { requireCompetitionManager } from "./competition-access.middleware.js";

export const requireTournamentManager = [
  ...requireCompetitionManager,
  async (request, response, next) => {
    if (response.locals.authRole === "administrador") return next();

    const id = tournamentIdSchema.safeParse(
      request.params.tournamentId ?? request.params.id,
    );
    if (!id.success) {
      return response.status(400).json({
        message: "El identificador del torneo no es valido",
      });
    }

    try {
      const tournament = await Tournament.findByPk(id.data, {
        attributes: ["organizerAccountId", "status"],
      });
      if (
        tournament?.organizerAccountId === response.locals.authUser.idUsuario
      ) {
        return next();
      }
      if (tournament && publicTournamentStatuses.includes(tournament.status)) {
        return response.status(403).json({
          message: "Solo podés gestionar tus propios torneos",
        });
      }
      return response.status(404).json({ message: "Torneo no encontrado" });
    } catch {
      return response.status(500).json({
        message: "No se pudieron comprobar los permisos del torneo",
      });
    }
  },
];
