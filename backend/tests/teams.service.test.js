import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";

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
    const teamData = { name: "Los Halcones", captainId: 1 };
    const createdTeam = { id: 201, ...teamData };
    Team.create.mockResolvedValue(createdTeam);
    TeamMember.create.mockResolvedValue({ id: 401 });

    await expect(createTeam(teamData)).resolves.toBe(createdTeam);
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(Team.create).toHaveBeenCalledWith(teamData, {
      transaction: "transaction",
    });
    expect(TeamMember.create).toHaveBeenCalledWith(
      { teamId: 201, userId: 1 },
      { transaction: "transaction" },
    );
  });

  it("lista los equipos mas recientes primero", async () => {
    const result = { count: 1, rows: [{ id: 201 }] };
    Team.findAndCountAll.mockResolvedValue(result);

    await expect(listTeams({ page: 2, limit: 5 })).resolves.toBe(result);
    expect(Team.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [["createdAt", "DESC"]],
      limit: 5,
      offset: 5,
    });
  });

  it("busca equipos por nombre o descripcion", async () => {
    Team.findAndCountAll.mockResolvedValue({ count: 0, rows: [] });

    await listTeams({ search: "halcones", page: 1, limit: 10 });

    const options = Team.findAndCountAll.mock.calls[0][0];
    expect(options.where[Op.or]).toEqual([
      { name: { [Op.iLike]: "%halcones%" } },
      { description: { [Op.iLike]: "%halcones%" } },
    ]);
  });

  it("busca un equipo por su clave primaria", async () => {
    const teamId = 201;
    const team = { id: teamId };
    Team.findByPk.mockResolvedValue(team);

    await expect(getTeamById(teamId)).resolves.toBe(team);
    expect(Team.findByPk).toHaveBeenCalledWith(teamId);
  });

  it("actualiza un equipo existente", async () => {
    const teamId = 201;
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
      updateTeam(201, { name: "Halcones renovados" }),
    ).resolves.toBeNull();
  });

  it("elimina un equipo existente", async () => {
    const team = {
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(0);

    await expect(deleteTeam(201)).resolves.toEqual({
      outcome: "deleted",
    });
    expect(Team.findByPk).toHaveBeenCalledWith(201);
    expect(TournamentRegistration.count).toHaveBeenCalledWith({
      where: { teamId: 201 },
    });
    expect(team.destroy).toHaveBeenCalledOnce();
  });

  it("informa cuando el equipo a eliminar no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(deleteTeam(201)).resolves.toEqual({
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

    await expect(deleteTeam(201)).resolves.toEqual({
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

    await expect(deleteTeam(201)).resolves.toEqual({
      outcome: "has_registrations",
    });
  });

  it("agrega un integrante a un equipo existente", async () => {
    const membership = {
      id: 401,
      teamId: 201,
      userId: 3,
    };
    Team.findByPk.mockResolvedValue({ id: 201 });
    TeamMember.findOne.mockResolvedValue(null);
    TeamMember.create.mockResolvedValue(membership);

    await expect(addTeamMember(201, 3)).resolves.toEqual({
      outcome: "added",
      membership,
    });
    expect(Team.findByPk).toHaveBeenCalledWith(201, {
      attributes: ["id"],
    });
    expect(TeamMember.findOne).toHaveBeenCalledWith({
      where: { teamId: 201, userId: 3 },
    });
    expect(TeamMember.create).toHaveBeenCalledWith({
      teamId: 201,
      userId: 3,
    });
  });

  it("no agrega integrantes a un equipo inexistente", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(addTeamMember(201, 3)).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
    expect(TeamMember.create).not.toHaveBeenCalled();
  });

  it("no agrega dos veces al mismo integrante", async () => {
    Team.findByPk.mockResolvedValue({ id: 201 });
    TeamMember.findOne.mockResolvedValue({ id: 401 });

    await expect(addTeamMember(201, 3)).resolves.toEqual({
      outcome: "already_member",
    });
    expect(TeamMember.create).not.toHaveBeenCalled();
  });

  it("trata una colision de unicidad como integrante duplicado", async () => {
    Team.findByPk.mockResolvedValue({ id: 201 });
    TeamMember.findOne.mockResolvedValue(null);
    const error = new Error("duplicate membership");
    error.name = "SequelizeUniqueConstraintError";
    TeamMember.create.mockRejectedValue(error);

    await expect(addTeamMember(201, 3)).resolves.toEqual({
      outcome: "already_member",
    });
  });

  it("lista los integrantes e identifica al capitan", async () => {
    const joinedAt = new Date("2026-10-12T12:00:00.000Z");
    Team.findByPk.mockResolvedValue({
      id: 201,
      captainId: 1,
    });
    TeamMember.findAll.mockResolvedValue([
      { id: 301, userId: 1, createdAt: joinedAt },
      { id: 302, userId: 2, createdAt: joinedAt },
    ]);

    await expect(listTeamMembers(201)).resolves.toEqual({
      outcome: "found",
      members: [
        {
          id: 301,
          userId: 1,
          isCaptain: true,
          joinedAt,
        },
        {
          id: 302,
          userId: 2,
          isCaptain: false,
          joinedAt,
        },
      ],
    });
    expect(Team.findByPk).toHaveBeenCalledWith(201, {
      attributes: ["id", "captainId"],
    });
    expect(TeamMember.findAll).toHaveBeenCalledWith({
      attributes: ["id", "userId", "createdAt"],
      where: { teamId: 201 },
      order: [["createdAt", "ASC"]],
      raw: true,
    });
  });

  it("no consulta integrantes cuando el equipo no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(listTeamMembers(201)).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findAll).not.toHaveBeenCalled();
  });

  it("elimina un integrante que no es el capitan", async () => {
    const membership = {
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Team.findByPk.mockResolvedValue({
      id: 201,
      captainId: 1,
    });
    TeamMember.findOne.mockResolvedValue(membership);

    await expect(removeTeamMember(201, 2)).resolves.toEqual({
      outcome: "removed",
    });
    expect(TeamMember.findOne).toHaveBeenCalledWith({
      where: { teamId: 201, userId: 2 },
    });
    expect(membership.destroy).toHaveBeenCalledOnce();
  });

  it("no permite eliminar al capitan", async () => {
    Team.findByPk.mockResolvedValue({
      id: 201,
      captainId: 1,
    });

    await expect(removeTeamMember(201, 1)).resolves.toEqual({
      outcome: "captain_cannot_be_removed",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
  });

  it("informa cuando el integrante no pertenece al equipo", async () => {
    Team.findByPk.mockResolvedValue({
      id: 201,
      captainId: 1,
    });
    TeamMember.findOne.mockResolvedValue(null);

    await expect(removeTeamMember(201, 2)).resolves.toEqual({
      outcome: "member_not_found",
    });
  });

  it("no busca al integrante cuando el equipo no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(removeTeamMember(201, 2)).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TeamMember.findOne).not.toHaveBeenCalled();
  });
});
