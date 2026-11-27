import { beforeEach, describe, expect, it, vi } from "vitest";

import database from "../config/database.js";
import { listMyTeams } from "../services/team-membership-requests.service.js";

vi.mock("../config/database.js", () => ({
  default: { query: vi.fn() },
}));

describe("team membership requests service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("incluye el nombre del capitán en el listado de mis equipos", async () => {
    const team = {
      id: 42,
      name: "Los Halcones",
      captainAccountId: 6,
      captainName: "Niko",
    };
    database.query
      .mockResolvedValueOnce([team])
      .mockResolvedValueOnce([{ total: 1 }]);

    const result = await listMyTeams(6, { page: 1, limit: 10 });

    expect(result.data).toEqual([team]);
    const [sql, options] = database.query.mock.calls[0];
    expect(sql).toContain('u.nombre AS "captainName"');
    expect(sql).toContain(
      'LEFT JOIN usuario u ON u."idUsuario" = t.captain_account_id',
    );
    expect(options.bind).toEqual({ userId: 6, limit: 10, offset: 0 });
  });
});
