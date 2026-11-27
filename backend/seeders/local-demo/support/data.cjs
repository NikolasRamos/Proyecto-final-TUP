const DEMO_MARKER = "Demostración local del Grupo 16";
const DEMO_PASSWORD = "DemoLocal123";

const accounts = {
  admin: ["Admin Demo", "admin.demo@torneos.test", "administrador"],
  organizer: ["Mara Demo", "organizador.demo@torneos.test", "organizador"],
  otherOrganizer: [
    "Tomás Demo",
    "organizador2.demo@torneos.test",
    "organizador",
  ],
  alex: ["Alex Demo", "alex.demo@torneos.test", "participante"],
  bela: ["Bela Demo", "bela.demo@torneos.test", "participante"],
  cristi: ["Cristi Demo", "cristi.demo@torneos.test", "participante"],
};

const teams = {
  north: {
    name: "Demo local · Rayo Norte",
    captain: "alex",
    members: ["alex", "bela"],
  },
  south: {
    name: "Demo local · Brújula Sur",
    captain: "bela",
    members: ["bela", "cristi"],
  },
  river: {
    name: "Demo local · Faro del Río",
    captain: "cristi",
    members: ["cristi", "alex"],
  },
};

const tournaments = {
  league: {
    name: "Demo local · Liga de equipos",
    modality: "league",
    max_participants: 4,
    status: "open",
    organizer: "organizer",
    is_team_tournament: true,
    min_team_members: 2,
    max_team_members: 3,
  },
  bracket: {
    name: "Demo local · Copa en borrador",
    modality: "single_elimination",
    max_participants: 8,
    status: "draft",
    organizer: "organizer",
    is_team_tournament: false,
  },
  swiss: {
    name: "Demo local · Suizo individual",
    modality: "swiss",
    max_participants: 8,
    swiss_rounds: 3,
    status: "open",
    organizer: "otherOrganizer",
    is_team_tournament: false,
  },
  groups: {
    name: "Demo local · Grupos y Playoff",
    modality: "groups_playoff",
    max_participants: 8,
    playoff_spots: 4,
    group_count: 2,
    max_participants_per_group: 4,
    status: "in_progress",
    organizer: "otherOrganizer",
    is_team_tournament: true,
    min_team_members: 2,
    max_team_members: 4,
  },
};

function demoTransaction(queryInterface, run) {
  return queryInterface.sequelize.transaction(async (transaction) => {
    await queryInterface.sequelize.query(
      "SELECT pg_advisory_xact_lock(164017)",
      { transaction },
    );
    return run(transaction);
  });
}

async function catalogIds(queryInterface, table, entries, transaction) {
  const rows = await queryInterface.select(null, table, {
    attributes: ["id", "name"],
    where: {
      name: Object.values(entries).map(({ name }) => name),
      description: DEMO_MARKER,
    },
    transaction,
  });
  const idsByName = new Map(rows.map(({ id, name }) => [name, id]));
  return Object.fromEntries(
    Object.entries(entries).map(([key, { name }]) => [
      key,
      idsByName.get(name),
    ]),
  );
}

async function accountIds(queryInterface, transaction) {
  const rows = await queryInterface.select(null, "usuario", {
    attributes: ["idUsuario", "email"],
    where: {
      email: Object.values(accounts).map(([, email]) => email),
      deletedAt: null,
    },
    transaction,
  });
  const idsByEmail = new Map(
    rows.map(({ email, idUsuario }) => [email, idUsuario]),
  );
  return Object.fromEntries(
    Object.entries(accounts).map(([key, [, email]]) => [
      key,
      idsByEmail.get(email),
    ]),
  );
}

module.exports = {
  DEMO_MARKER,
  DEMO_PASSWORD,
  accounts,
  teams,
  tournaments,
  catalogIds,
  accountIds,
  demoTransaction,
};
