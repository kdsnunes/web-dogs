import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './modules/authentication/AuthProvider';
import { ProtectedRoute } from './modules/authentication/ProtectedRoute';
import { LoginPage } from './modules/authentication/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './modules/dashboard/DashboardPage';
import { DogsPage } from './modules/dogs/DogsPage';
import { HealthPage } from './modules/health/HealthPage';
import { InventoryPage } from './modules/inventory/InventoryPage';
import { ComingSoon } from './components/ComingSoon';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/caes" element={<DogsPage />} />
          <Route path="/saude" element={<HealthPage />} />
          <Route path="/estoque" element={<InventoryPage />} />
          <Route path="/ponto" element={<ComingSoon title="Ponto dos Funcionários" />} />
          <Route path="/relatorios" element={<ComingSoon title="Relatórios" />} />
          <Route path="/configuracoes" element={<ComingSoon title="Configurações" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
