import { type FormEvent, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "../api/client";
import { createTournament } from "../api/tournaments.api";
import {
  getGroupsPlayoffConfigurationError,
  getRecommendedSwissRounds,
  getSwissConfigurationError,
  getTournamentFormatParticipantError,
  getTournamentFormatUiRule,
} from "../config/tournament-format-rules";
import {
  TOURNAMENT_MODALITIES,
  TOURNAMENT_MODALITY_LABELS,
  type CreateTournamentInput,
  type TournamentModality,
} from "../types/tournament";
import type { EntityId } from "../types/id";

interface TournamentFormData {
  name: string;
  description: string;
  modality: TournamentModality;
  maxParticipants: number;
  playoffSpots: number;
  groupCount: number;
  maxParticipantsPerGroup: number;
  swissRounds: number;
  isTeamTournament: boolean;
  minTeamMembers: number;
  maxTeamMembers: number;
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
  maxParticipants: 3,
  playoffSpots: 8,
  groupCount: 4,
  maxParticipantsPerGroup: 4,
  swissRounds: 3,
  isTeamTournament: true,
  minTeamMembers: 2,
  maxTeamMembers: 2,
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

function validateParticipation(form: TournamentFormData) {
  if (!form.isTeamTournament) {
    return null;
  }

  if (!Number.isInteger(form.minTeamMembers) || form.minTeamMembers < 2) {
    return "El mínimo de integrantes por equipo debe ser al menos 2.";
  }

  if (!Number.isInteger(form.maxTeamMembers) || form.maxTeamMembers < 2) {
    return "El máximo de integrantes por equipo debe ser al menos 2.";
  }

  if (form.maxTeamMembers < form.minTeamMembers) {
    return "El máximo de integrantes no puede ser menor que el mínimo.";
  }

  return null;
}

function validateFormat(form: TournamentFormData) {
  const participantError = getTournamentFormatParticipantError(
    form.modality,
    form.maxParticipants,
  );

  if (participantError) {
    return participantError;
  }

  if (form.modality === "groups_playoff") {
    return getGroupsPlayoffConfigurationError(form);
  }

  if (form.modality === "swiss") {
    return getSwissConfigurationError(form);
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

  function updateModality(modality: TournamentModality) {
    const rule = getTournamentFormatUiRule(modality);

    setForm((current) => {
      const maxParticipants =
        modality === "groups_playoff"
          ? current.groupCount * current.maxParticipantsPerGroup
          : Math.max(current.maxParticipants, rule.minParticipants);

      return { ...current, modality, maxParticipants };
    });

    if (submitState.status === "error" || submitState.status === "success") {
      setSubmitState({ status: "idle" });
    }
  }

  function updateGroupConfiguration(
    field: "playoffSpots" | "groupCount" | "maxParticipantsPerGroup",
    value: number,
  ) {
    setForm((current) => {
      const next = { ...current, [field]: value };

      return {
        ...next,
        maxParticipants: next.groupCount * next.maxParticipantsPerGroup,
      };
    });

    if (submitState.status === "error" || submitState.status === "success") {
      setSubmitState({ status: "idle" });
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formatError = validateFormat(form);

    if (formatError) {
      setSubmitState({
        status: "error",
        message: formatError,
        details: [],
      });
      return;
    }

    const participationError = validateParticipation(form);

    if (participationError) {
      setSubmitState({
        status: "error",
        message: participationError,
        details: [],
      });
      return;
    }

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

    const {
      playoffSpots,
      groupCount,
      maxParticipantsPerGroup,
      swissRounds,
      ...commonForm
    } = form;
    const payload: CreateTournamentInput = {
      ...commonForm,
      name: form.name.trim(),
      description: form.description.trim() || null,
      minTeamMembers: form.isTeamTournament ? form.minTeamMembers : null,
      maxTeamMembers: form.isTeamTournament ? form.maxTeamMembers : null,
      organizerId,
      ...(form.modality === "groups_playoff"
        ? { playoffSpots, groupCount, maxParticipantsPerGroup }
        : {}),
      ...(form.modality === "swiss" ? { swissRounds } : {}),
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
  const isGroupsPlayoff = form.modality === "groups_playoff";
  const isSwiss = form.modality === "swiss";
  const formatRule = getTournamentFormatUiRule(form.modality);
  const groupConfigurationError = isGroupsPlayoff
    ? getGroupsPlayoffConfigurationError(form)
    : null;
  const qualifiersPerGroup =
    isGroupsPlayoff &&
    form.groupCount >= 2 &&
    form.playoffSpots % form.groupCount === 0
      ? form.playoffSpots / form.groupCount
      : null;

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
                updateModality(event.target.value as TournamentModality)
              }
              disabled={isSubmitting}
            >
              {TOURNAMENT_MODALITIES.map((modality) => (
                <option key={modality} value={modality}>
                  {TOURNAMENT_MODALITY_LABELS[modality]}
                </option>
              ))}
            </select>
          </div>

          {isGroupsPlayoff && (
            <fieldset className="format-configuration field-full">
              <legend>Configuración de grupos y playoff</legend>
              <div className="format-configuration-grid">
                <div className="form-field">
                  <label htmlFor="playoffSpots">Lugares en el playoff</label>
                  <input
                    id="playoffSpots"
                    name="playoffSpots"
                    type="number"
                    min={2}
                    step={1}
                    value={form.playoffSpots}
                    onChange={(event) =>
                      updateGroupConfiguration(
                        "playoffSpots",
                        Number(event.target.value),
                      )
                    }
                    required
                    disabled={isSubmitting}
                  />
                  <span className="field-hint">
                    Debe ser 2, 4, 8, 16 u otra potencia de dos.
                  </span>
                </div>

                <div className="form-field">
                  <label htmlFor="groupCount">Cantidad de grupos</label>
                  <input
                    id="groupCount"
                    name="groupCount"
                    type="number"
                    min={2}
                    max={form.playoffSpots}
                    step={1}
                    value={form.groupCount}
                    onChange={(event) =>
                      updateGroupConfiguration(
                        "groupCount",
                        Number(event.target.value),
                      )
                    }
                    required
                    disabled={isSubmitting}
                  />
                  <span className="field-hint">
                    Debe dividir exactamente los lugares del playoff.
                  </span>
                </div>

                <div className="form-field">
                  <label htmlFor="maxParticipantsPerGroup">
                    Máximo de participantes por grupo
                  </label>
                  <input
                    id="maxParticipantsPerGroup"
                    name="maxParticipantsPerGroup"
                    type="number"
                    min={(qualifiersPerGroup ?? 1) + 1}
                    step={1}
                    value={form.maxParticipantsPerGroup}
                    onChange={(event) =>
                      updateGroupConfiguration(
                        "maxParticipantsPerGroup",
                        Number(event.target.value),
                      )
                    }
                    required
                    disabled={isSubmitting}
                  />
                  <span className="field-hint">
                    El coordinador decide el límite de cada grupo.
                  </span>
                </div>
              </div>

              <div
                className={`format-configuration-summary${
                  groupConfigurationError ? " summary-warning" : ""
                }`}
                role="status"
                aria-live="polite"
              >
                {groupConfigurationError ? (
                  groupConfigurationError
                ) : (
                  <>
                    Clasifican <strong>{qualifiersPerGroup}</strong> por grupo ·
                    Cupo máximo total: <strong>{form.maxParticipants}</strong>
                  </>
                )}
              </div>
            </fieldset>
          )}

          {isSwiss && (
            <fieldset className="format-configuration field-full">
              <legend>Configuración del sistema Suizo</legend>
              <div className="format-configuration-grid">
                <div className="form-field">
                  <label htmlFor="swissRounds">Cantidad de rondas</label>
                  <input
                    id="swissRounds"
                    name="swissRounds"
                    type="number"
                    min={1}
                    max={Math.max(1, form.maxParticipants - 1)}
                    step={1}
                    value={form.swissRounds}
                    onChange={(event) =>
                      updateField("swissRounds", Number(event.target.value))
                    }
                    required
                    disabled={isSubmitting}
                  />
                  <span className="field-hint">
                    Recomendación para {form.maxParticipants} participantes:{" "}
                    {getRecommendedSwissRounds(form.maxParticipants)} rondas.
                  </span>
                </div>
              </div>

              <div
                className={`format-configuration-summary${
                  getSwissConfigurationError(form) ? " summary-warning" : ""
                }`}
                role="status"
                aria-label="Resumen del formato Suizo"
                aria-live="polite"
              >
                {getSwissConfigurationError(form) ?? (
                  <>
                    Máximo sin repetir rivales:{" "}
                    <strong>{Math.max(1, form.maxParticipants - 1)}</strong>{" "}
                    rondas.
                  </>
                )}
              </div>
            </fieldset>
          )}

          <fieldset className="form-field participation-field field-full">
            <legend>Tipo de participación</legend>
            <div className="participation-options">
              <label className="participation-option">
                <input
                  type="radio"
                  name="participationType"
                  value="individual"
                  aria-label="Individual"
                  checked={!form.isTeamTournament}
                  onChange={() => updateField("isTeamTournament", false)}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>Individual</strong>
                  <small>Cada inscripción representa a una persona.</small>
                </span>
              </label>
              <label className="participation-option">
                <input
                  type="radio"
                  name="participationType"
                  value="team"
                  aria-label="Por equipos"
                  checked={form.isTeamTournament}
                  onChange={() => updateField("isTeamTournament", true)}
                  disabled={isSubmitting}
                />
                <span>
                  <strong>Por equipos</strong>
                  <small>Cada inscripción representa a un equipo.</small>
                </span>
              </label>
            </div>
          </fieldset>

          <div className="form-field">
            <label htmlFor="maxParticipants">
              {form.isTeamTournament
                ? "Cupo máximo de equipos"
                : "Cupo máximo de personas"}
            </label>
            <input
              id="maxParticipants"
              name="maxParticipants"
              type="number"
              min={formatRule.minParticipants}
              step={1}
              value={form.maxParticipants}
              onChange={(event) =>
                updateField("maxParticipants", Number(event.target.value))
              }
              required
              readOnly={isGroupsPlayoff}
              disabled={isSubmitting}
            />
            <span className="field-hint">
              {isGroupsPlayoff
                ? "Se calcula automáticamente con la cantidad de grupos y su límite."
                : form.isTeamTournament
                  ? "Cantidad máxima de equipos que podrán inscribirse."
                  : "Cantidad máxima de personas que podrán inscribirse."}
            </span>
            {formatRule.hint && (
              <span className="field-hint">{formatRule.hint}</span>
            )}
          </div>

          {form.isTeamTournament && (
            <>
              <div className="form-field">
                <label htmlFor="minTeamMembers">
                  Mínimo de integrantes por equipo
                </label>
                <input
                  id="minTeamMembers"
                  name="minTeamMembers"
                  type="number"
                  min={2}
                  step={1}
                  value={form.minTeamMembers}
                  onChange={(event) =>
                    updateField("minTeamMembers", Number(event.target.value))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>

              <div className="form-field">
                <label htmlFor="maxTeamMembers">
                  Máximo de integrantes por equipo
                </label>
                <input
                  id="maxTeamMembers"
                  name="maxTeamMembers"
                  type="number"
                  min={2}
                  step={1}
                  value={form.maxTeamMembers}
                  onChange={(event) =>
                    updateField("maxTeamMembers", Number(event.target.value))
                  }
                  aria-describedby="team-members-hint"
                  required
                  disabled={isSubmitting}
                />
              </div>

              <span className="field-hint field-full" id="team-members-hint">
                El capitán cuenta como integrante. El plantel específico se
                seleccionará al inscribir el equipo.
              </span>
            </>
          )}

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
