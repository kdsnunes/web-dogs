import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/authentication/AuthProvider';
import { ProtectedRoute } from './modules/authentication/ProtectedRoute';
import { LoginPage } from './modules/authentication/LoginPage';
import { SignupPage } from './modules/authentication/SignupPage';
import { OrgGate } from './modules/settings/OrgGate';
import { SettingsPage } from './modules/settings/SettingsPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { DogsPage } from './modules/dogs/DogsPage';
import { HealthPage } from './modules/health/HealthPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { PontoPage } from './modules/time/PontoPage';
import { ReportsPage } from './modules/reports/ReportsPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro" element={<SignupPage />} />
        <Route
          element={
            <ProtectedRoute>
              <OrgGate>
                <AppLayout />
              </OrgGate>
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/caes" element={<DogsPage />} />
          <Route path="/saude" element={<HealthPage />} />
          <Route path="/estoque" element={<InventoryPage />} />
          <Route path="/ponto" element={<PontoPage />} />
          <Route path="/relatorios" element={<ReportsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
