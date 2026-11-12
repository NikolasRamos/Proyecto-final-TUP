import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class TournamentRegistrationMember extends Model {}

TournamentRegistrationMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "registration_id",
      references: {
        model: "tournament_registrations",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
      validate: {
        isInt: true,
        min: 1,
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "user_id",
      validate: {
        isInt: true,
        min: 1,
      },
    },
  },
  {
    sequelize: database,
    modelName: "TournamentRegistrationMember",
    tableName: "tournament_registration_members",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["registration_id", "user_id"],
        name: "tournament_registration_members_registration_user_unique",
      },
    ],
  },
);

export default TournamentRegistrationMember;
