"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkUpdate(
      "tournaments",
      { modality: "groups_playoff" },
      { modality: "group_stage" },
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkUpdate(
      "tournaments",
      { modality: "group_stage" },
      { modality: "groups_playoff" },
    );
  },
};
