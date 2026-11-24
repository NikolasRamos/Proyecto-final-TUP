import { useState, type FormEvent } from "react";
import { Navigate } from "react-router";

import { ApiError } from "../api/client";
import { useAuthSession } from "../auth/auth-session";

export default function LoginPage() {
  const { session, signIn } = useAuthSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || session.status === "checking") return;

    setError(null);
    setSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (failure) {
      setError(
        failure instanceof ApiError
          ? failure.message
          : "No pudimos conectarnos con el servidor. Volvé a intentar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (session.status === "signedIn") return <Navigate to="/" replace />;

  const disabled = submitting || session.status === "checking";

  return (
    <main className="app-shell auth-page">
      <header className="form-header">
        <h1>Iniciar sesión</h1>
      </header>

      <form
        className="form-card"
        onSubmit={handleSubmit}
        aria-busy={submitting}
      >
        <div className="auth-form-fields">
          <div className="form-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="form-field">
            <label htmlFor="login-password">Contraseña</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={100}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        {error && (
          <p className="form-feedback feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={disabled}>
            {submitting ? "Iniciando sesión…" : "Iniciar sesión"}
          </button>
        </div>
      </form>
    </main>
  );
}
