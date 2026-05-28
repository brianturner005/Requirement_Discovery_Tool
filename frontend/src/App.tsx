import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import DashboardPage from './pages/DashboardPage';
import RequirementsListPage from './pages/RequirementsListPage';
import RequirementDetailPage from './pages/RequirementDetailPage';
import RequirementFormPage from './pages/RequirementFormPage';
import StakeholdersPage from './pages/StakeholdersPage';
import SystemsPage from './pages/SystemsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/requirements" element={<RequirementsListPage />} />
          <Route path="/requirements/new" element={<RequirementFormPage />} />
          <Route path="/requirements/:reqId" element={<RequirementDetailPage />} />
          <Route path="/requirements/:reqId/edit" element={<RequirementFormPage />} />
          <Route path="/stakeholders" element={<StakeholdersPage />} />
          <Route path="/systems" element={<SystemsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
