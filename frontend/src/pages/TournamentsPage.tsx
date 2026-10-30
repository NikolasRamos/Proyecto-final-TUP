import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";

import { listTournaments } from "../api/tournaments.api";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import TournamentCard from "../components/TournamentCard";
import type { Pagination } from "../types/api";
import type {
  Tournament,
  TournamentModality,
  TournamentStatus,
} from "../types/tournament";

const tournamentStatuses: TournamentStatus[] = [
  "draft",
  "open",
  "in_progress",
  "finished",
  "cancelled",
];

const tournamentModalities: TournamentModality[] = [
  "league",
  "single_elimination",
  "group_stage",
];

const statusLabels: Record<TournamentStatus, string> = {
  draft: "Borrador",
  open: "Inscripción abierta",
  in_progress: "En curso",
  finished: "Finalizado",
  cancelled: "Cancelado",
};

const modalityLabels: Record<TournamentModality, string> = {
  league: "Liga",
  single_elimination: "Eliminación directa",
  group_stage: "Fase de grupos",
};

type SortOption =
  | "createdAt-desc"
  | "createdAt-asc"
  | "name-asc"
  | "name-desc"
  | "startDate-asc"
  | "startDate-desc";

type ListState =
  | { status: "loading"; requestKey: string }
  | {
      status: "success";
      requestKey: string;
      tournaments: Tournament[];
      pagination: Pagination;
    }
  | { status: "error"; requestKey: string; message: string };

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

function readPositiveInteger(value: string | null, fallback: number) {
  const parsedValue = Number(value);

  return Number.isInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : fallback;
}

function isTournamentStatus(value: string | null): value is TournamentStatus {
  return tournamentStatuses.includes(value as TournamentStatus);
}

function isTournamentModality(
  value: string | null,
): value is TournamentModality {
  return tournamentModalities.includes(value as TournamentModality);
}

function isSortOption(value: string | null): value is SortOption {
  return [
    "createdAt-desc",
    "createdAt-asc",
    "name-asc",
    "name-desc",
    "startDate-asc",
    "startDate-desc",
  ].includes(value ?? "");
}

export default function TournamentsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationFeedback = (location.state as { feedback?: string } | null)
    ?.feedback;
  const search = searchParams.get("search")?.trim() ?? "";
  const statusParam = searchParams.get("status");
  const modalityParam = searchParams.get("modality");
  const sortParam = searchParams.get("sort");
  const status = isTournamentStatus(statusParam) ? statusParam : undefined;
  const modality = isTournamentModality(modalityParam)
    ? modalityParam
    : undefined;
  const sort: SortOption = isSortOption(sortParam)
    ? sortParam
    : "createdAt-desc";
  const requestedLimit = readPositiveInteger(searchParams.get("limit"), 10);
  const page = readPositiveInteger(searchParams.get("page"), 1);
  const limit = [5, 10, 20].includes(requestedLimit) ? requestedLimit : 10;
  const [sortBy, order] = sort.split("-") as [
    "createdAt" | "name" | "startDate",
    "asc" | "desc",
  ];
  const requestKey = [
    search,
    status ?? "",
    modality ?? "",
    page,
    limit,
    sortBy,
    order,
  ].join("|");

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

    void listTournaments({
      search: search || undefined,
      status,
      modality,
      page,
      limit,
      sortBy,
      order,
    })
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
          tournaments: response.data,
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
  }, [
    search,
    status,
    modality,
    page,
    limit,
    sortBy,
    order,
    requestKey,
    setSearchParams,
  ]);

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

  function clearFilters() {
    setSearchDraft({ source: "", value: "" });
    setSearchParams({});
  }

  const total = state.status === "success" ? state.pagination.total : 0;
  const totalPages =
    state.status === "success" ? state.pagination.totalPages : 0;
  const hasActiveFilters = Boolean(search || status || modality);

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
        {navigationFeedback && (
          <div className="form-feedback feedback-success" role="status">
            <strong>{navigationFeedback}</strong>
          </div>
        )}

        <form className="list-toolbar" onSubmit={handleSearch} role="search">
          <div className="filter-field filter-search">
            <label htmlFor="tournament-search">Buscar torneos</label>
            <div className="search-control">
              <input
                id="tournament-search"
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

          <div className="filter-field">
            <label htmlFor="tournament-status">Estado</label>
            <select
              id="tournament-status"
              value={status ?? ""}
              onChange={(event) =>
                updateQuery({
                  status: event.target.value || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Todos</option>
              {tournamentStatuses.map((tournamentStatus) => (
                <option key={tournamentStatus} value={tournamentStatus}>
                  {statusLabels[tournamentStatus]}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="tournament-modality">Modalidad</label>
            <select
              id="tournament-modality"
              value={modality ?? ""}
              onChange={(event) =>
                updateQuery({
                  modality: event.target.value || undefined,
                  page: 1,
                })
              }
            >
              <option value="">Todas</option>
              {tournamentModalities.map((tournamentModality) => (
                <option key={tournamentModality} value={tournamentModality}>
                  {modalityLabels[tournamentModality]}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="tournament-sort">Ordenar por</label>
            <select
              id="tournament-sort"
              value={sort}
              onChange={(event) =>
                updateQuery({ sort: event.target.value, page: 1 })
              }
            >
              <option value="createdAt-desc">Más recientes</option>
              <option value="createdAt-asc">Más antiguos</option>
              <option value="name-asc">Nombre A-Z</option>
              <option value="name-desc">Nombre Z-A</option>
              <option value="startDate-asc">Inicio más próximo</option>
              <option value="startDate-desc">Inicio más lejano</option>
            </select>
          </div>

          <div className="filter-field filter-limit">
            <label htmlFor="tournament-limit">Por página</label>
            <select
              id="tournament-limit"
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

          {hasActiveFilters && (
            <button
              className="clear-filters-button"
              type="button"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          )}
        </form>

        <div className="section-heading list-results-heading">
          <div>
            <p className="section-kicker">Listado</p>
            <h2 id="tournament-list-title">Torneos registrados</h2>
          </div>
          {state.status === "success" && (
            <strong className="result-count" aria-live="polite">
              {formatTournamentCount(total)}
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
          <div className="feedback-message">
            <p>
              {hasActiveFilters
                ? "No encontramos torneos con los filtros seleccionados."
                : "Todavía no hay torneos registrados."}
            </p>
            {hasActiveFilters && (
              <button
                className="inline-action"
                type="button"
                onClick={clearFilters}
              >
                Ver todos los torneos
              </button>
            )}
          </div>
        )}

        {state.status === "success" && state.tournaments.length > 0 && (
          <div className="tournament-list-grid">
            {state.tournaments.map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        )}

        {state.status === "success" && totalPages > 1 && (
          <nav className="pagination" aria-label="Paginación de torneos">
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
