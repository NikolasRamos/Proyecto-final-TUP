"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.addColumn(
        "team_members",
        "account_linked",
        {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        { transaction },
      );
      await queryInterface.sequelize.query(
        `
        UPDATE team_members AS member SET account_linked = TRUE
        FROM teams AS team
        WHERE member.team_id = team.id AND member.user_id = team.captain_account_id
      `,
        { transaction },
      );

      await queryInterface.createTable(
        "team_membership_requests",
        {
          id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false,
          },
          team_id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: "teams", key: "id" },
            onDelete: "CASCADE",
          },
          user_id: { type: Sequelize.INTEGER, allowNull: false },
          initiator_id: { type: Sequelize.INTEGER, allowNull: false },
          kind: { type: Sequelize.STRING(12), allowNull: false },
          status: {
            type: Sequelize.STRING(12),
            allowNull: false,
            defaultValue: "pending",
          },
          created_at: { type: Sequelize.DATE, allowNull: false },
          updated_at: { type: Sequelize.DATE, allowNull: false },
        },
        { transaction },
      );
      await queryInterface.addIndex(
        "team_membership_requests",
        ["team_id", "user_id"],
        {
          name: "team_membership_requests_one_pending",
          unique: true,
          where: { status: "pending" },
          transaction,
        },
      );
      await queryInterface.addIndex("team_membership_requests", ["user_id"], {
        transaction,
      });
      await queryInterface.addIndex(
        "team_membership_requests",
        ["initiator_id"],
        { transaction },
      );
    });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.dropTable("team_membership_requests", {
        transaction,
      });
      await queryInterface.removeColumn("team_members", "account_linked", {
        transaction,
      });
    });
  },
};
