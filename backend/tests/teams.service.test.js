import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";

import database from "../config/database.js";
import Team from "../models/Team.js";
import TeamMember from "../models/TeamMember.js";
import TournamentRegistration from "../models/TournamentRegistration.js";
import User from "../models/user.js";
import {
  addTeamMember,
  assignTeamCaptain,
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
    transaction: vi.fn(async (callback) =>
      callback({ LOCK: { SHARE: "SHARE", UPDATE: "UPDATE" } }),
    ),
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
    findOrCreate: vi.fn(),
  },
}));

vi.mock("../models/user.js", () => ({
  default: { findAll: vi.fn(), findByPk: vi.fn() },
}));

vi.mock("../models/TournamentRegistration.js", () => ({
  default: {
    count: vi.fn(),
  },
}));

describe("teams service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    User.findAll.mockResolvedValue([]);
  });

  it("delega la creacion al modelo", async () => {
    const teamData = { name: "Los Halcones", captainId: 1 };
    const createdTeam = { id: 201, ...teamData };
    User.findByPk.mockResolvedValue({ idUsuario: 1 });
    Team.create.mockResolvedValue(createdTeam);
    TeamMember.create.mockResolvedValue({ id: 401 });

    await expect(createTeam(teamData)).resolves.toBe(createdTeam);
    expect(database.transaction).toHaveBeenCalledOnce();
    expect(Team.create).toHaveBeenCalledWith(
      { ...teamData, captainAccountId: 1 },
      { transaction: expect.any(Object) },
    );
    expect(TeamMember.create).toHaveBeenCalledWith(
      { teamId: 201, userId: 1, accountLinked: true },
      { transaction: expect.any(Object) },
    );
  });

  it("devuelve el nombre del capitán al crear un equipo", async () => {
    const teamData = { name: "Los Halcones", captainId: 1 };
    const createdTeam = { id: 201, ...teamData };
    User.findByPk.mockResolvedValue({ idUsuario: 1, nombre: "Niko" });
    Team.create.mockResolvedValue(createdTeam);
    TeamMember.create.mockResolvedValue({ id: 401 });

    const team = await createTeam(teamData);

    expect(team.captainName).toBe("Niko");
  });

  it("vincula al capitán y asegura su membresía en la misma transacción", async () => {
    const team = { update: vi.fn() };
    Team.findByPk.mockResolvedValue(team);
    User.findByPk.mockResolvedValue({ idUsuario: 7 });
    TeamMember.findOrCreate.mockResolvedValue([{ accountLinked: true }]);

    await expect(assignTeamCaptain(201, 7)).resolves.toEqual({
      outcome: "assigned",
      team,
    });
    const { transaction } = Team.findByPk.mock.calls[0][1];
    expect(Team.findByPk).toHaveBeenCalledWith(201, {
      transaction,
      lock: "UPDATE",
    });
    expect(TeamMember.findOrCreate).toHaveBeenCalledWith({
      where: { teamId: 201, userId: 7 },
      defaults: { accountLinked: true },
      transaction,
    });
    expect(team.update).toHaveBeenCalledWith(
      { captainId: 7, captainAccountId: 7 },
      { transaction },
    );
  });

  it("rechaza la asignación si la cuenta no está activa", async () => {
    const team = { update: vi.fn() };
    Team.findByPk.mockResolvedValue(team);
    User.findByPk.mockResolvedValue(null);

    await expect(assignTeamCaptain(201, 7)).resolves.toEqual({
      outcome: "captain_not_found",
    });
    expect(TeamMember.findOrCreate).not.toHaveBeenCalled();
    expect(team.update).not.toHaveBeenCalled();
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

  it("incluye el nombre del capitán en el listado", async () => {
    Team.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 201, captainAccountId: 7 }],
    });
    User.findAll.mockResolvedValue([{ idUsuario: 7, nombre: "Niko" }]);

    const result = await listTeams({ page: 1, limit: 10 });

    expect(User.findAll).toHaveBeenCalledWith({
      attributes: ["idUsuario", "nombre"],
      where: { idUsuario: { [Op.in]: [7] } },
      raw: true,
    });
    expect(result.rows[0].captainName).toBe("Niko");
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

  it.each([
    { userId: 1, role: "participante" },
    { userId: 1, role: "organizador" },
    { userId: 2, role: "administrador" },
  ])("elimina un equipo con permiso del actor $role", async (actor) => {
    const team = {
      captainId: 1,
      captainAccountId: 1,
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(0);

    await expect(deleteTeam(201, actor)).resolves.toEqual({
      outcome: "deleted",
    });
    expect(Team.findByPk).toHaveBeenCalledWith(201, {
      transaction: expect.any(Object),
      lock: "UPDATE",
    });
    expect(TournamentRegistration.count).toHaveBeenCalledWith({
      where: { teamId: 201 },
      transaction: expect.any(Object),
    });
    expect(team.destroy).toHaveBeenCalledOnce();
  });

  it.each(["organizador", "participante"])(
    "deniega el borrado si el %s no es capitán",
    async (role) => {
      const team = { captainId: 1, captainAccountId: 1, destroy: vi.fn() };
      Team.findByPk.mockResolvedValue(team);

      await expect(deleteTeam(201, { userId: 2, role })).resolves.toEqual({
        outcome: "forbidden",
      });
      expect(TournamentRegistration.count).not.toHaveBeenCalled();
      expect(team.destroy).not.toHaveBeenCalled();
    },
  );

  it("un ID de capitán de demostración no concede permiso de borrado", async () => {
    const team = { captainId: 1, captainAccountId: null, destroy: vi.fn() };
    Team.findByPk.mockResolvedValue(team);

    await expect(
      deleteTeam(201, { userId: 1, role: "participante" }),
    ).resolves.toEqual({ outcome: "forbidden" });
    expect(team.destroy).not.toHaveBeenCalled();
  });

  it("informa cuando el equipo a eliminar no existe", async () => {
    Team.findByPk.mockResolvedValue(null);

    await expect(
      deleteTeam(201, { userId: 1, role: "participante" }),
    ).resolves.toEqual({
      outcome: "team_not_found",
    });
    expect(TournamentRegistration.count).not.toHaveBeenCalled();
  });

  it("no elimina un equipo que tiene historial de inscripciones", async () => {
    const team = {
      captainId: 1,
      captainAccountId: 1,
      destroy: vi.fn(),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(1);

    await expect(
      deleteTeam(201, { userId: 1, role: "participante" }),
    ).resolves.toEqual({
      outcome: "has_registrations",
    });
    expect(team.destroy).not.toHaveBeenCalled();
  });

  it("trata una restriccion simultanea como historial de inscripciones", async () => {
    const error = new Error("foreign key violation");
    error.name = "SequelizeForeignKeyConstraintError";
    const team = {
      captainId: 1,
      captainAccountId: 1,
      destroy: vi.fn().mockRejectedValue(error),
    };
    Team.findByPk.mockResolvedValue(team);
    TournamentRegistration.count.mockResolvedValue(0);

    await expect(
      deleteTeam(201, { userId: 1, role: "participante" }),
    ).resolves.toEqual({
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
      transaction: expect.any(Object),
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
