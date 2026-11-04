"use strict";

const bcrypt = require("bcrypt");

const SALT_ROUNDS = 10;
const PASSWORD = "Password123";

const USERS = [
  { nombre: "Administrador", email: "admin@torneos.test", rol: "administrador" },
  {
    nombre: "Organizador",
    email: "organizador@torneos.test",
    rol: "organizador",
  },
  {
    nombre: "Participante Uno",
    email: "participante1@torneos.test",
    rol: "participante",
  },
  {
    nombre: "Participante Dos",
    email: "participante2@torneos.test",
    rol: "participante",
  },
];

module.exports = {
  async up(queryInterface) {
    const [roles] = await queryInterface.sequelize.query(
      'SELECT "idRol", "nombre" FROM "rol";',
    );

    const idPorRol = new Map(roles.map(({ idRol, nombre }) => [nombre, idRol]));

    const password = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
    const now = new Date();

    await queryInterface.bulkInsert(
      "usuario",
      USERS.map(({ nombre, email, rol }) => {
        const idRol = idPorRol.get(rol);

        if (!idRol) {
          throw new Error(
            `No existe el rol "${rol}". Ejecutá primero el seeder de roles.`,
          );
        }

        return { nombre, email, password, idRol, createdAt: now, updatedAt: now };
      }),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("usuario", {
      email: USERS.map((user) => user.email),
    });
  },
};
