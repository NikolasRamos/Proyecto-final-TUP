import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";

import { ApiError } from "../api/client";
import {
  decideTeamRequest,
  listTeamRequests,
  type MembershipDecision,
  type MembershipRequest,
  type MembershipStatus,
} from "../api/team-memberships.api";
import { useAuthSession } from "../auth/auth-session";
import AccountPagination from "../components/AccountPagination";
import type { PaginatedResponse } from "../types/api";

const statusText: Record<MembershipStatus, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
};

export default function TeamRequestsPage() {
  const { session } = useAuthSession();
  const token = session.status === "signedIn" ? session.token : undefined;
  const [query, setQuery] = useSearchParams();
  const box = query.get("box") === "sent" ? "sent" : "received";
  const page = Math.max(1, Number.parseInt(query.get("page") ?? "1", 10) || 1);
  const requestId = query.get("requestId") ?? undefined;
  const [result, setResult] = useState<{
    key: string;
    value: PaginatedResponse<MembershipRequest>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null,
  );
  const [busy, setBusy] = useState<number | null>(null);
  const key = `${box}:${page}:${requestId ?? ""}`;
  const data = result?.key === key ? result.value : null;
  const message = error?.key === key ? error.message : null;

  useEffect(() => {
    if (!token) return;
    const request = new AbortController();
    void listTeamRequests(box, page, token, request.signal, requestId).then(
      (value) => {
        if (!request.signal.aborted) setResult({ key, value });
      },
      () => {
        if (!request.signal.aborted)
          setError({ key, message: "No se pudieron cargar las solicitudes." });
      },
    );
    return () => request.abort();
  }, [box, page, key, requestId, token]);

  async function decide(item: MembershipRequest, status: MembershipDecision) {
    if (!token || busy !== null) return;
    setBusy(item.id);
    setError(null);
    try {
      const answer = await decideTeamRequest(item, status, token);
      setResult((current) =>
        current?.key === key
          ? {
              key,
              value: {
                ...current.value,
                data: current.value.data.map((row) =>
                  row.id === item.id
                    ? { ...row, status: answer.data.status }
                    : row,
                ),
              },
            }
          : current,
      );
    } catch (failure) {
      setError({
        key,
        message:
          failure instanceof ApiError
            ? failure.message
            : "No se pudo guardar la respuesta.",
      });
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="app-shell list-page">
      <h1>Solicitudes e invitaciones</h1>
      <div className="hero-actions">
        <Link
          className="secondary-button"
          to="?box=received"
          aria-current={box === "received" ? "page" : undefined}
        >
          Recibidas
        </Link>
        <Link
          className="secondary-button"
          to="?box=sent"
          aria-current={box === "sent" ? "page" : undefined}
        >
          Enviadas
        </Link>
      </div>
      {message && (
        <p className="feedback-message feedback-error" role="alert">
          {message}
        </p>
      )}
      {!data && !message && <p role="status">Cargando solicitudes…</p>}
      {data && (
        <>
          {data.data.length === 0 && (
            <p>No hay solicitudes ni invitaciones en esta página.</p>
          )}
          <div className="resource-list">
            {data.data.map((item) => (
              <article className="resource-card" key={item.id}>
                <h2>
                  <Link to={`/teams/${item.teamId}`}>{item.teamName}</Link>
                </h2>
                <p>
                  {item.kind === "request"
                    ? "Solicitud de ingreso"
                    : "Invitación"}{" "}
                  · {item.memberName ?? "Cuenta sin acceso"}
                </p>
                <p role="status">{statusText[item.status]}</p>
                {box === "received" && item.status === "pending" && (
                  <div className="detail-actions">
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void decide(item, "rejected")}
                    >
                      Rechazar
                    </button>
                    <button
                      className="primary-button"
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void decide(item, "accepted")}
                    >
                      Aceptar
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
          <AccountPagination
            page={page}
            totalPages={data.pagination.totalPages}
            onPage={(next) => setQuery({ box, page: String(next) })}
          />
        </>
      )}
    </main>
  );
}
