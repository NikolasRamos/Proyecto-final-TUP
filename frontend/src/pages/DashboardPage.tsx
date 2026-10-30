import { useEffect, useState } from "react";
import { Link } from "react-router";

import { listTeams } from "../api/teams.api";
import { listTournaments } from "../api/tournaments.api";
import ModuleGrid from "../components/ModuleGrid";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import TeamCard from "../components/TeamCard";
import TournamentCard from "../components/TournamentCard";
import type { Team } from "../types/team";
import type { Tournament } from "../types/tournament";

const modules = [
  "Usuarios y roles",
  "Partidas y resultados",
  "Clasificaciones",
  "Estadísticas",
];

type ResourceState<T> =
  | { status: "loading"; items: T[]; total: 0 }
  | { status: "success"; items: T[]; total: number }
  | { status: "error"; items: T[]; total: 0; message: string };

function createInitialState<T>(): ResourceState<T> {
  return { status: "loading", items: [], total: 0 };
}

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return error instanceof Error
    ? error.message
    : "No pudimos conectarnos con el servidor.";
}

export default function DashboardPage() {
  const [tournaments, setTournaments] =
    useState<ResourceState<Tournament>>(createInitialState);
  const [teams, setTeams] = useState<ResourceState<Team>>(createInitialState);

  useEffect(() => {
    let active = true;

    void Promise.allSettled([listTournaments(), listTeams()]).then(
      ([tournamentsResult, teamsResult]) => {
        if (!active) {
          return;
        }

        if (tournamentsResult.status === "fulfilled") {
          setTournaments({
            status: "success",
            items: tournamentsResult.value.data,
            total: tournamentsResult.value.pagination.total,
          });
        } else {
          setTournaments({
            status: "error",
            items: [],
            total: 0,
            message: getErrorMessage(tournamentsResult.reason),
          });
        }

        if (teamsResult.status === "fulfilled") {
          setTeams({
            status: "success",
            items: teamsResult.value.data,
            total: teamsResult.value.pagination.total,
          });
        } else {
          setTeams({
            status: "error",
            items: [],
            total: 0,
            message: getErrorMessage(teamsResult.reason),
          });
        }
      },
    );

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="eyebrow">Panel interno</span>
        <h1 id="page-title">Título X</h1>
        <p>Descripción X</p>
        <div className="hero-actions">
          <Link className="primary-link" to="/tournaments/new">
            Crear torneo
          </Link>
          <Link className="secondary-button" to="/teams/new">
            Crear equipo
          </Link>
        </div>
      </section>

      <section className="summary-grid" aria-label="Resumen del sistema">
        <article className="summary-card">
          <span>Torneos registrados</span>
          {tournaments.status === "loading" ? (
            <span className="summary-skeleton" aria-hidden="true" />
          ) : (
            <strong>
              {tournaments.status === "success" ? tournaments.total : "—"}
            </strong>
          )}
        </article>
        <article className="summary-card">
          <span>Equipos registrados</span>
          {teams.status === "loading" ? (
            <span className="summary-skeleton" aria-hidden="true" />
          ) : (
            <strong>{teams.status === "success" ? teams.total : "—"}</strong>
          )}
        </article>
      </section>

      <section className="data-grid" aria-label="Datos recientes">
        <article className="data-panel" aria-labelledby="tournaments-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Competencias</p>
              <h2 id="tournaments-title">Últimos torneos</h2>
            </div>
            <Link className="secondary-link" to="/tournaments">
              Ver todos
            </Link>
          </div>
          {tournaments.status === "loading" && (
            <ResourceListSkeleton label="Cargando torneos…" />
          )}
          {tournaments.status === "error" && (
            <p className="feedback-message feedback-error" role="alert">
              No se pudieron cargar los torneos. {tournaments.message}
            </p>
          )}
          {tournaments.status === "success" &&
            tournaments.items.length === 0 && (
              <p className="feedback-message">
                Todavía no hay torneos para mostrar.
              </p>
            )}
          {tournaments.status === "success" && tournaments.items.length > 0 && (
            <div className="resource-list">
              {tournaments.items.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </article>

        <article className="data-panel" aria-labelledby="teams-title">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Participantes</p>
              <h2 id="teams-title">Últimos equipos</h2>
            </div>
            <Link className="secondary-link" to="/teams">
              Ver todos
            </Link>
          </div>
          {teams.status === "loading" && (
            <ResourceListSkeleton label="Cargando equipos…" />
          )}
          {teams.status === "error" && (
            <p className="feedback-message feedback-error" role="alert">
              No se pudieron cargar los equipos. {teams.message}
            </p>
          )}
          {teams.status === "success" && teams.items.length === 0 && (
            <p className="feedback-message">
              Todavía no hay equipos para mostrar.
            </p>
          )}
          {teams.status === "success" && teams.items.length > 0 && (
            <div className="resource-list">
              {teams.items.map((team) => (
                <TeamCard key={team.id} team={team} />
              ))}
            </div>
          )}
        </article>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title">Módulos planificados</h2>
        <ModuleGrid modules={modules} />
      </section>
    </main>
  );
}
