import { createContext, useContext } from "react";

import type { SessionUser } from "../types/auth";

export type SessionState =
  | { status: "signedOut" }
  | { status: "checking" | "unavailable"; token: string }
  | { status: "signedIn"; token: string; user: SessionUser };

interface AuthSession {
  session: SessionState;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  retry(): void;
}

export const AuthContext = createContext<AuthSession | null>(null);

export function useAuthSession(): AuthSession {
  const session = useContext(AuthContext);
  if (!session) throw new Error("Falta configurar el proveedor de sesión");
  return session;
}
