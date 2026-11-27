import { Link, useMatch } from "react-router";

import {
  getCompetitionManagerToken,
  useAuthSession,
} from "../auth/auth-session";

export default function SessionBar() {
  const { session, signOut, retry } = useAuthSession();
  const onLoginPage = useMatch("/login");
  const onRegisterPage = useMatch("/register");

  return (
    <nav className="session-bar" aria-label="Cuenta">
      <Link className="secondary-link" to="/">
        Inicio
      </Link>

      <div className="session-controls">
        {session.status === "signedOut" && !onLoginPage && !onRegisterPage && (
          <>
            <Link className="secondary-button" to="/login">
              Iniciar sesión
            </Link>
            <Link className="secondary-button" to="/register">
              Registrarse
            </Link>
          </>
        )}
        {session.status === "checking" && (
          <span role="status">Comprobando sesión…</span>
        )}
        {session.status === "signedIn" && (
          <>
            {getCompetitionManagerToken(session) && (
              <Link className="secondary-link" to="/my-tournaments">
                Mis torneos
              </Link>
            )}
            <Link className="secondary-link" to="/my-teams">
              Mis equipos
            </Link>
            <Link className="secondary-link" to="/team-requests">
              Solicitudes
            </Link>
            <Link className="secondary-link" to="/notifications">
              Notificaciones
            </Link>
            <p className="session-identity">
              <strong>{session.user.nombre}</strong>
              <span className="session-role">{session.user.role}</span>
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={signOut}
            >
              Cerrar sesión
            </button>
          </>
        )}
        {session.status === "unavailable" && (
          <>
            <span role="status">No pudimos recuperar la sesión.</span>
            <button className="secondary-button" type="button" onClick={retry}>
              Reintentar
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={signOut}
            >
              Cerrar sesión
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
