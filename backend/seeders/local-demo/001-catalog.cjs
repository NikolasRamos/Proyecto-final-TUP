const bcrypt = require("bcrypt");
const { ensureRoles } = require("../roles.cjs");
const {
  DEMO_MARKER,
  DEMO_PASSWORD,
  accounts,
  teams,
  tournaments,
  catalogIds,
  demoTransaction,
} = require("./support/data.cjs");

async function seedAccounts(queryInterface, now, transaction) {
  await ensureRoles(queryInterface, transaction);
  const roles = await queryInterface.select(null, "rol", { transaction });
  const roleIds = new Map(roles.map(({ nombre, idRol }) => [nombre, idRol]));
  const existing = await queryInterface.select(null, "usuario", {
    attributes: ["idUsuario", "email", "idRol", "deletedAt"],
    where: { email: Object.values(accounts).map(([, email]) => email) },
    transaction,
  });
  const usersByEmail = new Map(
    existing.map((account) => [account.email, account]),
  );
  const password = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ids = {};

  for (const [key, [nombre, email, role]] of Object.entries(accounts)) {
    const idRol = roleIds.get(role);
    const current = usersByEmail.get(email);
    if (current) {
      if (current.deletedAt !== null || current.idRol !== idRol) {
        throw new Error(
          `La cuenta de demo ${email} ya existe con otro estado o rol`,
        );
      }
      ids[key] = current.idUsuario;
      continue;
    }

    const [created] = await queryInterface.bulkInsert(
      "usuario",
      [{ nombre, email, password, idRol, createdAt: now, updatedAt: now }],
      { returning: ["idUsuario"], transaction },
    );
    ids[key] = created.idUsuario;
  }

  return ids;
}

function dateFrom(now, days) {
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

module.exports = {
  up(queryInterface) {
    return demoTransaction(queryInterface, async (transaction) => {
      const now = new Date();
      const users = await seedAccounts(queryInterface, now, transaction);
      const teamIds = await catalogIds(
        queryInterface,
        "teams",
        teams,
        transaction,
      );
      const tournamentIds = await catalogIds(
        queryInterface,
        "tournaments",
        tournaments,
        transaction,
      );

      for (const [key, { name, captain, members }] of Object.entries(teams)) {
        if (teamIds[key]) continue;
        const [team] = await queryInterface.bulkInsert(
          "teams",
          [
            {
              name,
              description: DEMO_MARKER,
              captain_id: users[captain],
              captain_account_id: users[captain],
              created_at: now,
              updated_at: now,
            },
          ],
          { returning: ["id"], transaction },
        );
        await queryInterface.bulkInsert(
          "team_members",
          members.map((member) => ({
            team_id: team.id,
            user_id: users[member],
            account_linked: true,
            created_at: now,
            updated_at: now,
          })),
          { transaction },
        );
      }

      for (const [key, { organizer, ...data }] of Object.entries(tournaments)) {
        if (tournamentIds[key]) continue;
        const started = data.status === "in_progress";
        await queryInterface.bulkInsert(
          "tournaments",
          [
            {
              ...data,
              description: DEMO_MARKER,
              organizer_id: users[organizer],
              organizer_account_id: users[organizer],
              registration_deadline: dateFrom(now, started ? -10 : 7),
              start_date: dateFrom(now, started ? -5 : 14),
              end_date: dateFrom(now, 28),
              created_at: now,
              updated_at: now,
            },
          ],
          { transaction },
        );
      }
    });
  },

  down(queryInterface) {
    return demoTransaction(queryInterface, async (transaction) => {
      const tournamentIds = await catalogIds(
        queryInterface,
        "tournaments",
        tournaments,
        transaction,
      );
      const teamIds = await catalogIds(
        queryInterface,
        "teams",
        teams,
        transaction,
      );
      await queryInterface.bulkDelete(
        "tournaments",
        { id: Object.values(tournamentIds).filter(Boolean) },
        { transaction },
      );
      await queryInterface.bulkDelete(
        "teams",
        { id: Object.values(teamIds).filter(Boolean) },
        { transaction },
      );
    });
  },
};
