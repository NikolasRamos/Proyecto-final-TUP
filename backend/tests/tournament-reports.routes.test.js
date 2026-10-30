import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

import app from "../app.js";
import { createTournamentReportPdf } from "../reports/tournament-report.pdf.js";
import { getTournamentReportData } from "../services/tournament-reports.service.js";

vi.mock("../reports/tournament-report.pdf.js", () => ({
  createTournamentReportPdf: vi.fn(),
}));

vi.mock("../services/tournament-reports.service.js", () => ({
  getTournamentReportData: vi.fn(),
}));

const report = {
  tournament: { id: 101, name: "Torneo Apertura" },
  registrations: [],
  generatedAt: new Date("2026-10-30T15:00:00.000Z"),
};

describe("GET /api/tournaments/:id/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("descarga el reporte PDF del torneo", async () => {
    const pdf = Buffer.from("%PDF-1.3\nreporte\n%%EOF");
    getTournamentReportData.mockResolvedValue({ outcome: "found", report });
    createTournamentReportPdf.mockResolvedValue(pdf);

    const response = await request(app).get("/api/tournaments/101/report");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toBe("application/pdf");
    expect(response.headers["content-disposition"]).toBe(
      'attachment; filename="reporte-torneo-101-2026-10-30.pdf"',
    );
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(getTournamentReportData).toHaveBeenCalledWith(101);
    expect(createTournamentReportPdf).toHaveBeenCalledWith(report);
  });

  it("rechaza un identificador inválido", async () => {
    const response = await request(app).get(
      "/api/tournaments/no-es-un-id/report",
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "El identificador del torneo no es valido",
    );
    expect(getTournamentReportData).not.toHaveBeenCalled();
  });

  it("responde 404 cuando el torneo no existe", async () => {
    getTournamentReportData.mockResolvedValue({ outcome: "not_found" });

    const response = await request(app).get("/api/tournaments/999/report");

    expect(response.status).toBe(404);
    expect(response.body.message).toBe("Torneo no encontrado");
  });

  it("no expone detalles si falla la generación", async () => {
    getTournamentReportData.mockRejectedValue(new Error("detalle interno"));

    const response = await request(app).get("/api/tournaments/101/report");

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      message: "No se pudo generar el reporte del torneo",
    });
  });
});
