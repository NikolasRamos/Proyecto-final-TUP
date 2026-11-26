import { z } from "zod";

import { entityIdSchema } from "../schemas/id.schema.js";
import { listTeamsQuerySchema } from "../schemas/team.schema.js";
import {
  createMembershipRequest,
  decideMembershipRequest,
  getTeamMembershipState,
  listMembershipRequests,
  listMyTeams,
} from "../services/team-membership-requests.service.js";

const paginationSchema = listTeamsQuerySchema.pick({ page: true, limit: true });
const requestsQuerySchema = paginationSchema.extend({
  box: z.enum(["received", "sent"]).default("received"),
});
const paramsSchema = z.object({ teamId: entityIdSchema });
const decisionParamsSchema = paramsSchema.extend({ requestId: entityIdSchema });
const invitationSchema = z.strictObject({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
});
const decisionSchema = z.strictObject({
  status: z.enum(["accepted", "rejected"]),
});

const errors = {
  team_not_found: [404, "Equipo no encontrado"],
  account_not_found: [404, "No se encontró una cuenta activa"],
  request_not_found: [404, "Solicitud o invitación no encontrada"],
  forbidden: [403, "Tu cuenta no tiene permiso para esta operación"],
  no_captain: [
    409,
    "Este equipo necesita un capitán con cuenta activa para recibir solicitudes",
  ],
  already_member: [409, "La cuenta ya integra el equipo"],
  already_pending: [
    409,
    "Ya hay una solicitud o invitación pendiente entre este equipo y la cuenta",
  ],
  already_decided: [409, "La solicitud o invitación ya fue respondida"],
};

function respond(response, outcome) {
  if (outcome.outcome === "created")
    return response.status(201).json({ data: outcome.request });
  if (outcome.outcome === "decided")
    return response.status(200).json({ data: outcome.request });
  const [status, message] = errors[outcome.outcome];
  return response.status(status).json({ message });
}

function handler(schema, read, action) {
  return async (request, response) => {
    const parsed = schema.safeParse(read(request));
    if (!parsed.success)
      return response
        .status(400)
        .json({ message: "Los datos de la solicitud no son válidos" });
    try {
      return await action(
        parsed.data,
        request,
        response,
        response.locals.authUser.idUsuario,
      );
    } catch {
      return response
        .status(500)
        .json({ message: "No se pudo completar la operación del equipo" });
    }
  };
}

export const listMyTeamsHandler = handler(
  paginationSchema,
  (request) => request.query,
  async (query, _request, response, userId) =>
    response.json(await listMyTeams(userId, query)),
);
export const listMembershipRequestsHandler = handler(
  requestsQuerySchema,
  (request) => request.query,
  async (query, _request, response, userId) =>
    response.json(await listMembershipRequests(userId, query)),
);
export const getTeamMembershipStateHandler = handler(
  paramsSchema,
  (request) => request.params,
  async ({ teamId }, _request, response, userId) => {
    const result = await getTeamMembershipState(teamId, userId);
    return result.outcome
      ? respond(response, result)
      : response.json({ data: result });
  },
);
export const requestMembershipHandler = handler(
  paramsSchema,
  (request) => request.params,
  async ({ teamId }, _request, response, initiatorId) => {
    if (response.locals.authRole !== "participante")
      return respond(response, { outcome: "forbidden" });
    return respond(
      response,
      await createMembershipRequest({ teamId, initiatorId, kind: "request" }),
    );
  },
);
export const inviteMemberHandler = handler(
  paramsSchema.extend({ body: invitationSchema }),
  (request) => ({ ...request.params, body: request.body }),
  async ({ teamId, body }, _request, response, initiatorId) =>
    respond(
      response,
      await createMembershipRequest({
        teamId,
        initiatorId,
        kind: "invitation",
        email: body.email,
      }),
    ),
);
export const decideMembershipRequestHandler = handler(
  decisionParamsSchema.extend({ body: decisionSchema }),
  (request) => ({ ...request.params, body: request.body }),
  async ({ teamId, requestId, body }, _request, response, actorId) =>
    respond(
      response,
      await decideMembershipRequest({
        teamId,
        requestId,
        actorId,
        status: body.status,
      }),
    ),
);
