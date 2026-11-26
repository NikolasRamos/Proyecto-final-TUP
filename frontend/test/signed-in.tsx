import type { ReactNode } from "react";

import { AuthContext } from "../src/auth/auth-session";

export const testToken = "token-de-prueba";

export function SignedInTestProvider({ children }: { children: ReactNode }) {
  return (
    <AuthContext.Provider
      value={{
        session: {
          status: "signedIn",
          token: testToken,
          user: {
            idUsuario: 1,
            nombre: "Usuario de prueba",
            email: "usuario@example.test",
            idRol: 2,
            role: "organizador",
          },
        },
        async signIn() {},
        signOut() {},
        retry() {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
