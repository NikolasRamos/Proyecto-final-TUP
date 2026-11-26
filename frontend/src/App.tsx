import { Navigate, Outlet, Route, Routes } from "react-router";

import AuthProvider from "./auth/AuthProvider";
import { useAuthSession } from "./auth/auth-session";
import SessionBar from "./components/SessionBar";
import DashboardPage from "./pages/DashboardPage";
import CreateTeamPage from "./pages/CreateTeamPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import RegisterPage from "./pages/RegisterPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TeamsPage from "./pages/TeamsPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TournamentsPage from "./pages/TournamentsPage";

export default function App() {
  return (
    <AuthProvider>
      <SessionBar />
      <AppRoutes />
    </AuthProvider>
  );
}

function RequireSession() {
  const { session } = useAuthSession();
  if (session.status === "checking") return null;
  if (session.status !== "signedIn") return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppRoutes() {
  const { session } = useAuthSession();

  return (
    <Routes
      key={session.status === "signedIn" ? session.user.idUsuario : "guest"}
    >
      <Route path="/" element={<DashboardPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/teams/:id" element={<TeamDetailPage />} />
      <Route path="/tournaments" element={<TournamentsPage />} />
      <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
      <Route element={<RequireSession />}>
        <Route path="/teams/new" element={<CreateTeamPage />} />
        <Route path="/tournaments/new" element={<CreateTournamentPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
