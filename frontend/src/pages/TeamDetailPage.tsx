import { type FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";

import { ApiError } from "../api/client";
import { deleteTeam, getTeam, updateTeam } from "../api/teams.api";
import ResourceListSkeleton from "../components/ResourceListSkeleton";
import type { Team, UpdateTeamInput } from "../types/team";

interface TeamFormData {
  name: string;
  description: string;
}

type DetailState =
  | { status: "loading"; requestKey: string }
  | { status: "success"; requestKey: string; team: Team }
  | { status: "error"; requestKey: string; message: string };

type Notice =
  | { type: "success"; message: string }
  | { type: "error"; message: string; details?: string[] }
  | null;

const dateTimeFormatter = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function toFormData(team: Team): TeamFormData {
  return {
    name: team.name,
    description: team.description ?? "",
  };
}

function getRequestErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof TypeError) {
    return "No pudimos conectarnos con el servidor.";
  }

  return "No se pudo obtener el equipo.";
}

export default function TeamDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const teamId = Number(id);
  const hasValidId = Number.isInteger(teamId) && teamId > 0;
  const requestKey = id;
  const [result, setResult] = useState<DetailState>({
    status: "loading",
    requestKey,
  });
  const [form, setForm] = useState<TeamFormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

    void getTeam(teamId)
      .then((response) => {
        if (!active) {
          return;
        }

        setResult({ status: "success", requestKey, team: response.data });
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
  }, [hasValidId, requestKey, teamId]);

  function updateField<Key extends keyof TeamFormData>(
    field: Key,
    value: TeamFormData[Key],
  ) {
    setForm((current) => (current ? { ...current, [field]: value } : current));
    setNotice(null);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form || state.status !== "success") {
      return;
    }

    const payload: UpdateTeamInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
    };

    setIsSaving(true);
    setNotice(null);

    try {
      const response = await updateTeam(teamId, payload);
      setResult({ status: "success", requestKey, team: response.data });
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
          message: "No se pudo actualizar el equipo.",
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
      const response = await deleteTeam(teamId);
      navigate("/teams", {
        replace: true,
        state: { feedback: response.message },
      });
    } catch (error) {
      setNotice({
        type: "error",
        message:
          error instanceof ApiError
            ? error.message
            : "No se pudo eliminar el equipo.",
      });
      setShowDeleteConfirmation(false);
    } finally {
      setIsDeleting(false);
    }
  }

  if (!hasValidId) {
    return (
      <main className="app-shell detail-page">
        <Link className="back-link" to="/teams">
          ← Volver a equipos
        </Link>
        <div className="feedback-message feedback-error" role="alert">
          El identificador del equipo no es válido.
        </div>
      </main>
    );
  }

  return (
    <main className="app-shell detail-page">
      <Link className="back-link" to="/teams">
        ← Volver a equipos
      </Link>

      {state.status === "loading" && (
        <section className="detail-card">
          <ResourceListSkeleton label="Cargando equipo…" items={2} />
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
              <span className="eyebrow">Equipo #{state.team.id}</span>
              <h1>{state.team.name}</h1>
            </div>
            {!isEditing && (
              <div className="detail-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setForm(toFormData(state.team));
                    setNotice(null);
                    setShowDeleteConfirmation(false);
                    setIsEditing(true);
                  }}
                >
                  Editar equipo
                </button>
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                >
                  Eliminar equipo
                </button>
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
              aria-labelledby="delete-team-title"
            >
              <div>
                <h2 id="delete-team-title">¿Eliminar este equipo?</h2>
                <p>
                  La acción es definitiva. Si el equipo posee historial de
                  inscripciones, el sistema conservará el registro y rechazará
                  el borrado.
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
                  <label htmlFor="detail-team-name">Nombre del equipo</label>
                  <input
                    id="detail-team-name"
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
                  <label htmlFor="detail-team-description">Descripción</label>
                  <textarea
                    id="detail-team-description"
                    rows={4}
                    maxLength={2000}
                    value={form.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    disabled={isSaving}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => {
                    setForm(toFormData(state.team));
                    setNotice(null);
                    setIsEditing(false);
                  }}
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
            <section className="detail-card" aria-label="Datos del equipo">
              <p className="detail-description">
                {state.team.description ||
                  "Este equipo todavía no tiene una descripción."}
              </p>
              <dl className="detail-grid">
                <div>
                  <dt>Capitán temporal</dt>
                  <dd>Usuario #{state.team.captainId}</dd>
                </div>
                <div>
                  <dt>Creado</dt>
                  <dd>
                    {dateTimeFormatter.format(new Date(state.team.createdAt))}
                  </dd>
                </div>
                <div>
                  <dt>Última actualización</dt>
                  <dd>
                    {dateTimeFormatter.format(new Date(state.team.updatedAt))}
                  </dd>
                </div>
              </dl>
              <p className="detail-rule-note">
                El capitán no puede cambiarse desde la edición básica. La
                gestión de integrantes se incorporará en esta pantalla.
              </p>
            </section>
          )}
        </>
      )}
    </main>
  );
}
