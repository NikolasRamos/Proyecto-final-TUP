'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('standings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tournamentId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'tournaments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      teamId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'teams', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      played: { type: Sequelize.INTEGER, defaultValue: 0 },
      won: { type: Sequelize.INTEGER, defaultValue: 0 },
      drawn: { type: Sequelize.INTEGER, defaultValue: 0 },
      lost: { type: Sequelize.INTEGER, defaultValue: 0 },
      goalsFor: { type: Sequelize.INTEGER, defaultValue: 0 },
      goalsAgainst: { type: Sequelize.INTEGER, defaultValue: 0 },
      goalDifference: { type: Sequelize.INTEGER, defaultValue: 0 },
      points: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('standings');
  }
};