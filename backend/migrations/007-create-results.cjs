"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("results", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      match_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: "matches", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      home_score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      away_score: {
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

    await queryInterface.addIndex("results", ["match_id"], {
      unique: true,
      name: "results_match_id_unique",
    });
    await queryInterface.sequelize.query(`
      ALTER TABLE results
      ADD CONSTRAINT results_non_negative_scores_check
      CHECK (home_score >= 0 AND away_score >= 0)
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("results");
  },
};
