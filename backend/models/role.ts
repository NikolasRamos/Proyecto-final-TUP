import { DataTypes, Model } from "sequelize";
import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";

import database from "../config/database.js";

export class Role extends Model<InferAttributes<Role>, InferCreationAttributes<Role>> {
  declare idRol: CreationOptional<number>;
  declare nombre: string;
}

Role.init(
  {
    idRol: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El nombre del rol es obligatorio" },
      },
    },
  },
  {
    sequelize: database,
    modelName: "Role",
    tableName: "rol",
    timestamps: true,
  },
);

export default Role;
