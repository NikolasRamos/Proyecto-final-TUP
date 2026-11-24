"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "tournaments",
        "is_team_tournament",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "tournaments",
        "min_team_members",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "tournaments",
        "max_team_members",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE tournaments
          ADD CONSTRAINT tournaments_participation_rules_check
          CHECK (
            (
              is_team_tournament = FALSE AND
              min_team_members IS NULL AND
              max_team_members IS NULL
            )
            OR
            (
              is_team_tournament = TRUE AND
              (
                (
                  min_team_members IS NULL AND
                  max_team_members IS NULL
                )
                OR
                (
                  min_team_members >= 2 AND
                  max_team_members >= min_team_members
                )
              )
            )
          )
        `,
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.sequelize.query(
        `
          ALTER TABLE tournaments
          DROP CONSTRAINT IF EXISTS tournaments_participation_rules_check
        `,
        { transaction },
      );

      await queryInterface.removeColumn("tournaments", "max_team_members", {
        transaction,
      });
      await queryInterface.removeColumn("tournaments", "min_team_members", {
        transaction,
      });
      await queryInterface.removeColumn("tournaments", "is_team_tournament", {
        transaction,
      });
    });
  },
};
