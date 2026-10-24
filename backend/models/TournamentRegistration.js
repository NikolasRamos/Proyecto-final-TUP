import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

export const REGISTRATION_STATUSES = Object.freeze(["registered", "withdrawn"]);

class TournamentRegistration extends Model {}

TournamentRegistration.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tournamentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "tournament_id",
      validate: {
        isUUID: 4,
      },
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "team_id",
      validate: {
        isUUID: 4,
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
