import database from "../config/database.js";
import Role from "./role.js";
import User from "./user.js";

User.belongsTo(Role, { foreignKey: "idRol", as: "rol" });
Role.hasMany(User, { foreignKey: "idRol", as: "usuarios" });

export { database, Role, User };
