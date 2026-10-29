import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

export const TOURNAMENT_MODALITIES = Object.freeze([
  "league",
  "single_elimination",
  "group_stage",
]);

export const TOURNAMENT_STATUSES = Object.freeze([
  "draft",
  "open",
  "in_progress",
  "finished",
  "cancelled",
]);

class Tournament extends Model {}

Tournament.init(
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
    modality: {
      type: DataTypes.STRING(30),
      allowNull: false,
      validate: {
        isIn: [TOURNAMENT_MODALITIES],
      },
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "max_participants",
      validate: {
        isInt: true,
        min: 2,
      },
    },
    registrationDeadline: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "registration_deadline",
      validate: {
        isDate: true,
      },
    },
    startDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "start_date",
      validate: {
        isDate: true,
      },
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "end_date",
      validate: {
        isDate: true,
      },
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "draft",
      validate: {
        isIn: [TOURNAMENT_STATUSES],
      },
    },
    organizerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "organizer_id",
      validate: {
        isInt: true,
        min: 1,
      },
    },
  },
  {
    sequelize: database,
    modelName: "Tournament",
    tableName: "tournaments",
    underscored: true,
    timestamps: true,
    validate: {
      datesAreConsistent() {
        if (
          this.registrationDeadline &&
          this.startDate &&
          this.registrationDeadline > this.startDate
        ) {
          throw new Error(
            "La fecha limite de inscripcion no puede ser posterior al inicio",
          );
        }

        if (this.startDate && this.endDate && this.startDate > this.endDate) {
          throw new Error(
            "La fecha de finalizacion no puede ser anterior al inicio",
          );
        }
      },
    },
  },
);

export default Tournament;
