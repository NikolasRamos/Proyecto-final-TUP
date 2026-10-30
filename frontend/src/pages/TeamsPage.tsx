import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";

import { listTeams } from "../api/teams.api";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import TeamCard from "../components/TeamCard";
import type { Pagination } from "../types/api";
import type { Team } from "../types/team";

type ListState =
  | { status: "loading"; requestKey: string }
  | {
      status: "success";
      requestKey: string;
      teams: Team[];
      pagination: Pagination;
    }
  | { status: "error"; requestKey: string; message: string };

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function getErrorMessage(error: unknown) {
  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return error instanceof Error
    ? error.message
    : "No pudimos cargar los equipos.";
}

function formatTeamCount(total: number) {
  return `${total} ${total === 1 ? "equipo encontrado" : "equipos encontrados"}`;
}

export default function TeamsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationFeedback = (location.state as { feedback?: string } | null)
    ?.feedback;
  const search = searchParams.get("search")?.trim() ?? "";
  const page = readPositiveInteger(searchParams.get("page"), 1);
  const requestedLimit = readPositiveInteger(searchParams.get("limit"), 10);
  const limit = [5, 10, 20].includes(requestedLimit) ? requestedLimit : 10;
  const requestKey = [search, page, limit].join("|");
  const [searchDraft, setSearchDraft] = useState({
    source: search,
    value: search,
  });
  const [result, setResult] = useState<ListState>({
    status: "loading",
    requestKey,
  });
  const searchInput =
    searchDraft.source === search ? searchDraft.value : search;
  const state: ListState =
    result.requestKey === requestKey
      ? result
      : { status: "loading", requestKey };

  useEffect(() => {
    let active = true;

    void listTeams({ search: search || undefined, page, limit })
      .then((response) => {
        if (!active) {
          return;
        }

        const lastAvailablePage = Math.max(1, response.pagination.totalPages);

        if (page > lastAvailablePage) {
          setSearchParams(
            (currentParams) => {
              const nextParams = new URLSearchParams(currentParams);
              nextParams.set("page", String(lastAvailablePage));
              return nextParams;
            },
            { replace: true },
          );
          return;
        }

        setResult({
          status: "success",
          requestKey,
          teams: response.data,
          pagination: response.pagination,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setResult({
          status: "error",
          requestKey,
          message: getErrorMessage(error),
        });
      });

    return () => {
      active = false;
    };
  }, [search, page, limit, requestKey, setSearchParams]);

  function updateQuery(changes: Record<string, string | number | undefined>) {
    const nextParams = new URLSearchParams(searchParams);

    Object.entries(changes).forEach(([key, value]) => {
      if (value === undefined || value === "") {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(value));
      }
    });

    setSearchParams(nextParams);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateQuery({ search: searchInput.trim() || undefined, page: 1 });
  }

  function clearSearch() {
    setSearchDraft({ source: "", value: "" });
    setSearchParams({});
  }

  const total = state.status === "success" ? state.pagination.total : 0;
  const totalPages =
    state.status === "success" ? state.pagination.totalPages : 0;

  return (
    <main className="app-shell list-page">
      <Link className="back-link" to="/">
        ← Volver al panel
      </Link>

      <header className="list-page-header">
        <div>
          <span className="eyebrow">Participantes</span>
          <h1>Equipos</h1>
          <p>Consultá y administrá los equipos registrados.</p>
        </div>
        <Link className="primary-link" to="/teams/new">
          Crear equipo
        </Link>
      </header>

      <section className="list-panel" aria-labelledby="team-list-title">
        {navigationFeedback && (
          <div className="form-feedback feedback-success" role="status">
            <strong>{navigationFeedback}</strong>
          </div>
        )}

        <form
          className="list-toolbar teams-toolbar"
          onSubmit={handleSearch}
          role="search"
        >
          <div className="filter-field filter-search">
            <label htmlFor="team-search">Buscar equipos</label>
            <div className="search-control">
              <input
                id="team-search"
                type="search"
                value={searchInput}
                onChange={(event) =>
                  setSearchDraft({
                    source: search,
                    value: event.target.value,
                  })
                }
                placeholder="Nombre o descripción"
                maxLength={120}
              />
              <button className="filter-button" type="submit">
                Buscar
              </button>
            </div>
          </div>

          <div className="filter-field filter-limit">
            <label htmlFor="team-limit">Por página</label>
            <select
              id="team-limit"
              value={limit}
              onChange={(event) =>
                updateQuery({ limit: Number(event.target.value), page: 1 })
              }
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>

          {search && (
            <button
              className="clear-filters-button"
              type="button"
              onClick={clearSearch}
            >
              Limpiar búsqueda
            </button>
          )}
        </form>

        <div className="section-heading list-results-heading">
          <div>
            <p className="section-kicker">Listado</p>
            <h2 id="team-list-title">Equipos registrados</h2>
          </div>
          {state.status === "success" && (
            <strong className="result-count" aria-live="polite">
              {formatTeamCount(total)}
            </strong>
          )}
        </div>

        {state.status === "loading" && (
          <ResourceListSkeleton
            label="Cargando listado de equipos…"
            items={4}
          />
        )}

        {state.status === "error" && (
          <p className="feedback-message feedback-error" role="alert">
            No se pudo cargar el listado. {state.message}
          </p>
        )}

        {state.status === "success" && state.teams.length === 0 && (
          <div className="feedback-message">
            <p>
              {search
                ? "No encontramos equipos con esa búsqueda."
                : "Todavía no hay equipos registrados."}
            </p>
            {search && (
              <button
                className="inline-action"
                type="button"
                onClick={clearSearch}
              >
                Ver todos los equipos
              </button>
            )}
          </div>
        )}

        {state.status === "success" && state.teams.length > 0 && (
          <div className="tournament-list-grid">
            {state.teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        )}

        {state.status === "success" && totalPages > 1 && (
          <nav className="pagination" aria-label="Paginación de equipos">
            <button
              type="button"
              onClick={() => updateQuery({ page: page - 1 })}
              disabled={page <= 1}
            >
              ← Anterior
            </button>
            <span aria-live="polite">
              Página <strong>{page}</strong> de <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              onClick={() => updateQuery({ page: page + 1 })}
              disabled={page >= totalPages}
            >
              Siguiente →
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}
