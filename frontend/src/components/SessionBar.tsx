import { Link, useMatch } from "react-router";

import { useAuthSession } from "../auth/auth-session";

export default function SessionBar() {
  const { session, signOut, retry } = useAuthSession();
  const onLoginPage = useMatch("/login");

  return (
    <nav className="session-bar" aria-label="Cuenta">
      <Link className="secondary-link" to="/">
        Inicio
      </Link>

      <div className="session-controls">
        {session.status === "signedOut" && !onLoginPage && (
          <Link className="secondary-button" to="/login">
            Iniciar sesión
          </Link>
        )}
        {session.status === "checking" && (
          <span role="status">Comprobando sesión…</span>
        )}
        {session.status === "signedIn" && (
          <>
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
