import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/auth';

import LoginPage from './pages/LoginPage';
import MesaLandingPage from './pages/MesaLandingPage';
import CardapioPage from './pages/CardapioPage';
import ComandaPage from './pages/ComandaPage';
import TerminalPage from './pages/TerminalPage';
import GarcomPage from './pages/GarcomPage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminTerminaisPage from './pages/admin/TerminaisPage';
import AdminCardapioPage from './pages/admin/CardapioPage';
import AdminMesasPage from './pages/admin/MesasPage';
import AdminEstoquePage from './pages/admin/EstoquePage';
import AdminGarconsPage from './pages/admin/GarconsPage';
import AdminLayout from './components/AdminLayout';

function PrivateRoute({ children, roles }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/mesa/:mesaId" element={<MesaLandingPage />} />
      <Route path="/mesa/:mesaId/cardapio/:comandaId" element={<CardapioPage />} />
      <Route path="/mesa/:mesaId/comanda/:comandaId" element={<ComandaPage />} />
      <Route path="/terminal/:terminalId" element={<TerminalPage />} />

      {/* Garçom */}
      <Route path="/garcom" element={
        <PrivateRoute roles={['GARCOM', 'CAIXA', 'ADMIN', 'GERENTE']}>
          <GarcomPage />
        </PrivateRoute>
      } />

      {/* Admin */}
      <Route path="/admin" element={
        <PrivateRoute roles={['ADMIN', 'GERENTE']}>
          <AdminLayout />
        </PrivateRoute>
      }>
        <Route index element={<AdminDashboardPage />} />
        <Route path="terminais" element={<AdminTerminaisPage />} />
        <Route path="cardapio" element={<AdminCardapioPage />} />
        <Route path="mesas" element={<AdminMesasPage />} />
        <Route path="estoque" element={<AdminEstoquePage />} />
        <Route path="garcons" element={<AdminGarconsPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
