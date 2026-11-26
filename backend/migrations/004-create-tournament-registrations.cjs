"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournament_registrations");
  },
};
