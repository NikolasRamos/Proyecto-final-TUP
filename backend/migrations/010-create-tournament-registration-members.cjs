"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    const tableNames = tables.map((table) =>
      typeof table === "string" ? table : table.tableName,
    );

    if (!tableNames.includes("tournament_registration_members")) {
      await queryInterface.createTable("tournament_registration_members", {
        id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        registration_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: {
            model: "tournament_registrations",
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
    }

    const indexes = await queryInterface.showIndex(
      "tournament_registration_members",
    );

    if (
      !indexes.some(
        (index) =>
          index.name ===
          "tournament_registration_members_registration_user_unique",
      )
    ) {
      await queryInterface.addIndex(
        "tournament_registration_members",
        ["registration_id", "user_id"],
        {
          unique: true,
          name: "tournament_registration_members_registration_user_unique",
        },
      );
    }

    if (
      !indexes.some(
        (index) => index.name === "tournament_registration_members_user_id",
      )
    ) {
      await queryInterface.addIndex(
        "tournament_registration_members",
        ["user_id"],
        { name: "tournament_registration_members_user_id" },
      );
    }

    const [foreignKeys] = await queryInterface.sequelize.query(`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'tournament_registration_members'
        AND constraint_type = 'FOREIGN KEY'
    `);

    if (foreignKeys.length === 0) {
      await queryInterface.addConstraint("tournament_registration_members", {
        fields: ["registration_id"],
        type: "foreign key",
        name: "tournament_registration_members_registration_id_fkey",
        references: {
          table: "tournament_registrations",
          field: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournament_registration_members");
  },
};
