import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "../api/client";
import {
  listTournamentRegistrations,
  registerTeamInTournament,
  withdrawTeamFromTournament,
} from "../api/registrations.api";
import { listTeams } from "../api/teams.api";
import type { TournamentRegistration } from "../types/registration";
import type { Team } from "../types/team";
import type { TournamentStatus } from "../types/tournament";
import ResourceListSkeleton from "./ResourceListSkeleton";

interface TournamentRegistrationsPanelProps {
  tournamentId: number;
  tournamentStatus: TournamentStatus;
  maxParticipants: number;
  isOpening: boolean;
  onOpenRegistrations: () => Promise<void>;
}

type PanelState =
  | { status: "loading" }
  | {
      status: "success";
      registrations: TournamentRegistration[];
      teams: Team[];
    }
  | { status: "error"; message: string };

type Notice = { type: "success" | "error"; message: string } | null;

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return fallback;
}

export default function TournamentRegistrationsPanel({
  tournamentId,
  tournamentStatus,
  maxParticipants,
  isOpening,
  onOpenRegistrations,
}: TournamentRegistrationsPanelProps) {
  const [state, setState] = useState<PanelState>({ status: "loading" });
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawingTeamId, setWithdrawingTeamId] = useState<number | null>(
    null,
  );
  const [notice, setNotice] = useState<Notice>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;

    void Promise.all([
      listTournamentRegistrations(tournamentId),
      listTeams({ page: 1, limit: 100 }),
    ])
      .then(([registrationsResponse, teamsResponse]) => {
        if (!active) {
          return;
        }

        setState({
          status: "success",
          registrations: registrationsResponse.data,
          teams: teamsResponse.data,
        });
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setState({
          status: "error",
          message: getErrorMessage(
            error,
            "No se pudieron cargar las inscripciones.",
          ),
        });
      });

    return () => {
      active = false;
    };
  }, [reloadVersion, tournamentId]);

  function reloadRegistrations() {
    setState({ status: "loading" });
    setReloadVersion((version) => version + 1);
  }

  const availableTeams = useMemo(() => {
    if (state.status !== "success") {
      return [];
    }

    const registeredTeamIds = new Set(
      state.registrations.map((registration) => registration.team.id),
    );

    return state.teams.filter((team) => !registeredTeamIds.has(team.id));
  }, [state]);

  async function handleRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const teamId = Number(selectedTeamId);

    if (!Number.isInteger(teamId) || teamId <= 0) {
      setNotice({ type: "error", message: "Seleccioná un equipo válido." });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      const response = await registerTeamInTournament(tournamentId, teamId);
      setSelectedTeamId("");
      setNotice({ type: "success", message: response.message });
      reloadRegistrations();
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error, "No se pudo inscribir el equipo."),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleWithdrawal(teamId: number) {
    setWithdrawingTeamId(teamId);
    setNotice(null);

    try {
      const response = await withdrawTeamFromTournament(tournamentId, teamId);
      setNotice({ type: "success", message: response.message });
      reloadRegistrations();
    } catch (error) {
      setNotice({
        type: "error",
        message: getErrorMessage(error, "No se pudo retirar el equipo."),
      });
    } finally {
      setWithdrawingTeamId(null);
    }
  }

  const registrationCount =
    state.status === "success" ? state.registrations.length : 0;
  const isFull = registrationCount >= maxParticipants;

  return (
    <section
      className="detail-card registrations-card"
      aria-labelledby="registrations-title"
    >
      <div className="registrations-heading">
        <div>
          <span className="eyebrow">Participantes</span>
          <h2 id="registrations-title">Equipos inscritos</h2>
        </div>
        {state.status === "success" && (
          <strong className="registration-capacity">
            {registrationCount} / {maxParticipants}
          </strong>
        )}
      </div>

      {tournamentStatus === "draft" && (
        <div className="registration-gate">
          <p>
            El torneo todavía está en borrador. Abrí las inscripciones para
            poder incorporar equipos.
          </p>
          <button
            className="primary-button"
            type="button"
            disabled={isOpening}
            onClick={() => void onOpenRegistrations()}
          >
            {isOpening ? "Abriendo…" : "Abrir inscripciones"}
          </button>
        </div>
      )}

      {tournamentStatus !== "draft" && tournamentStatus !== "open" && (
        <p className="detail-rule-note">
          Las inscripciones ya no pueden modificarse porque el torneo no está
          abierto.
        </p>
      )}

      {tournamentStatus === "open" && state.status === "success" && (
        <form className="registration-form" onSubmit={handleRegistration}>
          <div className="form-field">
            <label htmlFor="registration-team">Equipo a inscribir</label>
            <select
              id="registration-team"
              value={selectedTeamId}
              onChange={(event) => {
                setSelectedTeamId(event.target.value);
                setNotice(null);
              }}
              disabled={isSubmitting || isFull || availableTeams.length === 0}
            >
              <option value="">Seleccioná un equipo</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name} (#{team.id})
                </option>
              ))}
            </select>
          </div>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting || isFull || availableTeams.length === 0}
          >
            {isSubmitting ? "Inscribiendo…" : "Inscribir equipo"}
          </button>
        </form>
      )}

      {tournamentStatus === "open" && state.status === "success" && isFull && (
        <p className="detail-rule-note">El torneo alcanzó su cupo máximo.</p>
      )}

      {notice && (
        <div
          className={`form-feedback feedback-${notice.type}`}
          role={notice.type === "error" ? "alert" : "status"}
        >
          <strong>{notice.message}</strong>
        </div>
      )}

      {state.status === "loading" && (
        <ResourceListSkeleton label="Cargando inscripciones…" items={2} />
      )}

      {state.status === "error" && (
        <div className="feedback-message feedback-error" role="alert">
          <p>{state.message}</p>
          <button
            className="inline-action"
            type="button"
            onClick={reloadRegistrations}
          >
            Reintentar
          </button>
        </div>
      )}

      {state.status === "success" && state.registrations.length === 0 && (
        <p className="registrations-empty">
          Todavía no hay equipos inscritos en este torneo.
        </p>
      )}

      {state.status === "success" && state.registrations.length > 0 && (
        <div className="registration-list">
          {state.registrations.map((registration) => (
            <article className="registration-item" key={registration.id}>
              <div>
                <h3>{registration.team.name ?? "Equipo sin nombre"}</h3>
                <p>
                  Equipo #{registration.team.id} · Inscrito el{" "}
                  {dateTimeFormatter.format(
                    new Date(registration.registeredAt),
                  )}
                </p>
              </div>
              <div className="registration-actions">
                <Link
                  className="secondary-button"
                  to={`/teams/${registration.team.id}`}
                >
                  Ver equipo
                </Link>
                {tournamentStatus === "open" && (
                  <button
                    className="danger-button"
                    type="button"
                    disabled={withdrawingTeamId === registration.team.id}
                    onClick={() => void handleWithdrawal(registration.team.id)}
                  >
                    {withdrawingTeamId === registration.team.id
                      ? "Retirando…"
                      : "Retirar"}
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
