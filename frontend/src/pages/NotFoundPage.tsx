import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <main className="app-shell">
      <section className="hero">
        <span className="eyebrow">Error 404</span>
        <h1>Página no encontrada</h1>
        <Link className="home-link" to="/">
          Volver al inicio
        </Link>
      </section>
    </main>
  );
}
