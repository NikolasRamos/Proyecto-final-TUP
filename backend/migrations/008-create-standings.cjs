"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("standings", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      tournament_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "tournaments", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      played: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      won: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      drawn: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      lost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      goals_for: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      goals_against: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      goal_difference: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      points: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.addIndex("standings", ["tournament_id", "team_id"], {
      unique: true,
      name: "standings_tournament_id_team_id_unique",
    });
    await queryInterface.addIndex("standings", ["tournament_id", "points"]);
    await queryInterface.sequelize.query(`
      ALTER TABLE standings
      ADD CONSTRAINT standings_non_negative_values_check
      CHECK (
        played >= 0 AND won >= 0 AND drawn >= 0 AND lost >= 0 AND
        goals_for >= 0 AND goals_against >= 0 AND points >= 0
      )
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("standings");
  },
};
