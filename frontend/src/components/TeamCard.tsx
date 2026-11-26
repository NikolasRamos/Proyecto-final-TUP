import { Link } from "react-router";

import type { Team } from "../types/team";

interface TeamCardProps {
  team: Team;
}

export default function TeamCard({ team }: TeamCardProps) {
  return (
    <article className="resource-card">
      <div>
        <p className="resource-kind">Equipo</p>
        <h3>{team.name}</h3>
      </div>
      <p className="resource-description">
        {team.description || "Este equipo todavía no tiene una descripción."}
      </p>
      <p className="resource-meta">
        {team.captainAccountId
          ? `Capitán: ${team.captainName ?? `Usuario #${team.captainAccountId}`}`
          : "Capitán sin cuenta vinculada"}
      </p>
      <Link
        className="resource-detail-link"
        to={`/teams/${team.id}`}
        aria-label={`Ver detalle de ${team.name}`}
      >
        Ver detalle →
      </Link>
    </article>
  );
}
