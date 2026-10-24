"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("team_members", {
      id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: Sequelize.literal("gen_random_uuid()"),
      },
      team_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
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

    await queryInterface.addIndex("team_members", ["team_id", "user_id"], {
      unique: true,
      name: "team_members_team_id_user_id_unique",
    });
    await queryInterface.addIndex("team_members", ["user_id"]);

    await queryInterface.sequelize.query(`
      INSERT INTO team_members (id, team_id, user_id, created_at, updated_at)
      SELECT gen_random_uuid(), id, captain_id, NOW(), NOW()
      FROM teams
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("team_members");
  },
};
