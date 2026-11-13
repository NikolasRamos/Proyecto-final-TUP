"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "tournaments",
        "swiss_rounds",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE tournaments
          ADD CONSTRAINT tournaments_swiss_rounds_check
          CHECK (
            swiss_rounds IS NULL
            OR
            (
              modality = 'swiss' AND
              swiss_rounds >= 1 AND
              swiss_rounds <= max_participants - 1
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
          DROP CONSTRAINT IF EXISTS tournaments_swiss_rounds_check
        `,
        { transaction },
      );

      await queryInterface.removeColumn("tournaments", "swiss_rounds", {
        transaction,
      });
    });
  },
};
