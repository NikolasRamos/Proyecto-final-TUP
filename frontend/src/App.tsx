import { Navigate, Outlet, Route, Routes } from "react-router";

import AuthProvider from "./auth/AuthProvider";
import {
  getCompetitionManagerToken,
  getTeamCreatorToken,
  useAuthSession,
} from "./auth/auth-session";
import SessionBar from "./components/SessionBar";
import DashboardPage from "./pages/DashboardPage";
import CreateTeamPage from "./pages/CreateTeamPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import LoginPage from "./pages/LoginPage";
import MyTeamsPage from "./pages/MyTeamsPage";
import NotFoundPage from "./pages/NotFoundPage";
import NotificationsPage from "./pages/NotificationsPage";
import RegisterPage from "./pages/RegisterPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TeamRequestsPage from "./pages/TeamRequestsPage";
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
  return session.status === "signedIn" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" replace />
  );
}

function RequireCreationAccess({
  resource,
}: {
  resource: "teams" | "tournaments";
}) {
  const { session } = useAuthSession();
  if (session.status === "checking") return null;
  if (session.status !== "signedIn") return <Navigate to="/login" replace />;
  const token =
    resource === "teams"
      ? getTeamCreatorToken(session)
      : getCompetitionManagerToken(session);
  return token ? <Outlet /> : <Navigate to={`/${resource}`} replace />;
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
        <Route path="/my-teams" element={<MyTeamsPage />} />
        <Route path="/team-requests" element={<TeamRequestsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
      </Route>
      <Route element={<RequireCreationAccess resource="teams" />}>
        <Route path="/teams/new" element={<CreateTeamPage />} />
      </Route>
      <Route element={<RequireCreationAccess resource="tournaments" />}>
        <Route path="/tournaments/new" element={<CreateTournamentPage />} />
        <Route path="/my-tournaments" element={<TournamentsPage mine />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
