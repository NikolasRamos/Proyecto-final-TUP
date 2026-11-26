import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router";

import {
  getMembershipState,
  inviteTeamMember,
  requestTeamMembership,
  type MembershipState,
} from "../api/team-memberships.api";
import { ApiError } from "../api/client";

export default function TeamMembershipPanel({
  teamId,
  token,
  isCaptain,
}: {
  teamId: number;
  token: string;
  isCaptain: boolean;
}) {
  const [membership, setMembership] = useState<MembershipState | null>(null);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    error: boolean;
  } | null>(null);

  useEffect(() => {
    if (isCaptain) return;
    const request = new AbortController();
    void getMembershipState(teamId, token, request.signal).then(
      ({ data }) => {
        if (!request.signal.aborted) setMembership(data.state);
      },
      () => {
        if (!request.signal.aborted)
          setNotice({
            message: "No se pudo consultar tu membresía.",
            error: true,
          });
      },
    );
    return () => request.abort();
  }, [teamId, token, isCaptain]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setNotice(null);
    try {
      if (isCaptain) {
        await inviteTeamMember(teamId, email.trim(), token);
        setEmail("");
        setNotice({ message: "Invitación enviada.", error: false });
      } else {
        await requestTeamMembership(teamId, token);
        setMembership("request");
        setNotice({ message: "Solicitud enviada al capitán.", error: false });
      }
    } catch (failure) {
      setNotice({
        message:
          failure instanceof ApiError
            ? failure.message
            : "No se pudo completar el envío.",
        error: true,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="detail-card" aria-labelledby="team-membership-title">
      <h2 id="team-membership-title">
        {isCaptain ? "Invitar a una cuenta" : "Ingreso al equipo"}
      </h2>
      {(isCaptain || membership === "available") && (
        <form onSubmit={handleSubmit}>
          {isCaptain && (
            <div className="form-field">
              <label htmlFor="invited-email">
                Correo de la cuenta registrada
              </label>
              <input
                id="invited-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                disabled={pending}
              />
            </div>
          )}
          <div className="form-actions">
            <button className="primary-button" type="submit" disabled={pending}>
              {pending
                ? "Enviando…"
                : isCaptain
                  ? "Enviar invitación"
                  : "Pedir ingreso"}
            </button>
          </div>
        </form>
      )}
      {!isCaptain && membership === null && !notice && (
        <p role="status">Consultando tu membresía…</p>
      )}
      {membership === "member" && <p>Ya formás parte del equipo.</p>}
      {membership === "request" && !notice && (
        <p>Tu solicitud está pendiente.</p>
      )}
      {membership === "invitation" && (
        <p>Tenés una invitación pendiente para este equipo.</p>
      )}
      {membership === "unavailable" && (
        <p>Este equipo todavía necesita una cuenta capitana.</p>
      )}
      {notice && (
        <p
          className={`form-feedback feedback-${notice.error ? "error" : "success"}`}
          role={notice.error ? "alert" : "status"}
        >
          {notice.message}
        </p>
      )}
      <Link className="secondary-link" to="/team-requests">
        Ver solicitudes e invitaciones
      </Link>
    </section>
  );
}
