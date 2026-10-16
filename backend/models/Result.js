'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Result extends Model {
    static associate(models) {
      Result.belongsTo(models.Match, { foreignKey: 'matchId', as: 'match' });
    }
  }
  Result.init({
    matchId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    homeScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    awayScore: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }
  }, {
    sequelize,
    modelName: 'Result',
    tableName: 'results'
  });
  return Result;
};