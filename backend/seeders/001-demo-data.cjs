"use strict";

const DEMO_TEAMS = [
  {
    name: "Los Halcones",
    description:
      "Equipo competitivo que se destaca por su velocidad y coordinación.",
    captainId: 2,
    memberIds: [8, 9, 10, 11, 12],
  },
  {
    name: "Titanes del Sur",
    description:
      "Grupo de amigos que comparte la pasión por el deporte y el trabajo en equipo.",
    captainId: 3,
    memberIds: [13, 14, 15, 16, 17],
  },
  {
    name: "Fénix Club",
    description:
      "Equipo que afronta cada competencia con perseverancia y compromiso.",
    captainId: 4,
    memberIds: [18, 19, 20, 21, 22],
  },
  {
    name: "Lobos Unidos",
    description:
      "Conjunto enfocado en la estrategia, la comunicación y el juego colectivo.",
    captainId: 5,
    memberIds: [23, 24, 25, 26, 27],
  },
  {
    name: "Los Cóndores",
    description:
      "Equipo amateur con entusiasmo por participar en distintas competencias deportivas.",
    captainId: 6,
    memberIds: [28, 29, 30, 31, 32],
  },
  {
    name: "Fuerza Norte",
    description:
      "Grupo deportivo que promueve el compañerismo y la superación personal.",
    captainId: 7,
    memberIds: [33, 34, 35, 36, 37],
  },
  {
    name: "Panteras del Oeste",
    description:
      "Equipo amateur que se destaca por su energía, disciplina y compañerismo.",
    captainId: 38,
    memberIds: [39, 40, 41, 42, 43],
  },
  {
    name: "Guardianes del Valle",
    description:
      "Grupo de deportistas que disfruta competir y afrontar nuevos desafíos en equipo.",
    captainId: 44,
    memberIds: [45, 46, 47, 48, 49],
  },
  {
    name: "Toros del Este",
    description: "Equipo que combina constancia, fuerza y trabajo colectivo.",
    captainId: 50,
    memberIds: [51, 52, 53, 54, 55],
  },
  {
    name: "Águilas Doradas",
    description:
      "Grupo deportivo que se destaca por su coordinación y espíritu competitivo.",
    captainId: 56,
    memberIds: [57, 58, 59, 60, 61],
  },
  {
    name: "Leones del Centro",
    description:
      "Equipo amateur comprometido con el juego limpio y la superación personal.",
    captainId: 62,
    memberIds: [63, 64, 65, 66, 67],
  },
  {
    name: "Rayos del Norte",
    description:
      "Conjunto dinámico que disfruta competir y asumir nuevos desafíos.",
    captainId: 68,
    memberIds: [69, 70, 71, 72, 73],
  },
  {
    name: "Pumas del Valle",
    description:
      "Grupo de amigos que entrena y compite con entusiasmo y disciplina.",
    captainId: 74,
    memberIds: [75, 76, 77, 78, 79],
  },
  {
    name: "Dragones Rojos",
    description:
      "Equipo enfocado en la estrategia y el apoyo entre sus integrantes.",
    captainId: 80,
    memberIds: [81, 82, 83, 84, 85],
  },
  {
    name: "Centauros Unidos",
    description:
      "Conjunto deportivo que valora el compromiso y la colaboración.",
    captainId: 86,
    memberIds: [87, 88, 89, 90, 91],
  },
  {
    name: "Guerreros del Sol",
    description:
      "Equipo que afronta cada encuentro con energía y perseverancia.",
    captainId: 92,
    memberIds: [93, 94, 95, 96, 97],
  },
];

const DEMO_TOURNAMENTS = [
  {
    name: "Liga de Fútbol 5 del Sur",
    description:
      "Liga amateur de fútbol 5 con partidos semanales y clasificación por puntos.",
    modality: "league",
    maxParticipants: 12,
    registrationDeadline: "2026-11-10",
    startDate: "2026-11-15",
    endDate: "2027-02-07",
    status: "open",
    organizerId: 2,
  },
  {
    name: "Copa Relámpago de Básquet",
    description:
      "Torneo de básquet con eliminación directa y partidos de cuatro cuartos.",
    modality: "single_elimination",
    maxParticipants: 8,
    registrationDeadline: "2026-11-20",
    startDate: "2026-11-28",
    endDate: "2026-11-29",
    status: "open",
    organizerId: 3,
  },
  {
    name: "Campeonato Regional de Vóley",
    description:
      "Competencia de vóley con fase de grupos y clasificación a las rondas finales.",
    modality: "group_stage",
    maxParticipants: 16,
    registrationDeadline: "2026-10-10",
    startDate: "2026-10-17",
    endDate: "2026-11-21",
    status: "in_progress",
    organizerId: 4,
  },
  {
    name: "Copa de Pádel por Equipos",
    description:
      "Torneo de pádel por equipos con cruces de eliminación directa.",
    modality: "single_elimination",
    maxParticipants: 16,
    registrationDeadline: "2026-12-05",
    startDate: "2026-12-12",
    endDate: "2026-12-13",
    status: "draft",
    organizerId: 5,
  },
  {
    name: "Liga Universitaria de Futsal",
    description:
      "Competencia entre equipos universitarios mediante una liga de todos contra todos.",
    modality: "league",
    maxParticipants: 10,
    registrationDeadline: "2026-08-01",
    startDate: "2026-08-08",
    endDate: "2026-10-17",
    status: "finished",
    organizerId: 6,
  },
  {
    name: "Encuentro de Handball Metropolitano",
    description:
      "Torneo de handball con grupos iniciales y una fase final para definir al campeón.",
    modality: "group_stage",
    maxParticipants: 12,
    registrationDeadline: "2026-10-20",
    startDate: "2026-11-07",
    endDate: "2026-11-28",
    status: "cancelled",
    organizerId: 7,
  },
];

const DEMO_REGISTRATIONS = [
  {
    tournamentName: "Liga de Fútbol 5 del Sur",
    registeredTeamNames: DEMO_TEAMS.slice(0, 8).map((team) => team.name),
    withdrawnTeamNames: [DEMO_TEAMS[8].name],
    registeredAt: "2026-10-30T12:00:00.000Z",
  },
  {
    tournamentName: "Copa Relámpago de Básquet",
    registeredTeamNames: DEMO_TEAMS.slice(8, 12).map((team) => team.name),
    withdrawnTeamNames: [DEMO_TEAMS[12].name],
    registeredAt: "2026-10-30T13:00:00.000Z",
  },
  {
    tournamentName: "Campeonato Regional de Vóley",
    registeredTeamNames: DEMO_TEAMS.map((team) => team.name),
    withdrawnTeamNames: [],
    registeredAt: "2026-10-09T12:00:00.000Z",
  },
  {
    tournamentName: "Copa de Pádel por Equipos",
    registeredTeamNames: [],
    withdrawnTeamNames: [],
    registeredAt: "2026-10-30T14:00:00.000Z",
  },
  {
    tournamentName: "Liga Universitaria de Futsal",
    registeredTeamNames: DEMO_TEAMS.slice(0, 10).map((team) => team.name),
    withdrawnTeamNames: [],
    registeredAt: "2026-07-30T12:00:00.000Z",
  },
  {
    tournamentName: "Encuentro de Handball Metropolitano",
    registeredTeamNames: DEMO_TEAMS.slice(10, 16).map((team) => team.name),
    withdrawnTeamNames: [],
    registeredAt: "2026-10-19T12:00:00.000Z",
  },
];

async function findIdByName(queryInterface, table, name, transaction) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT id FROM ${table} WHERE name = :name ORDER BY id LIMIT 1`,
    { replacements: { name }, transaction },
  );

  return rows[0]?.id ?? null;
}

async function upsertTeam(queryInterface, team, transaction) {
  let teamId = await findIdByName(
    queryInterface,
    "teams",
    team.name,
    transaction,
  );

  if (teamId) {
    await queryInterface.sequelize.query(
      `UPDATE teams
       SET description = :description, captain_id = :captainId, updated_at = NOW()
       WHERE id = :teamId`,
      { replacements: { ...team, teamId }, transaction },
    );
  } else {
    const [rows] = await queryInterface.sequelize.query(
      `INSERT INTO teams (name, description, captain_id, created_at, updated_at)
       VALUES (:name, :description, :captainId, NOW(), NOW())
       RETURNING id`,
      { replacements: team, transaction },
    );
    teamId = rows[0].id;
  }

  await queryInterface.sequelize.query(
    "DELETE FROM team_members WHERE team_id = :teamId",
    { replacements: { teamId }, transaction },
  );

  for (const userId of [team.captainId, ...team.memberIds]) {
    await queryInterface.sequelize.query(
      `INSERT INTO team_members (team_id, user_id, created_at, updated_at)
       VALUES (:teamId, :userId, NOW(), NOW())`,
      { replacements: { teamId, userId }, transaction },
    );
  }

  return teamId;
}

async function upsertTournament(queryInterface, tournament, transaction) {
  let tournamentId = await findIdByName(
    queryInterface,
    "tournaments",
    tournament.name,
    transaction,
  );
  const replacements = { ...tournament, tournamentId };

  if (tournamentId) {
    await queryInterface.sequelize.query(
      `UPDATE tournaments
       SET description = :description,
           modality = :modality,
           max_participants = :maxParticipants,
           registration_deadline = :registrationDeadline,
           start_date = :startDate,
           end_date = :endDate,
           status = :status,
           organizer_id = :organizerId,
           updated_at = NOW()
       WHERE id = :tournamentId`,
      { replacements, transaction },
    );
  } else {
    const [rows] = await queryInterface.sequelize.query(
      `INSERT INTO tournaments (
         name, description, modality, max_participants,
         registration_deadline, start_date, end_date, status,
         organizer_id, created_at, updated_at
       ) VALUES (
         :name, :description, :modality, :maxParticipants,
         :registrationDeadline, :startDate, :endDate, :status,
         :organizerId, NOW(), NOW()
       ) RETURNING id`,
      { replacements: tournament, transaction },
    );
    tournamentId = rows[0].id;
  }

  return tournamentId;
}

async function insertRegistration(
  queryInterface,
  tournamentId,
  teamId,
  status,
  registeredAt,
  transaction,
) {
  await queryInterface.sequelize.query(
    `INSERT INTO tournament_registrations (
       tournament_id, team_id, status, created_at, updated_at
     ) VALUES (
       :tournamentId, :teamId, :status, :registeredAt, :registeredAt
     )`,
    {
      replacements: {
        tournamentId,
        teamId,
        status,
        registeredAt,
      },
      transaction,
    },
  );
}

module.exports = {
  DEMO_TEAMS,
  DEMO_TOURNAMENTS,
  DEMO_REGISTRATIONS,

  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const teamIds = new Map();
      const tournamentIds = new Map();

      for (const team of DEMO_TEAMS) {
        const teamId = await upsertTeam(queryInterface, team, transaction);
        teamIds.set(team.name, teamId);
      }

      for (const tournament of DEMO_TOURNAMENTS) {
        const tournamentId = await upsertTournament(
          queryInterface,
          tournament,
          transaction,
        );
        tournamentIds.set(tournament.name, tournamentId);
        await queryInterface.sequelize.query(
          "DELETE FROM tournament_registrations WHERE tournament_id = :tournamentId",
          { replacements: { tournamentId }, transaction },
        );
      }

      for (const registrationSet of DEMO_REGISTRATIONS) {
        const tournamentId = tournamentIds.get(registrationSet.tournamentName);

        for (const teamName of registrationSet.registeredTeamNames) {
          await insertRegistration(
            queryInterface,
            tournamentId,
            teamIds.get(teamName),
            "registered",
            registrationSet.registeredAt,
            transaction,
          );
        }

        for (const teamName of registrationSet.withdrawnTeamNames) {
          await insertRegistration(
            queryInterface,
            tournamentId,
            teamIds.get(teamName),
            "withdrawn",
            registrationSet.registeredAt,
            transaction,
          );
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      const tournamentIds = [];
      const teamIds = [];

      for (const tournament of DEMO_TOURNAMENTS) {
        const tournamentId = await findIdByName(
          queryInterface,
          "tournaments",
          tournament.name,
          transaction,
        );
        if (tournamentId) tournamentIds.push(tournamentId);
      }

      for (const team of DEMO_TEAMS) {
        const teamId = await findIdByName(
          queryInterface,
          "teams",
          team.name,
          transaction,
        );
        if (teamId) teamIds.push(teamId);
      }

      for (const tournamentId of tournamentIds) {
        await queryInterface.sequelize.query(
          "DELETE FROM tournament_registrations WHERE tournament_id = :tournamentId",
          { replacements: { tournamentId }, transaction },
        );
        await queryInterface.sequelize.query(
          "DELETE FROM tournaments WHERE id = :tournamentId",
          { replacements: { tournamentId }, transaction },
        );
      }

      for (const teamId of teamIds) {
        await queryInterface.sequelize.query(
          "DELETE FROM tournament_registrations WHERE team_id = :teamId",
          { replacements: { teamId }, transaction },
        );
        await queryInterface.sequelize.query(
          "DELETE FROM team_members WHERE team_id = :teamId",
          { replacements: { teamId }, transaction },
        );
        await queryInterface.sequelize.query(
          "DELETE FROM teams WHERE id = :teamId",
          { replacements: { teamId }, transaction },
        );
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
