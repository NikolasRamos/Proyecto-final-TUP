import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

const nonNegativeInteger = {
  isInt: true,
  min: 0,
};

class Standing extends Model {}

Standing.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    tournamentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "tournament_id",
      validate: { isInt: true, min: 1 },
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id",
      validate: { isInt: true, min: 1 },
    },
    played: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: nonNegativeInteger,
    },
    won: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: nonNegativeInteger,
    },
    drawn: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: nonNegativeInteger,
    },
    lost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: nonNegativeInteger,
    },
    goalsFor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "goals_for",
      validate: nonNegativeInteger,
    },
    goalsAgainst: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "goals_against",
      validate: nonNegativeInteger,
    },
    goalDifference: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: "goal_difference",
      validate: { isInt: true },
    },
    points: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: nonNegativeInteger,
    },
  },
  {
    sequelize: database,
    modelName: "Standing",
    tableName: "standings",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tournament_id", "team_id"],
        name: "standings_tournament_id_team_id_unique",
      },
    ],
  },
);

export default Standing;
