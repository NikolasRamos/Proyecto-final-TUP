'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Standing extends Model {
    static associate(models) {
      Standing.belongsTo(models.Tournament, { foreignKey: 'tournamentId', as: 'tournament' });
      Standing.belongsTo(models.Team, { foreignKey: 'teamId', as: 'team' });
    }
  }
  Standing.init({
    tournamentId: { type: DataTypes.INTEGER, allowNull: false },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    played: { type: DataTypes.INTEGER, defaultValue: 0 },
    won: { type: DataTypes.INTEGER, defaultValue: 0 },
    drawn: { type: DataTypes.INTEGER, defaultValue: 0 },
    lost: { type: DataTypes.INTEGER, defaultValue: 0 },
    goalsFor: { type: DataTypes.INTEGER, defaultValue: 0 },
    goalsAgainst: { type: DataTypes.INTEGER, defaultValue: 0 },
    goalDifference: { type: DataTypes.INTEGER, defaultValue: 0 },
    points: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Standing',
    tableName: 'standings'
  });
  return Standing;
};