import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "../api/client";
import {
  deleteTournament,
  downloadTournamentReport,
  getTournament,
  updateTournament,
  updateTournamentStatus,
} from "../api/tournaments.api";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import TournamentRegistrationsPanel from "../components/TournamentRegistrationsPanel";
import type {
  Tournament,
  TournamentModality,
  UpdateTournamentInput,
} from "../types/tournament";

const statusLabels: Record<Tournament["status"], string> = {
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

interface TournamentFormData {
  name: string;
  description: string;
  modality: TournamentModality;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
}

type DetailState =
  | { status: "loading"; requestKey: string }
  | { status: "success"; requestKey: string; tournament: Tournament }
  | { status: "error"; requestKey: string; message: string };

type Notice =
  | { type: "success"; message: string }
  | { type: "error"; message: string; details?: string[] }
  | null;

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(date: string) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function formatDateTime(date: string) {
  return dateTimeFormatter.format(new Date(date));
}

function toFormData(tournament: Tournament): TournamentFormData {
  return {
    name: tournament.name,
    description: tournament.description ?? "",
    modality: tournament.modality,
    maxParticipants: tournament.maxParticipants,
    registrationDeadline: tournament.registrationDeadline,
    startDate: tournament.startDate,
    endDate: tournament.endDate,
  };
}

function validateDates(form: TournamentFormData) {
  if (form.registrationDeadline > form.startDate) {
    return "La fecha límite de inscripción no puede ser posterior al inicio.";
  }

  if (form.startDate > form.endDate) {
    return "La fecha de finalización no puede ser anterior al inicio.";
  }

  return null;
}

function getRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return "No se pudo obtener el torneo.";
}

export default function TournamentDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const tournamentId = Number(id);
  const hasValidId = Number.isInteger(tournamentId) && tournamentId > 0;
  const requestKey = id;
  const [result, setResult] = useState<DetailState>({
    status: "loading",
    requestKey,
  });
  const [form, setForm] = useState<TournamentFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpeningRegistrations, setIsOpeningRegistrations] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const state: DetailState =
    result.requestKey === requestKey
      ? result
      : { status: "loading", requestKey };

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    let active = true;

    void getTournament(tournamentId)
      .then((response) => {
        if (!active) {
          return;
        }

        setResult({
          status: "success",
          requestKey,
          tournament: response.data,
        });
        setForm(toFormData(response.data));
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setResult({
          status: "error",
          requestKey,
          message: getRequestErrorMessage(error),
        });
      });

    return () => {
      active = false;
    };
  }, [hasValidId, requestKey, tournamentId]);

  function updateField<Key extends keyof TournamentFormData>(
    field: Key,
    value: TournamentFormData[Key],
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setNotice(null);
  }

  function startEditing(tournament: Tournament) {
    setForm(toFormData(tournament));
    setNotice(null);
    setShowDeleteConfirmation(false);
    setIsEditing(true);
  }

  function cancelEditing(tournament: Tournament) {
    setForm(toFormData(tournament));
    setNotice(null);
    setIsEditing(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || state.status !== "success") {
      return;
    }

    const dateError = validateDates(form);

    if (dateError) {
      setNotice({ type: "error", message: dateError });
      return;
    }

    const payload: UpdateTournamentInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    setIsSaving(true);
    setNotice(null);

    try {
      const response = await updateTournament(tournamentId, payload);
      setResult({
        status: "success",
        requestKey,
        tournament: response.data,
      });
      setForm(toFormData(response.data));
      setIsEditing(false);
      setNotice({ type: "success", message: response.message });
    } catch (error) {
      if (error instanceof ApiError) {
        setNotice({
          type: "error",
          message: error.message,
          details: error.details?.map((detail) => detail.message),
        });
      } else {
        setNotice({
          type: "error",
          message:
            error instanceof TypeError
              ? "No pudimos conectarnos con el servidor."
              : "No se pudo actualizar el torneo.",
        });
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    setNotice(null);

    try {
      const response = await deleteTournament(tournamentId);
      navigate("/tournaments", {
        replace: true,
        state: { feedback: response.message },
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No se pudo eliminar el torneo.",
      });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleOpenRegistrations() {
    if (state.status !== "success") {
      return;
    }

    setIsOpeningRegistrations(true);
    setNotice(null);

    try {
      const response = await updateTournamentStatus(tournamentId, "open");
      setResult({
        status: "success",
        requestKey,
        tournament: response.data,
      });
      setForm(toFormData(response.data));
      setShowDeleteConfirmation(false);
      setNotice({ type: "success", message: response.message });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No se pudieron abrir las inscripciones.",
      });
    } finally {
      setIsOpeningRegistrations(false);
    }
  }

  async function handleReportDownload() {
    if (state.status !== "success") {
      return;
    }

    setIsExporting(true);
    setNotice(null);

    try {
      const report = await downloadTournamentReport(tournamentId);
      const url = URL.createObjectURL(report);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);

      link.href = url;
      link.download = `reporte-torneo-${tournamentId}-${date}.pdf`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice({
        type: "success",
        message: "Reporte descargado correctamente",
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No se pudo descargar el reporte.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  if (!hasValidId) {
    return (
      <main className="app-shell detail-page">
        <Link className="back-link" to="/tournaments">
          ← Volver a torneos
        </Link>
        <div className="feedback-message feedback-error" role="alert">
          El identificador del torneo no es válido.
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell detail-page">
      <Link className="back-link" to="/tournaments">
        ← Volver a torneos
      </Link>

      {state.status === "loading" && (
        <section className="detail-card">
          <ResourceListSkeleton label="Cargando torneo…" items={2} />
        </section>
      )}

      {state.status === "error" && (
        <section className="detail-card">
          <div className="feedback-message feedback-error" role="alert">
            {state.message}
          </div>
        </section>
      )}

      {state.status === "success" && form && (
        <>
          <header className="detail-header">
            <div>
              <span className="eyebrow">Torneo #{state.tournament.id}</span>
              <h1>{state.tournament.name}</h1>
              <span
                className={`status-badge status-${state.tournament.status}`}
              >
                {statusLabels[state.tournament.status]}
              </span>
            </div>

            {!isEditing && (
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => void handleReportDownload()}
                  disabled={isExporting}
                >
                  {isExporting ? "Generando…" : "Exportar reporte"}
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => startEditing(state.tournament)}
                >
                  Editar torneo
                </button>
                {state.tournament.status === "draft" && (
                  <button
                    className="danger-button"
                    type="button"
                    onClick={() => setShowDeleteConfirmation(true)}
                  >
                    Eliminar torneo
                  </button>
                )}
              </div>
            )}
          </header>

          {notice && (
            <div
              className={`form-feedback feedback-${notice.type}`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              <strong>{notice.message}</strong>
              {notice.type === "error" &&
                notice.details &&
                notice.details.length > 0 && (
                  <ul>
                    {notice.details.map((detail) => (
                      <li key={detail}>{detail}</li>
                    ))}
                  </ul>
                )}
            </div>
          )}

          {showDeleteConfirmation && (
            <section
              className="delete-confirmation"
              aria-labelledby="delete-title"
            >
              <div>
                <h2 id="delete-title">¿Eliminar este torneo?</h2>
                <p>
                  Esta acción es definitiva. Solo se permite porque el torneo
                  todavía está en estado borrador.
                </p>
              </div>
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => setShowDeleteConfirmation(false)}
                  disabled={isDeleting}
                >
                  Cancelar
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Eliminando…" : "Sí, eliminar"}
                </button>
              </div>
            </section>
          )}

          {isEditing ? (
            <form className="form-card detail-card" onSubmit={handleUpdate}>
              <div className="form-grid">
                <div className="form-field field-full">
                  <label htmlFor="detail-name">Nombre del torneo</label>
                  <input
                    id="detail-name"
                    type="text"
                    minLength={3}
                    maxLength={120}
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="form-field field-full">
                  <label htmlFor="detail-description">Descripción</label>
                  <textarea
                    id="detail-description"
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    disabled={isSaving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="detail-modality">Modalidad</label>
                  <select
                    id="detail-modality"
                    value={form.modality}
                    onChange={(event) =>
                      updateField(
                        "modality",
                        event.target.value as TournamentModality,
                      )
                    }
                    disabled={isSaving}
                  >
                    <option value="league">Liga</option>
                    <option value="single_elimination">
                      Eliminación directa
                    </option>
                    <option value="group_stage">Fase de grupos</option>
                  </select>
                </div>

                <div className="form-field">
                  <label htmlFor="detail-max-participants">Cupo máximo</label>
                  <input
                    id="detail-max-participants"
                    type="number"
                    min={2}
                    step={1}
                    value={form.maxParticipants}
                    onChange={(event) =>
                      updateField("maxParticipants", Number(event.target.value))
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="detail-registration-deadline">
                    Cierre de inscripción
                  </label>
                  <input
                    id="detail-registration-deadline"
                    type="date"
                    value={form.registrationDeadline}
                    onChange={(event) =>
                      updateField("registrationDeadline", event.target.value)
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="detail-start-date">Fecha de inicio</label>
                  <input
                    id="detail-start-date"
                    type="date"
                    value={form.startDate}
                    onChange={(event) =>
                      updateField("startDate", event.target.value)
                    }
                    required
                    disabled={isSaving}
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="detail-end-date">Fecha de finalización</label>
                  <input
                    id="detail-end-date"
                    type="date"
                    value={form.endDate}
                    onChange={(event) =>
                      updateField("endDate", event.target.value)
                    }
                    required
                    disabled={isSaving}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => cancelEditing(state.tournament)}
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving ? "Guardando…" : "Guardar cambios"}
                </button>
              </div>
            </form>
          ) : (
            <section className="detail-card" aria-label="Datos del torneo">
              <p className="detail-description">
                {state.tournament.description ||
                  "Este torneo todavía no tiene una descripción."}
              </p>

              <dl className="detail-grid">
                <div>
                  <dt>Modalidad</dt>
                  <dd>{modalityLabels[state.tournament.modality]}</dd>
                </div>
                <div>
                  <dt>Cupo máximo</dt>
                  <dd>{state.tournament.maxParticipants} equipos</dd>
                </div>
                <div>
                  <dt>Cierre de inscripción</dt>
                  <dd>{formatDate(state.tournament.registrationDeadline)}</dd>
                </div>
                <div>
                  <dt>Fecha de inicio</dt>
                  <dd>{formatDate(state.tournament.startDate)}</dd>
                </div>
                <div>
                  <dt>Fecha de finalización</dt>
                  <dd>{formatDate(state.tournament.endDate)}</dd>
                </div>
                <div>
                  <dt>Organizador temporal</dt>
                  <dd>Usuario #{state.tournament.organizerId}</dd>
                </div>
                <div>
                  <dt>Creado</dt>
                  <dd>{formatDateTime(state.tournament.createdAt)}</dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>{formatDateTime(state.tournament.updatedAt)}</dd>
                </div>
              </dl>

              {state.tournament.status !== "draft" && (
                <p className="detail-rule-note">
                  Este torneo conserva su historial y ya no puede eliminarse
                  porque dejó de estar en borrador.
                </p>
              )}
            </section>
          )}

          {!isEditing && (
            <TournamentRegistrationsPanel
              tournamentId={tournamentId}
              tournamentStatus={state.tournament.status}
              maxParticipants={state.tournament.maxParticipants}
              isOpening={isOpeningRegistrations}
              onOpenRegistrations={handleOpenRegistrations}
            />
          )}
        </>
      )}
    </main>
  );
}
