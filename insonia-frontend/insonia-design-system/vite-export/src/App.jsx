import React from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from './lib/api.js';

import ProtectedRoute from './components/ProtectedRoute.jsx';
import AppLayout from './components/AppLayout.jsx';

import Login from './pages/auth/Login.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';
import OAuthCallback from './pages/auth/OAuthCallback.jsx';

import Dashboard from './pages/Dashboard.jsx';
import PDV from './pages/PDV.jsx';
import Produtos from './pages/Produtos.jsx';
import Categorias from './pages/Categorias.jsx';
import Marcas from './pages/Marcas.jsx';
import Variacoes from './pages/Variacoes.jsx';
import Historico from './pages/Historico.jsx';
import Estatisticas from './pages/Estatisticas.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public auth routes */}
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/forgot-password" element={<ForgotRoute />} />
      <Route path="/reset-password" element={<ResetRoute />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Protected app routes */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pdv" element={<PDV />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/categorias" element={<Categorias />} />
        <Route path="/marcas" element={<Marcas />} />
        <Route path="/variacoes" element={<Variacoes />} />
        <Route path="/historico" element={<Historico />} />
        <Route path="/estatisticas" element={<Estatisticas />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  if (auth.getToken()) return <Navigate to="/" replace />;
  return (
    <Login
      onLogin={() => navigate('/', { replace: true })}
      onForgot={() => navigate('/forgot-password')}
    />
  );
}

function ForgotRoute() {
  const navigate = useNavigate();
  return <ForgotPassword onBack={() => navigate('/login')} />;
}

function ResetRoute() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  return <ResetPassword token={token} onDone={() => navigate('/login', { replace: true })} />;
}
