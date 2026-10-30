import { createTournamentReportPdf } from "../reports/tournament-report.pdf.js";
import { tournamentIdSchema } from "../schemas/tournament.schema.js";
import { getTournamentReportData } from "../services/tournament-reports.service.js";

export async function downloadTournamentReportHandler(request, response) {
  const idValidation = tournamentIdSchema.safeParse(request.params.id);

  if (!idValidation.success) {
    return response.status(400).json({
      message: "El identificador del torneo no es valido",
    });
  }

  try {
    const result = await getTournamentReportData(idValidation.data);

    if (result.outcome === "not_found") {
      return response.status(404).json({ message: "Torneo no encontrado" });
    }

    const pdf = await createTournamentReportPdf(result.report);
    const date = result.report.generatedAt.toISOString().slice(0, 10);
    const filename = `reporte-torneo-${result.report.tournament.id}-${date}.pdf`;

    response.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdf.length),
      "Cache-Control": "no-store",
    });

    return response.status(200).send(pdf);
  } catch {
    return response.status(500).json({
      message: "No se pudo generar el reporte del torneo",
    });
  }
}
