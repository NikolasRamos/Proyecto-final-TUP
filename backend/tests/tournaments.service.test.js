import { beforeEach, describe, expect, it, vi } from "vitest";
import { Op } from "sequelize";

import Tournament from "../models/Tournament.js";
import {
  createTournament,
  deleteTournament,
  getTournamentById,
  listTournaments,
  updateTournament,
  updateTournamentStatus,
} from "../services/tournaments.service.js";

vi.mock("../models/Tournament.js", () => ({
  default: {
    create: vi.fn(),
    findAndCountAll: vi.fn(),
    findByPk: vi.fn(),
  },
}));

describe("tournaments service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("delega la creacion al modelo", async () => {
    const tournamentData = { name: "Torneo de apertura" };
    const createdTournament = { id: "tournament-id", ...tournamentData };
    Tournament.create.mockResolvedValue(createdTournament);

    await expect(createTournament(tournamentData)).resolves.toBe(
      createdTournament,
    );
    expect(Tournament.create).toHaveBeenCalledWith(tournamentData);
  });

  it("lista los torneos mas recientes primero", async () => {
    const result = { count: 1, rows: [{ id: "tournament-id" }] };
    Tournament.findAndCountAll.mockResolvedValue(result);

    await expect(listTournaments({ page: 1, limit: 10 })).resolves.toBe(result);
    expect(Tournament.findAndCountAll).toHaveBeenCalledWith({
      where: {},
      order: [
        ["createdAt", "DESC"],
        ["id", "ASC"],
      ],
      limit: 10,
      offset: 0,
    });
  });

  it("busca, filtra, ordena y calcula el desplazamiento", async () => {
    const result = { count: 0, rows: [] };
    Tournament.findAndCountAll.mockResolvedValue(result);

    await expect(
      listTournaments({
        search: "apertura",
        status: "open",
        modality: "league",
        page: 3,
        limit: 5,
        sortBy: "name",
        order: "asc",
      }),
    ).resolves.toBe(result);
    const query = Tournament.findAndCountAll.mock.calls[0][0];

    expect(query).toEqual({
      where: {
        status: "open",
        modality: "league",
        [Op.or]: [
          { name: { [Op.iLike]: "%apertura%" } },
          { description: { [Op.iLike]: "%apertura%" } },
        ],
      },
      order: [
        ["name", "ASC"],
        ["id", "ASC"],
      ],
      limit: 5,
      offset: 10,
    });
  });

  it("busca un torneo por su clave primaria", async () => {
    const tournamentId = "tournament-id";
    const tournament = { id: tournamentId };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(getTournamentById(tournamentId)).resolves.toBe(tournament);
    expect(Tournament.findByPk).toHaveBeenCalledWith(tournamentId);
  });

  it("actualiza un torneo existente", async () => {
    const tournamentId = "tournament-id";
    const tournamentData = { name: "Torneo actualizado" };
    const updatedTournament = { id: tournamentId, ...tournamentData };
    const tournament = {
      update: vi.fn().mockResolvedValue(updatedTournament),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(updateTournament(tournamentId, tournamentData)).resolves.toBe(
      updatedTournament,
    );
    expect(Tournament.findByPk).toHaveBeenCalledWith(tournamentId);
    expect(tournament.update).toHaveBeenCalledWith(tournamentData);
  });

  it("no intenta actualizar un torneo inexistente", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(
      updateTournament("tournament-id", { name: "Torneo actualizado" }),
    ).resolves.toBeNull();
  });

  it("actualiza una transicion de estado permitida", async () => {
    const updatedTournament = { id: "tournament-id", status: "open" };
    const tournament = {
      status: "draft",
      update: vi.fn().mockResolvedValue(updatedTournament),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(
      updateTournamentStatus("tournament-id", "open"),
    ).resolves.toEqual({
      outcome: "updated",
      tournament: updatedTournament,
    });
    expect(tournament.update).toHaveBeenCalledWith({ status: "open" });
  });

  it("permite cancelar un torneo que no finalizo", async () => {
    const cancelledTournament = {
      id: "tournament-id",
      status: "cancelled",
    };
    const tournament = {
      status: "in_progress",
      update: vi.fn().mockResolvedValue(cancelledTournament),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(
      updateTournamentStatus("tournament-id", "cancelled"),
    ).resolves.toEqual({
      outcome: "updated",
      tournament: cancelledTournament,
    });
  });

  it("rechaza una transicion de estado no permitida", async () => {
    const tournament = {
      status: "finished",
      update: vi.fn(),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(
      updateTournamentStatus("tournament-id", "cancelled"),
    ).resolves.toEqual({ outcome: "invalid_transition" });
    expect(tournament.update).not.toHaveBeenCalled();
  });

  it("devuelve el torneo sin reescribir el mismo estado", async () => {
    const tournament = {
      status: "cancelled",
      update: vi.fn(),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(
      updateTournamentStatus("tournament-id", "cancelled"),
    ).resolves.toEqual({ outcome: "updated", tournament });
    expect(tournament.update).not.toHaveBeenCalled();
  });

  it("informa cuando el torneo no existe al cambiar su estado", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(
      updateTournamentStatus("tournament-id", "open"),
    ).resolves.toEqual({ outcome: "not_found" });
  });

  it("elimina un torneo en estado draft", async () => {
    const tournament = {
      status: "draft",
      destroy: vi.fn().mockResolvedValue(undefined),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(deleteTournament("tournament-id")).resolves.toEqual({
      outcome: "deleted",
    });
    expect(Tournament.findByPk).toHaveBeenCalledWith("tournament-id");
    expect(tournament.destroy).toHaveBeenCalledOnce();
  });

  it("no elimina un torneo que ya no esta en draft", async () => {
    const tournament = {
      status: "open",
      destroy: vi.fn(),
    };
    Tournament.findByPk.mockResolvedValue(tournament);

    await expect(deleteTournament("tournament-id")).resolves.toEqual({
      outcome: "not_deletable",
    });
    expect(tournament.destroy).not.toHaveBeenCalled();
  });

  it("informa cuando el torneo no existe al eliminarlo", async () => {
    Tournament.findByPk.mockResolvedValue(null);

    await expect(deleteTournament("tournament-id")).resolves.toEqual({
      outcome: "not_found",
    });
  });
});
