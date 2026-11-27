import { beforeEach, describe, expect, it, vi } from "vitest";

import database from "../config/database.js";
import TeamMember from "../models/TeamMember.js";
import User from "../models/user.js";
import { listMyTeams } from "../services/team-membership-requests.service.js";

vi.mock("../models/TeamMember.js", () => ({
  default: { findAll: vi.fn() },
}));

vi.mock("../models/user.js", () => ({
  default: { findAll: vi.fn() },
}));

const query = vi.spyOn(database, "query");

describe("team membership requests service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    query.mockReset().mockRejectedValue(new Error("Consulta sin simular"));
    TeamMember.findAll.mockResolvedValue([]);
    User.findAll.mockResolvedValue([]);
  });

  it("incluye el nombre del capitán en el listado de mis equipos", async () => {
    const team = {
      id: 42,
      name: "Los Halcones",
      captainAccountId: 6,
      captainName: "Niko",
    };
    query
      .mockResolvedValueOnce([team])
      .mockResolvedValueOnce([{ total: 1 }]);

    const result = await listMyTeams(6, { page: 1, limit: 10 });

    expect(result.data).toEqual([team]);
    const [sql, options] = query.mock.calls[0];
    expect(sql).toContain('u.nombre AS "captainName"');
    expect(sql).toContain(
      'LEFT JOIN usuario u ON u."idUsuario" = t.captain_account_id',
    );
    expect(options.bind).toEqual({ userId: 6, limit: 10, offset: 0 });
  });

  it("incluye los integrantes en mis equipos sin repetir al capitán", async () => {
    const team = {
      id: 42,
      name: "Los Halcones",
      captainId: 6,
      captainAccountId: 6,
      captainName: "Niko",
    };
    query
      .mockResolvedValueOnce([team])
      .mockResolvedValueOnce([{ total: 1 }]);
    TeamMember.findAll.mockResolvedValue([
      { teamId: 42, userId: 6 },
      { teamId: 42, userId: 8 },
      { teamId: 42, userId: 9 },
    ]);
    User.findAll.mockResolvedValue([
      { idUsuario: 6, nombre: "Niko" },
      { idUsuario: 8, nombre: "Ana" },
      { idUsuario: 9, nombre: "Lu" },
    ]);

    const result = await listMyTeams(6, { page: 1, limit: 10 });

    expect(result.data[0].memberNames).toEqual(["Ana", "Lu"]);
  });
});
