import { beforeEach, describe, expect, it, vi } from "vitest";

import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import {
  addTeamMember,
  createTeam,
  deleteTeam,
  getTeamById,
  listTeamMembers,
  listTeams,
  removeTeamMember,
  updateTeam,
} from "../services/teams.service.js";

vi.mock("../config/database.js", () => ({
  default: {
    transaction: vi.fn(async (callback) => callback("transaction")),
  },
}));

vi.mock("../models/Team.js", () => ({
  default: {
    create: vi.fn(),
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
  },
}));

vi.mock("../models/TeamMember.js", () => ({
  default: {
    create: vi.fn(),
    findAll: vi.fn(),
    findOne: vi.fn(),
  },
}));

vi.mock("../models/TournamentRegistration.js", () => ({
  default: {
    count: vi.fn(),
  },
}));

describe("teams service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delega la creacion al modelo", async () => {
    const teamData = { name: "Los Halcones", captainId: "captain-id" };
    const createdTeam = { id: "team-id", ...teamData };
    Team.create.mockResolvedValue(createdTeam);
    TeamMember.create.mockResolvedValue({ id: "membership-id" });

    await expect(createTeam(teamData)).resolves.toBe(createdTeam);
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(Team.create).toHaveBeenCalledWith(teamData, {
      transaction: "transaction",
    });
    expect(TeamMember.create).toHaveBeenCalledWith(
      { teamId: "team-id", userId: "captain-id" },
      { transaction: "transaction" },
    );
  });

  it("lista los equipos mas recientes primero", async () => {
    const result = { count: 1, rows: [{ id: "team-id" }] };
    Team.findAndCountAll.mockResolvedValue(result);

    await expect(listTeams({ page: 2, limit: 5 })).resolves.toBe(result);
    expect(Team.findAndCountAll).toHaveBeenCalledWith({
      order: [["createdAt", "DESC"]],
      limit: 5,
      offset: 5,
    });
  });

  it("busca un equipo por su clave primaria", async () => {
    const teamId = "team-id";
    const team = { id: teamId };
    Team.findByPk.mockResolvedValue(team);

    await expect(getTeamById(teamId)).resolves.toBe(team);
    expect(Team.findByPk).toHaveBeenCalledWith(teamId);
  });

  it("actualiza un equipo existente", async () => {
    const teamId = "team-id";
    const teamData = { name: "Halcones renovados" };
    const updatedTeam = { id: teamId, ...teamData };
    const team = {
      update: vi.fn().mockResolvedValue(updatedTeam),
    };
    Team.findByPk.mockResolvedValue(team);

    await expect(updateTeam(teamId, teamData)).resolves.toBe(updatedTeam);
    expect(Team.findByPk).toHaveBeenCalledWith(teamId);
    expect(team.update).toHaveBeenCalledWith(teamData);
  });

  it("no intenta actualizar un equipo inexistente", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(
      updateTeam("team-id", { name: "Halcones renovados" }),
    ).resolves.toBeNull();
  });

  it("elimina un equipo existente", async () => {
    const team = {
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(0);

    await expect(deleteTeam("team-id")).resolves.toEqual({
      outcome: "deleted",
    });
    expect(Team.findByPk).toHaveBeenCalledWith("team-id");
    expect(TournamentRegistration.count).toHaveBeenCalledWith({
      where: { teamId: "team-id" },
    });
    expect(team.destroy).toHaveBeenCalledOnce();
  });

  it("informa cuando el equipo a eliminar no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(deleteTeam("team-id")).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TournamentRegistration.count).not.toHaveBeenCalled();
  });

  it("no elimina un equipo que tiene historial de inscripciones", async () => {
    const team = {
      destroy: vi.fn(),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(1);

    await expect(deleteTeam("team-id")).resolves.toEqual({
      outcome: "has_registrations",
    });
    expect(team.destroy).not.toHaveBeenCalled();
  });

  it("trata una restriccion simultanea como historial de inscripciones", async () => {
    const error = new Error("foreign key violation");
    error.name = "SequelizeForeignKeyConstraintError";
    const team = {
      destroy: vi.fn().mockRejectedValue(error),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(0);

    await expect(deleteTeam("team-id")).resolves.toEqual({
      outcome: "has_registrations",
    });
  });

  it("agrega un integrante a un equipo existente", async () => {
    const membership = {
      id: "membership-id",
      teamId: "team-id",
      userId: "user-id",
    };
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TeamMember.findOne.mockResolvedValue(null);
    TeamMember.create.mockResolvedValue(membership);

    await expect(addTeamMember("team-id", "user-id")).resolves.toEqual({
      outcome: "added",
      membership,
    });
    expect(Team.findByPk).toHaveBeenCalledWith("team-id", {
      attributes: ["id"],
    });
    expect(TeamMember.findOne).toHaveBeenCalledWith({
      where: { teamId: "team-id", userId: "user-id" },
    });
    expect(TeamMember.create).toHaveBeenCalledWith({
      teamId: "team-id",
      userId: "user-id",
    });
  });

  it("no agrega integrantes a un equipo inexistente", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(addTeamMember("team-id", "user-id")).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
    expect(TeamMember.create).not.toHaveBeenCalled();
  });

  it("no agrega dos veces al mismo integrante", async () => {
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TeamMember.findOne.mockResolvedValue({ id: "membership-id" });

    await expect(addTeamMember("team-id", "user-id")).resolves.toEqual({
      outcome: "already_member",
    });
    expect(TeamMember.create).not.toHaveBeenCalled();
  });

  it("trata una colision de unicidad como integrante duplicado", async () => {
    Team.findByPk.mockResolvedValue({ id: "team-id" });
    TeamMember.findOne.mockResolvedValue(null);
    const error = new Error("duplicate membership");
    error.name = "SequelizeUniqueConstraintError";
    TeamMember.create.mockRejectedValue(error);

    await expect(addTeamMember("team-id", "user-id")).resolves.toEqual({
      outcome: "already_member",
    });
  });

  it("lista los integrantes e identifica al capitan", async () => {
    const joinedAt = new Date("2026-10-12T12:00:00.000Z");
    Team.findByPk.mockResolvedValue({
      id: "team-id",
      captainId: "captain-id",
    });
    TeamMember.findAll.mockResolvedValue([
      { id: "membership-1", userId: "captain-id", createdAt: joinedAt },
      { id: "membership-2", userId: "player-id", createdAt: joinedAt },
    ]);

    await expect(listTeamMembers("team-id")).resolves.toEqual({
      outcome: "found",
      members: [
        {
          id: "membership-1",
          userId: "captain-id",
          isCaptain: true,
          joinedAt,
        },
        {
          id: "membership-2",
          userId: "player-id",
          isCaptain: false,
          joinedAt,
        },
      ],
    });
    expect(Team.findByPk).toHaveBeenCalledWith("team-id", {
      attributes: ["id", "captainId"],
    });
    expect(TeamMember.findAll).toHaveBeenCalledWith({
      attributes: ["id", "userId", "createdAt"],
      where: { teamId: "team-id" },
      order: [["createdAt", "ASC"]],
      raw: true,
    });
  });

  it("no consulta integrantes cuando el equipo no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(listTeamMembers("team-id")).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findAll).not.toHaveBeenCalled();
  });

  it("elimina un integrante que no es el capitan", async () => {
    const membership = {
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Team.findByPk.mockResolvedValue({
      id: "team-id",
      captainId: "captain-id",
    });
    TeamMember.findOne.mockResolvedValue(membership);

    await expect(removeTeamMember("team-id", "player-id")).resolves.toEqual({
      outcome: "removed",
    });
    expect(TeamMember.findOne).toHaveBeenCalledWith({
      where: { teamId: "team-id", userId: "player-id" },
    });
    expect(membership.destroy).toHaveBeenCalledOnce();
  });

  it("no permite eliminar al capitan", async () => {
    Team.findByPk.mockResolvedValue({
      id: "team-id",
      captainId: "captain-id",
    });

    await expect(removeTeamMember("team-id", "captain-id")).resolves.toEqual({
      outcome: "captain_cannot_be_removed",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
  });

  it("informa cuando el integrante no pertenece al equipo", async () => {
    Team.findByPk.mockResolvedValue({
      id: "team-id",
      captainId: "captain-id",
    });
    TeamMember.findOne.mockResolvedValue(null);

    await expect(removeTeamMember("team-id", "player-id")).resolves.toEqual({
      outcome: "member_not_found",
    });
  });

  it("no busca al integrante cuando el equipo no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(removeTeamMember("team-id", "player-id")).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
  });
});
