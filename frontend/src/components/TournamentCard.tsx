import { Link } from "react-router";

import type { Tournament } from "../types/tournament";

interface TournamentCardProps {
  tournament: Tournament;
}

const statusLabels: Record<Tournament["status"], string> = {
  draft: "Borrador",
  open: "Inscripción abierta",
  in_progress: "En curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const modalityLabels: Record<Tournament["modality"], string> = {
  league: "Liga",
  single_elimination: "Eliminación directa",
  group_stage: "Fase de grupos",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

export default function TournamentCard({ tournament }: TournamentCardProps) {
  return (
    <article className="resource-card">
      <div className="resource-card-heading">
        <div>
          <p className="resource-kind">{modalityLabels[tournament.modality]}</p>
          <h3>{tournament.name}</h3>
        </div>
        <span className={`status-badge status-${tournament.status}`}>
          {statusLabels[tournament.status]}
        </span>
      </div>
      <p className="resource-description">
        {tournament.description ||
          "Este torneo todavía no tiene una descripción."}
      </p>
      <p className="resource-meta">
        Comienza el {formatDate(tournament.startDate)} · Cupo para{" "}
        {tournament.maxParticipants} equipos
      </p>
      <Link
        className="resource-detail-link"
        to={`/tournaments/${tournament.id}`}
        aria-label={`Ver detalle de ${tournament.name}`}
      >
        Ver detalle →
      </Link>
    </article>
  );
}
