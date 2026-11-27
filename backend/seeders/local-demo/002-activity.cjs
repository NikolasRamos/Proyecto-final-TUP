const {
  teams,
  tournaments,
  catalogIds,
  accountIds,
  demoTransaction,
} = require("./support/data.cjs");

const registrations = {
  north: "registered",
  south: "registered",
  river: "withdrawn",
};
const requests = [
  {
    team: "north",
    user: "bela",
    initiator: "bela",
    kind: "request",
    status: "accepted",
    read: { user: "bela", event: "resolved" },
  },
  {
    team: "north",
    user: "cristi",
    initiator: "cristi",
    kind: "request",
    status: "pending",
  },
  {
    team: "south",
    user: "alex",
    initiator: "bela",
    kind: "invitation",
    status: "pending",
  },
];

function requestWhere({ team, user, initiator, kind }, teamIds, users) {
  return {
    team_id: teamIds[team],
    user_id: users[user],
    initiator_id: users[initiator],
    kind,
  };
}

module.exports = {
  up(queryInterface) {
    return demoTransaction(queryInterface, async (transaction) => {
      const users = await accountIds(queryInterface, transaction);
      const teamIds = await catalogIds(
        queryInterface,
        "teams",
        teams,
        transaction,
      );
      const { league } = await catalogIds(
        queryInterface,
        "tournaments",
        tournaments,
        transaction,
      );
      if (
        !league ||
        [...Object.values(users), ...Object.values(teamIds)].some((id) => !id)
      ) {
        throw new Error("Primero cargá el catálogo de demostración local");
      }

      const now = new Date();
      for (const [key, status] of Object.entries(registrations)) {
        const where = { tournament_id: league, team_id: teamIds[key] };
        const existing = await queryInterface.select(
          null,
          "tournament_registrations",
          { where, transaction },
        );
        if (existing.length) continue;
        const [entry] = await queryInterface.bulkInsert(
          "tournament_registrations",
          [
            {
              ...where,
              status,
              created_at: now,
              updated_at: now,
            },
          ],
          { returning: ["id"], transaction },
        );

        await queryInterface.bulkInsert(
          "tournament_registration_members",
          teams[key].members.map((member) => ({
            registration_id: entry.id,
            user_id: users[member],
            created_at: now,
            updated_at: now,
          })),
          { transaction },
        );
      }

      for (const request of requests) {
        const where = requestWhere(request, teamIds, users);
        const existing = await queryInterface.select(
          null,
          "team_membership_requests",
          { where, transaction },
        );
        if (existing.length) continue;
        const [entry] = await queryInterface.bulkInsert(
          "team_membership_requests",
          [
            {
              ...where,
              status: request.status,
              created_at: now,
              updated_at: now,
            },
          ],
          { returning: ["id"], transaction },
        );

        if (request.read) {
          await queryInterface.bulkInsert(
            "team_notification_reads",
            [
              {
                request_id: entry.id,
                user_id: users[request.read.user],
                event: request.read.event,
                read_at: now,
              },
            ],
            { transaction },
          );
        }
      }
    });
  },

  down(queryInterface) {
    return demoTransaction(queryInterface, async (transaction) => {
      const users = await accountIds(queryInterface, transaction);
      const teamIds = await catalogIds(
        queryInterface,
        "teams",
        teams,
        transaction,
      );
      const { league } = await catalogIds(
        queryInterface,
        "tournaments",
        tournaments,
        transaction,
      );
      for (const request of requests) {
        const where = requestWhere(request, teamIds, users);
        if (!where.team_id || !where.user_id || !where.initiator_id) continue;
        await queryInterface.bulkDelete("team_membership_requests", where, {
          transaction,
        });
      }
      if (league)
        await queryInterface.bulkDelete(
          "tournament_registrations",
          {
            tournament_id: league,
            team_id: Object.values(teamIds).filter(Boolean),
          },
          { transaction },
        );
    });
  },
};
