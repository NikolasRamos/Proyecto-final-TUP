"use strict";

async function dropPrototypeTables(queryInterface) {
  await queryInterface.dropTable("tournament_registrations");
  await queryInterface.dropTable("team_members");
  await queryInterface.dropTable("teams");
  await queryInterface.dropTable("tournaments");
}

async function createIntegerTables(queryInterface, Sequelize) {
  await queryInterface.createTable("tournaments", {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    modality: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    max_participants: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    registration_deadline: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "draft",
    },
    organizer_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("tournaments", ["organizer_id"]);
  await queryInterface.addIndex("tournaments", ["status"]);

  await queryInterface.createTable("teams", {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    captain_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("teams", ["captain_id"]);

  await queryInterface.createTable("team_members", {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "teams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("team_members", ["team_id", "user_id"], {
    unique: true,
    name: "team_members_team_id_user_id_unique",
  });
  await queryInterface.addIndex("team_members", ["user_id"]);

  await queryInterface.createTable("tournament_registrations", {
    id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    tournament_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "tournaments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    team_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: "teams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "registered",
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex(
    "tournament_registrations",
    ["tournament_id", "team_id"],
    {
      unique: true,
      name: "tournament_registrations_tournament_id_team_id_unique",
    },
  );
  await queryInterface.addIndex("tournament_registrations", [
    "tournament_id",
    "status",
  ]);
  await queryInterface.addIndex("tournament_registrations", ["team_id"]);
}

async function createUuidTables(queryInterface, Sequelize) {
  await queryInterface.createTable("tournaments", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    modality: {
      type: Sequelize.STRING(30),
      allowNull: false,
    },
    max_participants: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    registration_deadline: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    start_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "draft",
    },
    organizer_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("tournaments", ["organizer_id"]);
  await queryInterface.addIndex("tournaments", ["status"]);

  await queryInterface.createTable("teams", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    },
    name: {
      type: Sequelize.STRING(120),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    captain_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("teams", ["captain_id"]);

  await queryInterface.createTable("team_members", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    },
    team_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "teams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex("team_members", ["team_id", "user_id"], {
    unique: true,
    name: "team_members_team_id_user_id_unique",
  });
  await queryInterface.addIndex("team_members", ["user_id"]);

  await queryInterface.createTable("tournament_registrations", {
    id: {
      type: Sequelize.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: Sequelize.literal("gen_random_uuid()"),
    },
    tournament_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "tournaments",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    team_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: "teams",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT",
    },
    status: {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "registered",
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
    updated_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn("NOW"),
    },
  });

  await queryInterface.addIndex(
    "tournament_registrations",
    ["tournament_id", "team_id"],
    {
      unique: true,
      name: "tournament_registrations_tournament_id_team_id_unique",
    },
  );
  await queryInterface.addIndex("tournament_registrations", [
    "tournament_id",
    "status",
  ]);
  await queryInterface.addIndex("tournament_registrations", ["team_id"]);
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambio destructivo autorizado para el prototipo: estas tablas solo
    // contienen datos de prueba y se reconstruyen con IDs enteros.
    await dropPrototypeTables(queryInterface);
    await createIntegerTables(queryInterface, Sequelize);
  },

  async down(queryInterface, Sequelize) {
    // La reversión también reconstruye tablas vacías porque no existe una
    // conversión segura entre los enteros nuevos y los UUID descartados.
    await dropPrototypeTables(queryInterface);
    await createUuidTables(queryInterface, Sequelize);
  },
};
