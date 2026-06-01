import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import { useAuth } from './context/AuthContext';
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import RequirementsListPage from './pages/RequirementsListPage';
import RequirementDetailPage from './pages/RequirementDetailPage';
import RequirementFormPage from './pages/RequirementFormPage';
import StakeholdersPage from './pages/StakeholdersPage';
import SystemsPage from './pages/SystemsPage';
import UsersPage from './pages/UsersPage';

function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requirements" element={<RequirementsListPage />} />
            <Route path="/requirements/new" element={<RequirementFormPage />} />
            <Route path="/requirements/:reqId" element={<RequirementDetailPage />} />
            <Route path="/requirements/:reqId/edit" element={<RequirementFormPage />} />
            <Route path="/stakeholders" element={<StakeholdersPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
