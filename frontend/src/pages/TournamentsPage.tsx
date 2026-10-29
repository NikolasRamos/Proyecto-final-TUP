import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listTournaments } from "../api/tournaments.api";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import TournamentCard from "../components/TournamentCard";
import type { Tournament } from "../types/tournament";

type ListState =
  | { status: "loading" }
  | { status: "success"; tournaments: Tournament[]; total: number }
  | { status: "error"; message: string };

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return error instanceof Error
    ? error.message
    : "No pudimos cargar los torneos.";
}

function formatTournamentCount(total: number) {
  return `${total} ${total === 1 ? "torneo encontrado" : "torneos encontrados"}`;
}

export default function TournamentsPage() {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void listTournaments({ page: 1, limit: 10 })
      .then((response) => {
        if (!active) {
          return;
        }

        setState({
          status: "success",
          tournaments: response.data,
          total: response.pagination.total,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState({ status: "error", message: getErrorMessage(error) });
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell list-page">
      <Link className="back-link" to="/">
        ← Volver al panel
      </Link>

      <header className="list-page-header">
        <div>
          <span className="eyebrow">Competencias</span>
          <h1>Torneos</h1>
          <p>Consultá los torneos registrados y su información principal.</p>
        </div>
        <Link className="primary-link" to="/tournaments/new">
          Crear torneo
        </Link>
      </header>

      <section className="list-panel" aria-labelledby="tournament-list-title">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Listado</p>
            <h2 id="tournament-list-title">Torneos registrados</h2>
          </div>
          {state.status === "success" && (
            <strong className="result-count" aria-live="polite">
              {formatTournamentCount(state.total)}
            </strong>
          )}
        </div>

        {state.status === "loading" && (
          <ResourceListSkeleton
            label="Cargando listado de torneos…"
            items={4}
          />
        )}

        {state.status === "error" && (
          <p className="feedback-message feedback-error" role="alert">
            No se pudo cargar el listado. {state.message}
          </p>
        )}

        {state.status === "success" && state.tournaments.length === 0 && (
          <p className="feedback-message">
            Todavía no hay torneos registrados.
          </p>
        )}

        {state.status === "success" && state.tournaments.length > 0 && (
          <div className="tournament-list-grid">
            {state.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
