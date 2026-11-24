import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

export const TOURNAMENT_MODALITIES = Object.freeze([
  "league",
  "single_elimination",
  "groups_playoff",
  "swiss",
  "free_for_all",
  "gauntlet",
]);

export const TOURNAMENT_MODALITY_LABELS = Object.freeze({
  league: "Liga",
  single_elimination: "Eliminacion simple",
  groups_playoff: "Grupos + Playoff",
  swiss: "Suizo",
  free_for_all: "Free-for-all",
  gauntlet: "Gauntlet",
});

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
    playoffSpots: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: "playoff_spots",
      validate: {
        isInt: true,
        min: 2,
      },
    },
    groupCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: "group_count",
      validate: {
        isInt: true,
        min: 2,
      },
    },
    maxParticipantsPerGroup: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: "max_participants_per_group",
      validate: {
        isInt: true,
        min: 2,
      },
    },
    swissRounds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      field: "swiss_rounds",
      validate: {
        isInt: true,
        min: 1,
      },
    },
    isTeamTournament: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: "is_team_tournament",
    },
    minTeamMembers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "min_team_members",
      validate: {
        isInt: true,
        min: 2,
      },
    },
    maxTeamMembers: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "max_team_members",
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
      participationRulesAreConsistent() {
        const hasMinimum =
          this.minTeamMembers !== null && this.minTeamMembers !== undefined;
        const hasMaximum =
          this.maxTeamMembers !== null && this.maxTeamMembers !== undefined;

        if (!this.isTeamTournament && (hasMinimum || hasMaximum)) {
          throw new Error(
            "Un torneo individual no puede definir limites de equipo",
          );
        }

        if (this.isTeamTournament && hasMinimum !== hasMaximum) {
          throw new Error(
            "Los limites minimo y maximo del equipo deben definirse juntos",
          );
        }

        if (
          this.isTeamTournament &&
          hasMinimum &&
          this.maxTeamMembers < this.minTeamMembers
        ) {
          throw new Error(
            "El maximo de integrantes no puede ser menor que el minimo",
          );
        }
      },
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
