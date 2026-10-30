import { type FormEvent, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "../api/client";
import { createTeam } from "../api/teams.api";
import type { EntityId } from "../types/id";
import type { CreateTeamInput } from "../types/team";

interface TeamFormData {
  name: string;
  description: string;
  captainId: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; teamId: EntityId }
  | { status: "error"; message: string; details: string[] };

const initialForm: TeamFormData = {
  name: "",
  description: "",
  captainId: "",
};

export default function CreateTeamPage() {
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  function updateField<Key extends keyof TeamFormData>(
    field: Key,
    value: TeamFormData[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));

    if (submitState.status === "error" || submitState.status === "success") {
      setSubmitState({ status: "idle" });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const captainId = Number(form.captainId);

    if (!Number.isInteger(captainId) || captainId <= 0) {
      setSubmitState({
        status: "error",
        message: "El identificador del capitán no es válido.",
        details: [],
      });
      return;
    }

    const payload: CreateTeamInput = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      captainId,
    };

    setSubmitState({ status: "submitting" });

    try {
      const response = await createTeam(payload);
      setSubmitState({
        status: "success",
        message: response.message,
        teamId: response.data.id,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setSubmitState({
          status: "error",
          message: error.message,
          details: error.details?.map((detail) => detail.message) ?? [],
        });
        return;
      }

      setSubmitState({
        status: "error",
        message:
          error instanceof TypeError
            ? "No pudimos conectarnos con el servidor."
            : "No se pudo crear el equipo.",
        details: [],
      });
    }
  }

  const isSubmitting = submitState.status === "submitting";

  return (
    <main className="app-shell form-page">
      <header className="form-header">
        <Link className="back-link" to="/teams">
          ← Volver a equipos
        </Link>
        <span className="eyebrow">Equipos</span>
        <h1>Crear equipo</h1>
        <p>
          Registrá los datos principales. El capitán se agregará automáticamente
          como primer integrante.
        </p>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field field-full">
            <label htmlFor="team-name">Nombre del equipo</label>
            <input
              id="team-name"
              type="text"
              minLength={3}
              maxLength={120}
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ejemplo: Los Halcones"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field field-full">
            <label htmlFor="team-description">Descripción</label>
            <textarea
              id="team-description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Información opcional sobre el equipo"
              disabled={isSubmitting}
            />
            <span className="field-hint">
              Opcional · máximo 2000 caracteres
            </span>
          </div>

          <div className="form-field field-full">
            <label htmlFor="captain-id">ID del capitán</label>
            <input
              id="captain-id"
              type="number"
              min={1}
              step={1}
              value={form.captainId}
              onChange={(event) => updateField("captainId", event.target.value)}
              placeholder="Ejemplo: 1"
              aria-describedby="captain-hint"
              required
              disabled={isSubmitting}
            />
            <span className="field-hint" id="captain-hint">
              Campo temporal hasta integrar usuarios. Para las pruebas podés
              utilizar el número 1.
            </span>
          </div>
        </div>

        {submitState.status === "error" && (
          <div className="form-feedback feedback-error" role="alert">
            <strong>{submitState.message}</strong>
            {submitState.details.length > 0 && (
              <ul>
                {submitState.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {submitState.status === "success" && (
          <div className="form-feedback feedback-success" role="status">
            <strong>{submitState.message}</strong>
            <span>Identificador generado: {submitState.teamId}</span>
            <Link to={`/teams/${submitState.teamId}`}>Ver equipo creado</Link>
          </div>
        )}

        <div className="form-actions">
          <Link className="secondary-link" to="/teams">
            Cancelar
          </Link>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando…" : "Crear equipo"}
          </button>
        </div>
      </form>
    </main>
  );
}
