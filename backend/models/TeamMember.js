import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class TeamMember extends Model {}

TeamMember.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
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
    modelName: "TeamMember",
    tableName: "team_members",
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["team_id", "user_id"],
        name: "team_members_team_id_user_id_unique",
      },
    ],
  },
);

export default TeamMember;
