import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

export const REGISTRATION_STATUSES = Object.freeze(["registered", "withdrawn"]);

class TournamentRegistration extends Model {}

TournamentRegistration.init(
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
      validate: {
        isInt: true,
        min: 1,
      },
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id",
      validate: {
        isInt: true,
        min: 1,
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "registered",
      validate: {
        isIn: [REGISTRATION_STATUSES],
      },
    },
  },
  {
    sequelize: database,
    modelName: "TournamentRegistration",
    tableName: "tournament_registrations",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["tournament_id", "team_id"],
        name: "tournament_registrations_tournament_id_team_id_unique",
      },
    ],
  },
);

export default TournamentRegistration;
