import { describe, expect, it } from "vitest";

import { createTournamentReportPdf } from "../reports/tournament-report.pdf.js";

const tournament = {
  id: 101,
  name: "Torneo Apertura",
  description: "Competencia de prueba",
  modality: "league",
  maxParticipants: 16,
  registrationDeadline: "2026-11-01",
  startDate: "2026-11-05",
  endDate: "2026-12-10",
  status: "open",
  organizerId: 1,
};

describe("tournament report PDF", () => {
  it("genera un documento PDF válido aunque no haya equipos", async () => {
    const pdf = await createTournamentReportPdf({
      tournament,
      generatedAt: new Date("2026-10-30T15:00:00.000Z"),
      registrations: [],
    });

    expect(pdf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(pdf.toString("latin1")).toContain("%%EOF");
    expect(pdf.length).toBeGreaterThan(1_000);
  });

  it("genera páginas adicionales para un listado extenso", async () => {
    const registrations = Array.from({ length: 22 }, (_, index) => ({
      id: 300 + index,
      registeredAt: new Date("2026-10-30T15:00:00.000Z"),
      team: { id: 200 + index, name: `Equipo participante ${index + 1}` },
    }));
    const pdf = await createTournamentReportPdf({
      tournament: { ...tournament, maxParticipants: 64 },
      generatedAt: new Date("2026-10-30T15:00:00.000Z"),
      registrations,
    });
    const pageObjects = pdf.toString("latin1").match(/\/Type \/Page\b/g);

    expect(pageObjects).toHaveLength(2);
  });
});
