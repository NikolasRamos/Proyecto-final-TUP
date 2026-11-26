"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "tournaments",
        "organizer_account_id",
        { type: Sequelize.INTEGER, allowNull: true },
        { transaction },
      );
      await queryInterface.addIndex("tournaments", ["organizer_account_id"], {
        transaction,
      });
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tournaments", "organizer_account_id");
  },
};
