import { Route, Routes } from "react-router";

import DashboardPage from "./pages/DashboardPage";
import CreateTeamPage from "./pages/CreateTeamPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import NotFoundPage from "./pages/NotFoundPage";
import TeamDetailPage from "./pages/TeamDetailPage";
import TeamsPage from "./pages/TeamsPage";
import TournamentDetailPage from "./pages/TournamentDetailPage";
import TournamentsPage from "./pages/TournamentsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/teams" element={<TeamsPage />} />
      <Route path="/teams/new" element={<CreateTeamPage />} />
      <Route path="/teams/:id" element={<TeamDetailPage />} />
      <Route path="/tournaments" element={<TournamentsPage />} />
      <Route path="/tournaments/new" element={<CreateTournamentPage />} />
      <Route path="/tournaments/:id" element={<TournamentDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
