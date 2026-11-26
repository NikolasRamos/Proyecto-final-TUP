import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import { getTournamentReportData } from "../services/tournament-reports.service.js";

vi.mock("../models/Team.js", () => ({
  default: { findAll: vi.fn() },
}));

vi.mock("../models/Tournament.js", () => ({
  default: { findByPk: vi.fn() },
}));

vi.mock("../models/TournamentRegistration.js", () => ({
  default: { findAll: vi.fn() },
}));

describe("tournament reports service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("informa cuando el torneo no existe", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(getTournamentReportData(101)).resolves.toEqual({
      outcome: "not_found",
    });
    expect(TournamentRegistration.findAll).not.toHaveBeenCalled();
  });

  it("reúne el torneo y todos sus equipos activos", async () => {
    const tournament = { id: 101, name: "Torneo Apertura" };
    const registrations = [
      {
        id: 301,
        teamId: 201,
        createdAt: new Date("2026-10-30T12:00:00.000Z"),
      },
      {
        id: 302,
        teamId: 202,
        createdAt: new Date("2026-10-30T13:00:00.000Z"),
      },
    ];
    Tournament.findByPk.mockResolvedValue(tournament);
    TournamentRegistration.findAll.mockResolvedValue(registrations);
    Team.findAll.mockResolvedValue([{ id: 201, name: "Los Halcones" }]);

    const result = await getTournamentReportData(101);

    expect(Tournament.findByPk).toHaveBeenCalledWith(101, { raw: true });
    expect(TournamentRegistration.findAll).toHaveBeenCalledWith({
      attributes: ["id", "teamId", "createdAt"],
      where: { tournamentId: 101, status: "registered" },
      order: [
        ["createdAt", "ASC"],
        ["id", "ASC"],
      ],
      raw: true,
    });
    expect(Team.findAll).toHaveBeenCalledWith({
      attributes: ["id", "name"],
      where: { id: { [Op.in]: [201, 202] } },
      raw: true,
    });
    expect(result).toMatchObject({
      outcome: "found",
      report: {
        tournament,
        registrations: [
          {
            id: 301,
            team: { id: 201, name: "Los Halcones" },
          },
          {
            id: 302,
            team: { id: 202, name: null },
          },
        ],
      },
    });
    expect(result.report.generatedAt).toBeInstanceOf(Date);
  });

  it("no consulta equipos cuando no hay inscripciones activas", async () => {
    Tournament.findByPk.mockResolvedValue({ id: 101 });
    TournamentRegistration.findAll.mockResolvedValue([]);

    const result = await getTournamentReportData(101);

    expect(result).toMatchObject({
      outcome: "found",
      report: { registrations: [] },
    });
    expect(Team.findAll).not.toHaveBeenCalled();
  });
});
