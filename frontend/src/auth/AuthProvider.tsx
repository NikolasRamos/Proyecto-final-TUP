import { useEffect, useState, type ReactNode } from "react";

import { getCurrentSession, login } from "../api/auth.api";
import { ApiError } from "../api/client";
import { AuthContext, type SessionState } from "./auth-session";

const sessionKey = "gestion-torneos.session";

function initialSession(): SessionState {
  try {
    const token = window.sessionStorage.getItem(sessionKey);
    if (token) return { status: "checking", token };
  } catch {
    // La sesión puede funcionar en memoria si el navegador bloquea el almacenamiento.
  }

  return { status: "signedOut" };
}

function rememberSession(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(sessionKey, token);
    else window.sessionStorage.removeItem(sessionKey);
  } catch {
    // La sesión en memoria sigue disponible.
  }
}

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>(initialSession);

  useEffect(() => {
    if (session.status !== "checking") return;

    const { token } = session;
    const request = new AbortController();

    void getCurrentSession(token, request.signal).then(
      (user) => {
        if (!request.signal.aborted) {
          setSession({ status: "signedIn", token, user });
        }
      },
      (error: unknown) => {
        if (request.signal.aborted) return;

        if (error instanceof ApiError && [401, 403].includes(error.status)) {
          rememberSession(null);
          setSession({ status: "signedOut" });
        } else {
          setSession({ status: "unavailable", token });
        }
      },
    );

    return () => request.abort();
  }, [session]);

  async function signIn(email: string, password: string) {
    const token = await login({ email, password });
    const user = await getCurrentSession(token);
    rememberSession(token);
    setSession({ status: "signedIn", token, user });
  }

  function signOut() {
    rememberSession(null);
    setSession({ status: "signedOut" });
  }

  function retry() {
    setSession((current) =>
      current.status === "unavailable"
        ? { status: "checking", token: current.token }
        : current,
    );
  }

  return (
    <AuthContext.Provider value={{ session, signIn, signOut, retry }}>
      {children}
    </AuthContext.Provider>
  );
}
