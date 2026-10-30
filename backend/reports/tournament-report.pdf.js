import PDFDocument from "pdfkit";

const COLORS = {
  ink: "#172033",
  muted: "#65718A",
  primary: "#3157D5",
  primaryDark: "#243F9B",
  pale: "#F1F4FF",
  border: "#DCE2EF",
  row: "#F8F9FC",
  white: "#FFFFFF",
};

const statusLabels = {
  draft: "Borrador",
  open: "Inscripcion abierta",
  in_progress: "En curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const modalityLabels = {
  league: "Liga",
  single_elimination: "Eliminacion directa",
  group_stage: "Fase de grupos",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Buenos_Aires",
});

function formatDate(value) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value) {
  return dateTimeFormatter.format(new Date(value));
}

function drawSectionTitle(document, title) {
  document
    .moveDown(0.7)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(title.toUpperCase(), { characterSpacing: 0.8 })
    .moveDown(0.55);
}

function drawLabelValue(document, label, value, x, y, width) {
  document
    .fillColor(COLORS.muted)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(label.toUpperCase(), x, y, { width })
    .fillColor(COLORS.ink)
    .font("Helvetica")
    .fontSize(10)
    .text(String(value), x, y + 14, { width });
}

function drawInformationGrid(document, tournament) {
  const startX = document.page.margins.left;
  const width = document.page.width - startX - document.page.margins.right;
  const columnGap = 18;
  const columnWidth = (width - columnGap) / 2;
  const startY = document.y;
  const rows = [
    [
      ["Estado", statusLabels[tournament.status] ?? tournament.status],
      ["Modalidad", modalityLabels[tournament.modality] ?? tournament.modality],
    ],
    [
      ["Cierre de inscripcion", formatDate(tournament.registrationDeadline)],
      ["Fecha de inicio", formatDate(tournament.startDate)],
    ],
    [
      ["Fecha de finalizacion", formatDate(tournament.endDate)],
      ["Organizador", `Usuario #${tournament.organizerId}`],
    ],
  ];

  rows.forEach((row, rowIndex) => {
    const y = startY + rowIndex * 48;
    drawLabelValue(document, row[0][0], row[0][1], startX, y, columnWidth);
    drawLabelValue(
      document,
      row[1][0],
      row[1][1],
      startX + columnWidth + columnGap,
      y,
      columnWidth,
    );
  });

  document.y = startY + rows.length * 48;
}

function drawCapacity(document, registrationCount, maxParticipants) {
  const width =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right;
  const percentage = Math.min(
    100,
    Math.round((registrationCount / maxParticipants) * 100),
  );
  const barWidth = width - 140;
  const y = document.y;

  document
    .roundedRect(document.page.margins.left, y, width, 54, 8)
    .fill(COLORS.pale);
  document
    .fillColor(COLORS.ink)
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(
      `${registrationCount} de ${maxParticipants} equipos`,
      document.page.margins.left + 14,
      y + 11,
      { width: 120 },
    );
  document
    .fillColor(COLORS.muted)
    .font("Helvetica")
    .fontSize(8)
    .text(
      `${percentage}% de ocupacion`,
      document.page.margins.left + 14,
      y + 30,
      { width: 120 },
    );
  document
    .roundedRect(document.page.margins.left + 140, y + 20, barWidth, 12, 6)
    .fill(COLORS.border);

  if (percentage > 0) {
    document
      .roundedRect(
        document.page.margins.left + 140,
        y + 20,
        barWidth * (percentage / 100),
        12,
        6,
      )
      .fill(COLORS.primary);
  }

  document.y = y + 54;
}

function ensureTableSpace(document, neededHeight, drawHeader) {
  const bottom = document.page.height - document.page.margins.bottom - 20;

  if (document.y + neededHeight > bottom) {
    document.addPage();
    drawHeader();
  }
}

function drawRegistrationsTable(document, registrations) {
  const startX = document.page.margins.left;
  const totalWidth = document.page.width - startX - document.page.margins.right;
  const columns = {
    id: 58,
    name: totalWidth - 58 - 132,
    date: 132,
  };
  const rowHeight = 34;

  function drawTableHeader() {
    const y = document.y;
    document.rect(startX, y, totalWidth, 28).fill(COLORS.primaryDark);
    document
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(8)
      .text("ID", startX + 8, y + 9, { width: columns.id - 16 })
      .text("EQUIPO", startX + columns.id + 8, y + 9, {
        width: columns.name - 16,
      })
      .text(
        "FECHA DE INSCRIPCION",
        startX + columns.id + columns.name + 8,
        y + 9,
        { width: columns.date - 16 },
      );
    document.y = y + 28;
  }

  drawTableHeader();

  registrations.forEach((registration, index) => {
    ensureTableSpace(document, rowHeight, drawTableHeader);
    const y = document.y;

    if (index % 2 === 0) {
      document.rect(startX, y, totalWidth, rowHeight).fill(COLORS.row);
    }

    document
      .fillColor(COLORS.ink)
      .font("Helvetica")
      .fontSize(9)
      .text(`#${registration.team.id}`, startX + 8, y + 11, {
        width: columns.id - 16,
      })
      .font("Helvetica-Bold")
      .text(
        registration.team.name ?? "Equipo sin nombre",
        startX + columns.id + 8,
        y + 11,
        { width: columns.name - 16, ellipsis: true },
      )
      .font("Helvetica")
      .text(
        formatDateTime(registration.registeredAt),
        startX + columns.id + columns.name + 8,
        y + 11,
        { width: columns.date - 16 },
      );
    document.y = y + rowHeight;
  });
}

function drawPageHeader(document, tournament) {
  const headerHeight = 112;
  document
    .rect(0, 0, document.page.width, headerHeight)
    .fill(COLORS.primaryDark);
  document
    .fillColor(COLORS.white)
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("GRUPO 16 - REPORTE DE TORNEO", 50, 32, {
      characterSpacing: 1.1,
    })
    .fontSize(23)
    .text(tournament.name, 50, 53, {
      width: document.page.width - 100,
      ellipsis: true,
    });
  document.y = headerHeight + 24;
}

function addPageNumbers(document) {
  const range = document.bufferedPageRange();

  for (
    let pageIndex = range.start;
    pageIndex < range.start + range.count;
    pageIndex += 1
  ) {
    document.switchToPage(pageIndex);
    const previousBottomMargin = document.page.margins.bottom;
    document.page.margins.bottom = 0;
    document
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(8)
      .text(
        `Pagina ${pageIndex + 1} de ${range.count}`,
        document.page.margins.left,
        document.page.height - 33,
        {
          width:
            document.page.width -
            document.page.margins.left -
            document.page.margins.right,
          align: "right",
          lineBreak: false,
        },
      );
    document.page.margins.bottom = previousBottomMargin;
  }
}

export function createTournamentReportPdf(report) {
  return new Promise((resolve, reject) => {
    const document = new PDFDocument({
      size: "A4",
      bufferPages: true,
      margins: { top: 50, right: 50, bottom: 55, left: 50 },
      info: {
        Title: `Reporte - ${report.tournament.name}`,
        Author: "Grupo 16",
        Subject: "Reporte exportable de torneo",
      },
    });
    const chunks = [];

    document.on("data", (chunk) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    drawPageHeader(document, report.tournament);

    document
      .fillColor(COLORS.muted)
      .font("Helvetica")
      .fontSize(9)
      .text(
        `Torneo #${report.tournament.id} - Generado el ${formatDateTime(report.generatedAt)}`,
      );

    drawSectionTitle(document, "Informacion general");
    document
      .fillColor(COLORS.ink)
      .font("Helvetica")
      .fontSize(10)
      .text(
        report.tournament.description ||
          "Este torneo no tiene una descripcion registrada.",
        { lineGap: 3 },
      );
    document.moveDown(0.7);
    drawInformationGrid(document, report.tournament);

    drawSectionTitle(document, "Resumen de ocupacion");
    drawCapacity(
      document,
      report.registrations.length,
      report.tournament.maxParticipants,
    );

    drawSectionTitle(document, "Equipos inscritos");

    if (report.registrations.length === 0) {
      document
        .fillColor(COLORS.muted)
        .font("Helvetica-Oblique")
        .fontSize(10)
        .text("Todavia no hay equipos inscritos en este torneo.");
    } else {
      drawRegistrationsTable(document, report.registrations);
    }

    addPageNumbers(document);
    document.end();
  });
}
