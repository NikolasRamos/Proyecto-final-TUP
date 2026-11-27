"use strict";

const ROLES = ["administrador", "organizador", "participante"];

async function ensureRoles(queryInterface, transaction) {
  const now = new Date();
  await queryInterface.bulkInsert(
    "rol",
    ROLES.map((nombre) => ({ nombre, createdAt: now, updatedAt: now })),
    { ignoreDuplicates: true, transaction },
  );
}

module.exports = {
  ensureRoles,
  up: (queryInterface) => ensureRoles(queryInterface),

  async down(queryInterface) {
    await queryInterface.bulkDelete("rol", { nombre: ROLES });
  },
};
