"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("matches", {
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
      home_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      away_team_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "teams", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: "scheduled",
      },
      round: {
        type: Sequelize.STRING(60),
        allowNull: true,
      },
      match_date: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex("matches", ["tournament_id", "status"]);
    await queryInterface.addIndex("matches", ["home_team_id"]);
    await queryInterface.addIndex("matches", ["away_team_id"]);
    await queryInterface.sequelize.query(`
      ALTER TABLE matches
      ADD CONSTRAINT matches_different_teams_check
      CHECK (home_team_id <> away_team_id)
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("matches");
  },
};
