import { Route, Routes } from "react-router";

import DashboardPage from "./pages/DashboardPage";
import CreateTournamentPage from "./pages/CreateTournamentPage";
import NotFoundPage from "./pages/NotFoundPage";
import TournamentsPage from "./pages/TournamentsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/tournaments" element={<TournamentsPage />} />
      <Route path="/tournaments/new" element={<CreateTournamentPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
