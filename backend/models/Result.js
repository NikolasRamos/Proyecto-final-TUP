import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class Result extends Model {}

Result.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    matchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      field: "match_id",
      validate: { isInt: true, min: 1 },
    },
    homeScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "home_score",
      validate: { isInt: true, min: 0 },
    },
    awayScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "away_score",
      validate: { isInt: true, min: 0 },
    },
  },
  {
    sequelize: database,
    modelName: "Result",
    tableName: "results",
    underscored: true,
    timestamps: true,
  },
);

export default Result;
