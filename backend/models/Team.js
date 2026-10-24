import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class Team extends Model {}

Team.init(
  {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 120],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      validate: {
        len: [0, 2000],
      },
    },
    captainId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "captain_id",
      validate: {
        isUUID: 4,
      },
    },
  },
  {
    sequelize: database,
    modelName: "Team",
    tableName: "teams",
    underscored: true,
    timestamps: true,
  },
);

export default Team;
