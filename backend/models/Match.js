import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

export const MATCH_STATUSES = Object.freeze([
  "scheduled",
  "in_progress",
  "finished",
  "cancelled",
]);

class Match extends Model {}

Match.init(
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
    homeTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "home_team_id",
      validate: { isInt: true, min: 1 },
    },
    awayTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "away_team_id",
      validate: { isInt: true, min: 1 },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "scheduled",
      validate: { isIn: [MATCH_STATUSES] },
    },
    round: {
      type: DataTypes.STRING(60),
      allowNull: true,
    },
    matchDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "match_date",
      validate: { isDate: true },
    },
  },
  {
    sequelize: database,
    modelName: "Match",
    tableName: "matches",
    underscored: true,
    timestamps: true,
    validate: {
      teamsAreDifferent() {
        if (this.homeTeamId === this.awayTeamId) {
          throw new Error("Un equipo no puede jugar contra sí mismo");
        }
      },
    },
  },
);

export default Match;
