'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Match extends Model {
    static associate(models) {
      Match.belongsTo(models.Tournament, { foreignKey: 'tournamentId', as: 'tournament' });
      Match.belongsTo(models.Team, { foreignKey: 'homeTeamId', as: 'homeTeam' });
      Match.belongsTo(models.Team, { foreignKey: 'awayTeamId', as: 'awayTeam' });
      Match.hasOne(models.Result, { foreignKey: 'matchId', as: 'result' });
    }
  }
  Match.init({
    tournamentId: { type: DataTypes.INTEGER, allowNull: false },
    homeTeamId: { type: DataTypes.INTEGER, allowNull: false },
    awayTeamId: { type: DataTypes.INTEGER, allowNull: false },
    status: { type: DataTypes.ENUM('scheduled', 'in_progress', 'finished', 'cancelled'), defaultValue: 'scheduled' },
    round: { type: DataTypes.STRING, allowNull: true },
    matchDate: { type: DataTypes.DATE, allowNull: true }
  }, {
    sequelize,
    modelName: 'Match',
    tableName: 'matches'
  });
  return Match;
};