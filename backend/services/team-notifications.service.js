import { QueryTypes } from "sequelize";

import database from "../config/database.js";

const visibleEvents = `
  SELECT r.id AS request_id, r.team_id, t.name AS team_name, r.kind, r.status,
    CASE WHEN r.initiator_id = $userId THEN 'resolved' ELSE 'received' END AS event,
    CASE WHEN r.initiator_id = $userId THEN r.updated_at ELSE r.created_at END AS happened_at
  FROM team_membership_requests r JOIN teams t ON t.id = r.team_id
  WHERE (r.initiator_id = $userId AND r.status IN ('accepted', 'rejected'))
    OR (r.initiator_id <> $userId AND (
      (r.kind = 'request' AND t.captain_account_id = $userId)
      OR (r.kind = 'invitation' AND r.user_id = $userId)
    ))`;

export async function listTeamNotifications(userId, { page, limit }) {
  const [result] = await database.query(
    `
    WITH visible AS (${visibleEvents}), inbox AS (
      SELECT v.request_id AS "requestId", v.team_id AS "teamId", v.team_name AS "teamName",
        v.kind, v.status, v.event, v.happened_at AS "createdAt", (receipt.read_at IS NOT NULL) AS "isRead"
      FROM visible v
      LEFT JOIN team_notification_reads receipt
        ON receipt.request_id = v.request_id AND receipt.user_id = $userId AND receipt.event = v.event
    )
    SELECT COUNT(*)::int AS total, (COUNT(*) FILTER (WHERE NOT "isRead"))::int AS unread,
      (SELECT COALESCE(json_agg(item ORDER BY item."createdAt" DESC, item."requestId" DESC), '[]'::json)
       FROM (SELECT * FROM inbox ORDER BY "createdAt" DESC, "requestId" DESC LIMIT $limit OFFSET $offset) AS item) AS data
    FROM inbox
  `,
    {
      bind: { userId, limit, offset: (page - 1) * limit },
      type: QueryTypes.SELECT,
    },
  );

  return {
    data: result.data,
    unread: result.unread,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

export async function markTeamNotificationRead(userId, requestId) {
  const [result] = await database.query(
    `
    WITH visible AS (${visibleEvents}), marked AS (
      INSERT INTO team_notification_reads (request_id, user_id, event)
      SELECT request_id, $userId, event FROM visible WHERE request_id = $requestId
      ON CONFLICT (request_id, user_id, event) DO NOTHING
    )
    SELECT EXISTS(SELECT 1 FROM visible WHERE request_id = $requestId) AS found
  `,
    { bind: { userId, requestId }, type: QueryTypes.SELECT },
  );
  return result.found;
}
