import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

class TeamMembershipRequest extends Model {}

TeamMembershipRequest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    teamId: { type: DataTypes.INTEGER, allowNull: false },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    initiatorId: { type: DataTypes.INTEGER, allowNull: false },
    kind: {
      type: DataTypes.STRING(12),
      allowNull: false,
      validate: { isIn: [["request", "invitation"]] },
    },
    status: {
      type: DataTypes.STRING(12),
      allowNull: false,
      defaultValue: "pending",
      validate: { isIn: [["pending", "accepted", "rejected"]] },
    },
  },
  {
    sequelize: database,
    tableName: "team_membership_requests",
    underscored: true,
  },
);

export default TeamMembershipRequest;
