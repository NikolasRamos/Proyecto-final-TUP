import { useEffect, useState } from "react";
import { Link } from "react-router";

import { ApiError } from "../api/client";
import {
  listNotifications,
  markNotificationRead,
  type NotificationPage,
  type TeamNotification,
} from "../api/notifications.api";
import { useAuthSession } from "../auth/auth-session";
import AccountPagination from "../components/AccountPagination";

const dateTime = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function describeEvent(item: TeamNotification) {
  if (item.event === "received") {
    return item.kind === "request"
      ? "Recibiste una solicitud de ingreso"
      : "Recibiste una invitación";
  }
  const subject = item.kind === "request" ? "Tu solicitud" : "Tu invitación";
  return `${subject} fue ${item.status === "accepted" ? "aceptada" : "rechazada"}`;
}

export default function NotificationsPage() {
  const { session } = useAuthSession();
  const token = session.status === "signedIn" ? session.token : undefined;
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<NotificationPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reading, setReading] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    void listNotifications(page, token, controller.signal).then(
      (value) => {
        if (!controller.signal.aborted) setResult(value);
      },
      () => {
        if (!controller.signal.aborted)
          setError("No se pudieron cargar tus notificaciones.");
      },
    );
    return () => controller.abort();
  }, [attempt, page, token]);

  async function markRead(item: TeamNotification) {
    if (!token || reading !== null || item.isRead) return;
    setReading(item.requestId);
    setError(null);
    try {
      await markNotificationRead(item.requestId, token);
      setResult(
        (current) =>
          current && {
            ...current,
            unread: Math.max(0, current.unread - 1),
            data: current.data.map((notice) =>
              notice.requestId === item.requestId
                ? { ...notice, isRead: true }
                : notice,
            ),
          },
      );
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "No se pudo marcar el aviso como leído.",
      );
    } finally {
      setReading(null);
    }
  }

  return (
    <main className="app-shell list-page">
      <header className="list-page-header">
        <div>
          <h1>Notificaciones</h1>
          {result && (
            <p role="status">
              {result.unread} {result.unread === 1 ? "aviso" : "avisos"} sin
              leer
            </p>
          )}
        </div>
      </header>
      {error && (
        <p className="feedback-message feedback-error" role="alert">
          {error}
        </p>
      )}
      {!result && !error && <p role="status">Cargando notificaciones…</p>}
      {!result && error && (
        <button
          className="secondary-button"
          type="button"
          onClick={() => {
            setError(null);
            setAttempt((value) => value + 1);
          }}
        >
          Reintentar
        </button>
      )}
      {result && (
        <>
          {result.data.length === 0 && (
            <p>No hay notificaciones en esta página.</p>
          )}
          <div className="resource-list">
            {result.data.map((item) => (
              <article className="resource-card" key={item.requestId}>
                <div className="resource-card-heading">
                  <div>
                    <h2>{describeEvent(item)}</h2>
                    <p>
                      <Link to={`/teams/${item.teamId}`}>{item.teamName}</Link>{" "}
                      ·{" "}
                      <time dateTime={item.createdAt}>
                        {dateTime.format(new Date(item.createdAt))}
                      </time>
                    </p>
                  </div>
                  {!item.isRead && (
                    <strong className="resource-kind">Sin leer</strong>
                  )}
                </div>
                <div className="hero-actions">
                  <Link
                    className="secondary-link"
                    to={`/team-requests?box=${item.event === "received" ? "received" : "sent"}&requestId=${item.requestId}`}
                  >
                    {item.event === "received" && item.status === "pending"
                      ? "Ir a responder"
                      : "Ver trámite"}
                  </Link>
                  {!item.isRead && (
                    <button
                      className="secondary-button"
                      type="button"
                      disabled={reading !== null}
                      onClick={() => void markRead(item)}
                    >
                      Marcar como leída
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <AccountPagination
            page={page}
            totalPages={result.pagination.totalPages}
            disabled={reading !== null}
            onPage={(next) => {
              setError(null);
              setResult(null);
              setPage(next);
            }}
          />
        </>
      )}
    </main>
  );
}
