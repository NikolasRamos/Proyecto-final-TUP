import { Op } from "sequelize";
import { beforeEach, describe, expect, it, vi } from "vitest";

import database from "../config/database.js";
import Team from "../models/Team.js";
import Tournament from "../models/Tournament.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "../services/registrations.service.js";

const { transaction } = vi.hoisted(() => ({
  transaction: {
    LOCK: { UPDATE: "UPDATE" },
  },
}));

vi.mock("../config/database.js", () => ({
  default: {
    transaction: vi.fn(async (callback) => callback(transaction)),
  },
}));

vi.mock("../models/Team.js", () => ({
  default: {
    findAll: vi.fn(),
    findByPk: vi.fn(),
  },
}));

vi.mock("../models/Tournament.js", () => ({
  default: {
    findByPk: vi.fn(),
  },
}));

vi.mock("../models/TournamentRegistration.js", () => ({
  default: {
    count: vi.fn(),
    create: vi.fn(),
    findAndCountAll: vi.fn(),
    findOne: vi.fn(),
  },
}));

describe("registrations service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inscribe un equipo cuando el torneo esta abierto y tiene cupo", async () => {
    const registration = { id: "registration-id" };
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 8,
    });
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TournamentRegistration.findOne.mockResolvedValue(null);
    TournamentRegistration.count.mockResolvedValue(3);
    TournamentRegistration.create.mockResolvedValue(registration);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "registered", registration });
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(Tournament.findByPk).toHaveBeenCalledWith("tournament-id", {
      transaction,
      lock: "UPDATE",
    });
    expect(Team.findByPk).toHaveBeenCalledWith("team-id", {
      attributes: ["id"],
      transaction,
    });
    expect(TournamentRegistration.count).toHaveBeenCalledWith({
      where: { tournamentId: "tournament-id", status: "registered" },
      transaction,
    });
    expect(TournamentRegistration.create).toHaveBeenCalledWith(
      { tournamentId: "tournament-id", teamId: "team-id" },
      { transaction },
    );
  });

  it("informa cuando el torneo no existe", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "tournament_not_found" });
    expect(Team.findByPk).not.toHaveBeenCalled();
  });

  it("rechaza inscripciones si el torneo no esta abierto", async () => {
    Tournament.findByPk.mockResolvedValue({
      status: "draft",
      maxParticipants: 8,
    });

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "tournament_not_open" });
    expect(Team.findByPk).not.toHaveBeenCalled();
  });

  it("informa cuando el equipo no existe", async () => {
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 8,
    });
    Team.findByPk.mockResolvedValue(null);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "team_not_found" });
    expect(TournamentRegistration.findOne).not.toHaveBeenCalled();
  });

  it("rechaza una inscripcion duplicada", async () => {
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 8,
    });
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TournamentRegistration.findOne.mockResolvedValue({
      id: "registration-id",
      status: "registered",
    });

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "already_registered" });
    expect(TournamentRegistration.count).not.toHaveBeenCalled();
  });

  it("rechaza la inscripcion cuando el torneo esta completo", async () => {
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 4,
    });
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TournamentRegistration.findOne.mockResolvedValue(null);
    TournamentRegistration.count.mockResolvedValue(4);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "tournament_full" });
    expect(TournamentRegistration.create).not.toHaveBeenCalled();
  });

  it("trata una colision de unicidad como inscripcion duplicada", async () => {
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 8,
    });
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TournamentRegistration.findOne.mockResolvedValue(null);
    TournamentRegistration.count.mockResolvedValue(0);
    const error = new Error("duplicate registration");
    error.name = "SequelizeUniqueConstraintError";
    TournamentRegistration.create.mockRejectedValue(error);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "already_registered" });
  });

  it("reactiva una inscripcion retirada si todavia hay cupo", async () => {
    const reactivatedRegistration = {
      id: "registration-id",
      status: "registered",
    };
    const existingRegistration = {
      status: "withdrawn",
      update: vi.fn().mockResolvedValue(reactivatedRegistration),
    };
    Tournament.findByPk.mockResolvedValue({
      status: "open",
      maxParticipants: 8,
    });
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TournamentRegistration.findOne.mockResolvedValue(existingRegistration);
    TournamentRegistration.count.mockResolvedValue(2);

    await expect(
      registerTeamInTournament("tournament-id", "team-id"),
    ).resolves.toEqual({
      outcome: "registered",
      registration: reactivatedRegistration,
    });
    expect(existingRegistration.update).toHaveBeenCalledWith(
      { status: "registered" },
      { transaction },
    );
    expect(TournamentRegistration.create).not.toHaveBeenCalled();
  });

  it("retira un equipo de un torneo abierto", async () => {
    const withdrawnRegistration = {
      id: "registration-id",
      status: "withdrawn",
    };
    const registration = {
      status: "registered",
      update: vi.fn().mockResolvedValue(withdrawnRegistration),
    };
    Tournament.findByPk.mockResolvedValue({
      id: "tournament-id",
      status: "open",
    });
    TournamentRegistration.findOne.mockResolvedValue(registration);

    await expect(
      withdrawTeamFromTournament("tournament-id", "team-id"),
    ).resolves.toEqual({
      outcome: "withdrawn",
      registration: withdrawnRegistration,
    });
    expect(Tournament.findByPk).toHaveBeenCalledWith("tournament-id", {
      attributes: ["id", "status"],
      transaction,
      lock: "UPDATE",
    });
    expect(registration.update).toHaveBeenCalledWith(
      { status: "withdrawn" },
      { transaction },
    );
  });

  it("no retira equipos de un torneo que no esta abierto", async () => {
    Tournament.findByPk.mockResolvedValue({
      id: "tournament-id",
      status: "in_progress",
    });

    await expect(
      withdrawTeamFromTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "tournament_not_open" });
    expect(TournamentRegistration.findOne).not.toHaveBeenCalled();
  });

  it("informa cuando el torneo no existe al retirar un equipo", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(
      withdrawTeamFromTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "tournament_not_found" });
  });

  it("informa cuando la inscripcion no existe", async () => {
    Tournament.findByPk.mockResolvedValue({
      id: "tournament-id",
      status: "open",
    });
    TournamentRegistration.findOne.mockResolvedValue(null);

    await expect(
      withdrawTeamFromTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "registration_not_found" });
  });

  it("informa cuando el equipo ya fue retirado", async () => {
    Tournament.findByPk.mockResolvedValue({
      id: "tournament-id",
      status: "open",
    });
    TournamentRegistration.findOne.mockResolvedValue({ status: "withdrawn" });

    await expect(
      withdrawTeamFromTournament("tournament-id", "team-id"),
    ).resolves.toEqual({ outcome: "already_withdrawn" });
  });

  it("lista las inscripciones con los datos basicos del equipo", async () => {
    const registeredAt = new Date("2026-10-12T12:00:00.000Z");
    const updatedAt = new Date("2026-10-12T13:00:00.000Z");
    Tournament.findByPk.mockResolvedValue({ id: "tournament-id" });
    TournamentRegistration.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [
        {
          id: "registration-id",
          teamId: "team-id",
          status: "registered",
          createdAt: registeredAt,
          updatedAt,
        },
      ],
    });
    Team.findAll.mockResolvedValue([{ id: "team-id", name: "Los Halcones" }]);

    await expect(
      listTournamentRegistrations("tournament-id", {
        status: "registered",
        page: 2,
        limit: 5,
      }),
    ).resolves.toEqual({
      outcome: "found",
      count: 1,
      registrations: [
        {
          id: "registration-id",
          status: "registered",
          registeredAt,
          updatedAt,
          team: { id: "team-id", name: "Los Halcones" },
        },
      ],
    });
    expect(TournamentRegistration.findAndCountAll).toHaveBeenCalledWith({
      attributes: ["id", "teamId", "status", "createdAt", "updatedAt"],
      where: { tournamentId: "tournament-id", status: "registered" },
      order: [["createdAt", "ASC"]],
      limit: 5,
      offset: 5,
      raw: true,
    });
    expect(Team.findAll).toHaveBeenCalledWith({
      attributes: ["id", "name"],
      where: { id: { [Op.in]: ["team-id"] } },
      raw: true,
    });
  });

  it("devuelve una lista vacia sin consultar equipos", async () => {
    Tournament.findByPk.mockResolvedValue({ id: "tournament-id" });
    TournamentRegistration.findAndCountAll.mockResolvedValue({
      count: 0,
      rows: [],
    });

    await expect(
      listTournamentRegistrations("tournament-id", {
        status: "withdrawn",
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({
      outcome: "found",
      count: 0,
      registrations: [],
    });
    expect(Team.findAll).not.toHaveBeenCalled();
  });

  it("no consulta inscripciones cuando el torneo no existe", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(
      listTournamentRegistrations("tournament-id", {
        status: "registered",
        page: 1,
        limit: 10,
      }),
    ).resolves.toEqual({ outcome: "tournament_not_found" });
    expect(TournamentRegistration.findAndCountAll).not.toHaveBeenCalled();
  });
});
