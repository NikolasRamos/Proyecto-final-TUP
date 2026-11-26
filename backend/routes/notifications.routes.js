import { Router } from "express";

import { requireSession } from "../middlewares/auth.middleware.js";
import { entityIdSchema } from "../schemas/id.schema.js";
import { listTeamsQuerySchema } from "../schemas/team.schema.js";
import {
  listTeamNotifications,
  markTeamNotificationRead,
} from "../services/team-notifications.service.js";

const router = Router();
const paginationSchema = listTeamsQuerySchema.pick({ page: true, limit: true });

router.use(requireSession);

router.get("/", async (request, response) => {
  const pagination = paginationSchema.safeParse(request.query);
  if (!pagination.success)
    return response.status(400).json({ message: "La paginación no es válida" });

  try {
    return response.json(
      await listTeamNotifications(
        response.locals.authUser.idUsuario,
        pagination.data,
      ),
    );
  } catch {
    return response
      .status(500)
      .json({ message: "No se pudieron cargar las notificaciones" });
  }
});

router.patch("/:requestId/read", async (request, response) => {
  const requestId = entityIdSchema.safeParse(request.params.requestId);
  if (!requestId.success)
    return response
      .status(400)
      .json({ message: "El identificador del aviso no es válido" });

  try {
    const found = await markTeamNotificationRead(
      response.locals.authUser.idUsuario,
      requestId.data,
    );
    if (!found)
      return response
        .status(404)
        .json({ message: "Notificación no encontrada" });
    return response.json({ data: { isRead: true } });
  } catch {
    return response
      .status(500)
      .json({ message: "No se pudo marcar la notificación como leída" });
  }
});

export default router;
