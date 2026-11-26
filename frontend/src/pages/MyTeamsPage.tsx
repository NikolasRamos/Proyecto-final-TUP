import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listMyTeams } from "../api/team-memberships.api";
import { useAuthSession } from "../auth/auth-session";
import AccountPagination from "../components/AccountPagination";
import TeamCard from "../components/TeamCard";
import type { PaginatedResponse } from "../types/api";
import type { Team } from "../types/team";

export default function MyTeamsPage() {
  const { session } = useAuthSession();
  const token = session.status === "signedIn" ? session.token : undefined;
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<PaginatedResponse<Team> | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) return;
    const request = new AbortController();
    void listMyTeams(page, token, request.signal).then(
      (value) => {
        if (!request.signal.aborted) setResult(value);
      },
      () => {
        if (!request.signal.aborted) setError(true);
      },
    );
    return () => request.abort();
  }, [page, token]);

  return (
    <main className="app-shell list-page">
      <header className="list-page-header">
        <h1>Mis equipos</h1>
        <Link className="secondary-button" to="/teams">
          Buscar equipos
        </Link>
      </header>
      {error && (
        <p className="feedback-message feedback-error" role="alert">
          No se pudieron cargar tus equipos.
        </p>
      )}
      {!result && !error && <p role="status">Cargando tus equipos…</p>}
      {result && (
        <>
          {result.data.length === 0 && (
            <p>Todavía no integrás equipos en esta página.</p>
          )}
          <div className="resource-list">
            {result.data.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
          <AccountPagination
            page={page}
            totalPages={result.pagination.totalPages}
            onPage={(next) => {
              setResult(null);
              setError(false);
              setPage(next);
            }}
          />
        </>
      )}
    </main>
  );
}
