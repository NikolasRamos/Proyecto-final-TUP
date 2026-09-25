import { Link, Route, Routes } from "react-router";

const modules = [
  "Usuarios y roles",
  "Torneos",
  "Equipos",
  "Partidas y resultados",
  "Clasificaciones",
  "Estadísticas",
];

function HomePage() {
  return (
    <main className="app-shell">
      <section className="hero" aria-labelledby="page-title">
        <span className="eyebrow">React + TypeScript</span>
        <h1 id="page-title">Sistema de Gestión de Torneos</h1>
        <p>
          El frontend ya está preparado para construir la experiencia de
          administradores, organizadores y participantes.
        </p>
      </section>

      <section aria-labelledby="modules-title">
        <h2 id="modules-title">Módulos planificados</h2>
        <ul className="module-grid">
          {modules.map((module) => (
            <li key={module}>{module}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function NotFoundPage() {
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
