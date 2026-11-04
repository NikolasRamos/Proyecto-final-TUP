"use strict";

const ROLES = ["administrador", "organizador", "participante"];

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert(
      "rol",
      ROLES.map((nombre) => ({ nombre, createdAt: now, updatedAt: now })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("rol", { nombre: ROLES });
  },
};
