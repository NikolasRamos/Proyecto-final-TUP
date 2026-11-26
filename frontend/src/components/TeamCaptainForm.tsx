import { useEffect, useRef, useState, type FormEvent } from "react";

import { apiGet, ApiError } from "../api/client";
import { assignTeamCaptain } from "../api/teams.api";
import type { TeamResponse } from "../types/team";

type AccountPage = {
  data: { idUsuario: number; nombre: string; email: string }[];
  totalPages: number;
};

export default function TeamCaptainForm({
  teamId,
  token,
  onAssigned,
  onCancel,
}: {
  teamId: number;
  token: string;
  onAssigned: (response: TeamResponse) => void;
  onCancel: () => void;
}) {
  const [page, setPage] = useState(1);
  const [accounts, setAccounts] = useState<AccountPage | null>(null);
  const [captain, setCaptain] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    void apiGet<AccountPage>(`/api/users?page=${page}&limit=20`, {
      token,
      signal: controller.signal,
    }).then(
      (result) => {
        if (!controller.signal.aborted) setAccounts(result);
      },
      () => {
        if (!controller.signal.aborted)
          setError("No se pudieron cargar las cuentas.");
      },
    );
    return () => controller.abort();
  }, [page, token]);

  function changePage(nextPage: number) {
    setAccounts(null);
    setCaptain("");
    setError(null);
    setPage(nextPage);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving || !captain) return;

    const activeRequest = request.current;
    setSaving(true);
    setError(null);
    try {
      const result = await assignTeamCaptain(teamId, Number(captain), token);
      if (!activeRequest?.signal.aborted) onAssigned(result);
    } catch (failure) {
      if (!activeRequest?.signal.aborted) {
        setError(
          failure instanceof ApiError
            ? failure.message
            : "No se pudo asignar el capitán.",
        );
      }
    } finally {
      if (!activeRequest?.signal.aborted) setSaving(false);
    }
  }

  return (
    <form
      className="form-card detail-card"
      onSubmit={handleSubmit}
      aria-labelledby="assign-captain-title"
    >
      <h2 id="assign-captain-title">Asignar capitán</h2>
      {!accounts && !error && <p role="status">Cargando cuentas…</p>}
      {accounts?.data.length === 0 && <p>No hay cuentas en esta página.</p>}
      {accounts && accounts.data.length > 0 && (
        <div className="form-field">
          <label htmlFor="captain-account">Cuenta para capitán</label>
          <select
            id="captain-account"
            value={captain}
            onChange={(event) => setCaptain(event.target.value)}
            required
            disabled={saving}
          >
            <option value="">Seleccioná una cuenta</option>
            {accounts.data.map((account) => (
              <option key={account.idUsuario} value={account.idUsuario}>
                {account.nombre} ({account.email})
              </option>
            ))}
          </select>
        </div>
      )}
      {accounts && (page > 1 || accounts.totalPages > 1) && (
        <div className="pagination" aria-label="Páginas de cuentas">
          <button
            type="button"
            onClick={() => changePage(page - 1)}
            disabled={saving || page <= 1}
          >
            Anterior
          </button>
          <span>Página {page}</span>
          <button
            type="button"
            onClick={() => changePage(page + 1)}
            disabled={saving || page >= accounts.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}
      {error && (
        <p className="form-feedback feedback-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button
          className="secondary-button"
          type="button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
        <button
          className="primary-button"
          type="submit"
          disabled={!captain || saving}
        >
          {saving ? "Guardando…" : "Guardar capitán"}
        </button>
      </div>
    </form>
  );
}
