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
import ResetPasswordPage from './pages/ResetPasswordPage';
import DecisionsListPage from './pages/DecisionsListPage';
import DecisionDetailPage from './pages/DecisionDetailPage';
import DecisionFormPage from './pages/DecisionFormPage';
import AssumptionsListPage from './pages/AssumptionsListPage';
import AssumptionDetailPage from './pages/AssumptionDetailPage';
import AssumptionFormPage from './pages/AssumptionFormPage';
import LegacyBehaviorsListPage from './pages/LegacyBehaviorsListPage';
import LegacyBehaviorDetailPage from './pages/LegacyBehaviorDetailPage';
import LegacyBehaviorFormPage from './pages/LegacyBehaviorFormPage';
import TestCasesListPage from './pages/TestCasesListPage';
import TestCaseDetailPage from './pages/TestCaseDetailPage';
import TestCaseFormPage from './pages/TestCaseFormPage';
import DefectsListPage from './pages/DefectsListPage';
import DefectDetailPage from './pages/DefectDetailPage';
import DefectFormPage from './pages/DefectFormPage';

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
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/requirements" element={<RequirementsListPage />} />
            <Route path="/requirements/new" element={<RequirementFormPage />} />
            <Route path="/requirements/:reqId" element={<RequirementDetailPage />} />
            <Route path="/requirements/:reqId/edit" element={<RequirementFormPage />} />
            <Route path="/decisions" element={<DecisionsListPage />} />
            <Route path="/decisions/new" element={<DecisionFormPage />} />
            <Route path="/decisions/:id" element={<DecisionDetailPage />} />
            <Route path="/decisions/:id/edit" element={<DecisionFormPage />} />
            <Route path="/assumptions" element={<AssumptionsListPage />} />
            <Route path="/assumptions/new" element={<AssumptionFormPage />} />
            <Route path="/assumptions/:id" element={<AssumptionDetailPage />} />
            <Route path="/assumptions/:id/edit" element={<AssumptionFormPage />} />
            <Route path="/legacy-behaviors" element={<LegacyBehaviorsListPage />} />
            <Route path="/legacy-behaviors/new" element={<LegacyBehaviorFormPage />} />
            <Route path="/legacy-behaviors/:id" element={<LegacyBehaviorDetailPage />} />
            <Route path="/legacy-behaviors/:id/edit" element={<LegacyBehaviorFormPage />} />
            <Route path="/test-cases" element={<TestCasesListPage />} />
            <Route path="/test-cases/new" element={<TestCaseFormPage />} />
            <Route path="/test-cases/:id" element={<TestCaseDetailPage />} />
            <Route path="/test-cases/:id/edit" element={<TestCaseFormPage />} />
            <Route path="/defects" element={<DefectsListPage />} />
            <Route path="/defects/new" element={<DefectFormPage />} />
            <Route path="/defects/:id" element={<DefectDetailPage />} />
            <Route path="/defects/:id/edit" element={<DefectFormPage />} />
            <Route path="/stakeholders" element={<StakeholdersPage />} />
            <Route path="/systems" element={<SystemsPage />} />
            <Route path="/users" element={<UsersPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
