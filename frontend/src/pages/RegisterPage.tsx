import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router";

import { register } from "../api/auth.api";
import { ApiError } from "../api/client";
import { useAuthSession } from "../auth/auth-session";

export default function RegisterPage() {
  const { session } = useAuthSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const disabled = submitting || session.status === "checking";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const fields = new FormData(event.currentTarget);
    setError(null);
    setSubmitting(true);

    try {
      const email = await register({
        nombre: String(fields.get("nombre") ?? "").trim(),
        email: String(fields.get("email") ?? "").trim(),
        password: String(fields.get("password") ?? ""),
      });
      setRegisteredEmail(email);
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
  if (registeredEmail) {
    return <Navigate to="/login" replace state={{ registeredEmail }} />;
  }

  return (
    <main className="app-shell auth-page">
      <header className="form-header">
        <h1>Registrarse</h1>
      </header>

      <form
        className="form-card"
        onSubmit={handleSubmit}
        aria-busy={submitting}
      >
        <div className="auth-form-fields">
          <div className="form-field">
            <label htmlFor="register-name">Nombre</label>
            <input
              id="register-name"
              name="nombre"
              autoComplete="name"
              required
              minLength={2}
              maxLength={100}
              disabled={disabled}
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-email">Correo electrónico</label>
            <input
              id="register-email"
              name="email"
              type="email"
              autoComplete="username"
              required
              maxLength={254}
              disabled={disabled}
            />
          </div>

          <div className="form-field">
            <label htmlFor="register-password">Contraseña</label>
            <input
              id="register-password"
              name="password"
              type="password"
              autoComplete="new-password"
              aria-describedby="register-password-help"
              required
              minLength={8}
              disabled={disabled}
            />
            <small className="field-hint" id="register-password-help">
              Mínimo 8 caracteres.
            </small>
          </div>
        </div>

        {error && (
          <p className="form-feedback feedback-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <Link className="secondary-link" to="/login">
            Ya tengo cuenta
          </Link>
          <button className="primary-button" type="submit" disabled={disabled}>
            {submitting ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </div>
      </form>
    </main>
  );
}
