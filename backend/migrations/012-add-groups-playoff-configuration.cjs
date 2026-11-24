"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "tournaments",
        "playoff_spots",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "tournaments",
        "group_count",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.addColumn(
        "tournaments",
        "max_participants_per_group",
        {
          type: Sequelize.INTEGER,
          allowNull: true,
        },
        { transaction },
      );

      await queryInterface.sequelize.query(
        `
          ALTER TABLE tournaments
          ADD CONSTRAINT tournaments_groups_playoff_configuration_check
          CHECK (
            (
              playoff_spots IS NULL AND
              group_count IS NULL AND
              max_participants_per_group IS NULL
            )
            OR
            (
              modality = 'groups_playoff' AND
              playoff_spots >= 2 AND
              (playoff_spots & (playoff_spots - 1)) = 0 AND
              group_count >= 2 AND
              group_count <= playoff_spots AND
              MOD(playoff_spots, group_count) = 0 AND
              max_participants_per_group > (playoff_spots / group_count) AND
              max_participants = group_count * max_participants_per_group
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
          DROP CONSTRAINT IF EXISTS tournaments_groups_playoff_configuration_check
        `,
        { transaction },
      );

      await queryInterface.removeColumn(
        "tournaments",
        "max_participants_per_group",
        { transaction },
      );
      await queryInterface.removeColumn("tournaments", "group_count", {
        transaction,
      });
      await queryInterface.removeColumn("tournaments", "playoff_spots", {
        transaction,
      });
    });
  },
};
