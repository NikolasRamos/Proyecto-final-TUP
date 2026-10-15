import bcrypt from "bcrypt";
import { DataTypes, Model } from "sequelize";

import database from "../config/database.js";

const SALT_ROUNDS = 10;

export class User extends Model {
  async validPassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }
}

User.init(
  {
    idUsuario: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "El nombre es obligatorio" },
        len: {
          args: [2, 100],
          msg: "El nombre debe tener entre 2 y 100 caracteres",
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: "El email es obligatorio" },
        isEmail: { msg: "El email no tiene un formato válido" },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "La contraseña es obligatoria" },
        len: {
          args: [8, 100],
          msg: "La contraseña debe tener al menos 8 caracteres",
        },
      },
    },
    idRol: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "El rol es obligatorio" },
      },
    },
  },
  {
    sequelize: database,
    modelName: "User",
    tableName: "usuario",
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
      },
      beforeUpdate: async (user) => {
        if (user.changed("password")) {
          user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
        }
      },
    },
  },
);

export default User;
