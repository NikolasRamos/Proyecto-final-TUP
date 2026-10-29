import { type FormEvent, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "../api/client";
import { createTournament } from "../api/tournaments.api";
import type {
  CreateTournamentInput,
  TournamentModality,
} from "../types/tournament";
import type { EntityId } from "../types/id";

interface TournamentFormData {
  name: string;
  description: string;
  modality: TournamentModality;
  maxParticipants: number;
  registrationDeadline: string;
  startDate: string;
  endDate: string;
  organizerId: string;
}

type SubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "success"; message: string; tournamentId: EntityId }
  | { status: "error"; message: string; details: string[] };

const initialForm: TournamentFormData = {
  name: "",
  description: "",
  modality: "league",
  maxParticipants: 2,
  registrationDeadline: "",
  startDate: "",
  endDate: "",
  organizerId: "",
};

function validateDates(form: TournamentFormData) {
  if (form.registrationDeadline > form.startDate) {
    return "La fecha límite de inscripción no puede ser posterior al inicio.";
  }

  if (form.startDate > form.endDate) {
    return "La fecha de finalización no puede ser anterior al inicio.";
  }

  return null;
}

export default function CreateTournamentPage() {
  const [form, setForm] = useState(initialForm);
  const [submitState, setSubmitState] = useState<SubmitState>({
    status: "idle",
  });

  function updateField<Key extends keyof TournamentFormData>(
    field: Key,
    value: TournamentFormData[Key],
  ) {
    setForm((current) => ({ ...current, [field]: value }));

    if (submitState.status === "error" || submitState.status === "success") {
      setSubmitState({ status: "idle" });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const dateError = validateDates(form);

    if (dateError) {
      setSubmitState({ status: "error", message: dateError, details: [] });
      return;
    }

    const organizerId = Number(form.organizerId);

    if (!Number.isInteger(organizerId) || organizerId <= 0) {
      setSubmitState({
        status: "error",
        message: "El identificador del organizador no es válido.",
        details: [],
      });
      return;
    }

    const payload: CreateTournamentInput = {
      ...form,
      name: form.name.trim(),
      description: form.description.trim() || null,
      organizerId,
    };

    setSubmitState({ status: "submitting" });

    try {
      const response = await createTournament(payload);

      setSubmitState({
        status: "success",
        message: response.message,
        tournamentId: response.data.id,
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
            : "No se pudo crear el torneo.",
        details: [],
      });
    }
  }

  const isSubmitting = submitState.status === "submitting";

  return (
    <main className="app-shell form-page">
      <header className="form-header">
        <Link className="back-link" to="/">
          ← Volver al panel
        </Link>
        <span className="eyebrow">Torneos</span>
        <h1>Crear torneo</h1>
        <p>
          Completá los datos principales. El torneo se guardará inicialmente
          como borrador.
        </p>
      </header>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-field field-full">
            <label htmlFor="name">Nombre del torneo</label>
            <input
              id="name"
              name="name"
              type="text"
              minLength={3}
              maxLength={120}
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Ejemplo: Torneo Apertura"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field field-full">
            <label htmlFor="description">Descripción</label>
            <textarea
              id="description"
              name="description"
              rows={4}
              maxLength={2000}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
              placeholder="Información opcional sobre el torneo"
              disabled={isSubmitting}
            />
            <span className="field-hint">
              Opcional · máximo 2000 caracteres
            </span>
          </div>

          <div className="form-field">
            <label htmlFor="modality">Modalidad</label>
            <select
              id="modality"
              name="modality"
              value={form.modality}
              onChange={(event) =>
                updateField(
                  "modality",
                  event.target.value as TournamentModality,
                )
              }
              disabled={isSubmitting}
            >
              <option value="league">Liga</option>
              <option value="single_elimination">Eliminación directa</option>
              <option value="group_stage">Fase de grupos</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="maxParticipants">Cupo máximo</label>
            <input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              min={2}
              step={1}
              value={form.maxParticipants}
              onChange={(event) =>
                updateField("maxParticipants", Number(event.target.value))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="registrationDeadline">Cierre de inscripción</label>
            <input
              id="registrationDeadline"
              name="registrationDeadline"
              type="date"
              value={form.registrationDeadline}
              onChange={(event) =>
                updateField("registrationDeadline", event.target.value)
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="startDate">Fecha de inicio</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={(event) => updateField("startDate", event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field">
            <label htmlFor="endDate">Fecha de finalización</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={(event) => updateField("endDate", event.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-field field-full">
            <label htmlFor="organizerId">ID del organizador</label>
            <input
              id="organizerId"
              name="organizerId"
              type="number"
              min={1}
              step={1}
              value={form.organizerId}
              onChange={(event) =>
                updateField("organizerId", event.target.value)
              }
              placeholder="Ejemplo: 1"
              aria-describedby="organizer-hint"
              required
              disabled={isSubmitting}
            />
            <span className="field-hint" id="organizer-hint">
              Campo temporal hasta que se integre el bloque de usuarios.
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
            <span>
              Identificador generado: <code>{submitState.tournamentId}</code>
            </span>
          </div>
        )}

        <div className="form-actions">
          <Link className="secondary-link" to="/">
            Cancelar
          </Link>
          <button
            className="primary-button"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando torneo…" : "Crear torneo"}
          </button>
        </div>
      </form>
    </main>
  );
}
