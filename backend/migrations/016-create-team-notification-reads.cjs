"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("team_notification_reads", {
      request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "team_membership_requests", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      event: { type: Sequelize.STRING(8), allowNull: false, primaryKey: true },
      read_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("team_notification_reads");
  },
};
