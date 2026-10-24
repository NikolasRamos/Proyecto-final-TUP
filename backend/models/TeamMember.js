import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class TeamMember extends Model {}

TeamMember.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    teamId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "team_id",
      validate: {
        isUUID: 4,
      },
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "user_id",
      validate: {
        isUUID: 4,
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
