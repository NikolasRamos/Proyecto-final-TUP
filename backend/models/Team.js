import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class Team extends Model {}

Team.init(
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
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
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "captain_id",
      validate: {
        isInt: true,
        min: 1,
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
