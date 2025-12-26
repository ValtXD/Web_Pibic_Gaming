import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Auth from './components/auth/Auth';
import Dashboard from './pages/Dashboard';
import HomePage from './pages/HomePage';
import { useAuth } from './hooks/useAuth';

// Componente de rota protegida - ATUALIZADO
const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { isAuthenticated, loading, sessionVerified } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  // Só redirecionar quando tiver certeza que não está autenticado
  if (!isAuthenticated && sessionVerified) {
    return <Navigate to={redirectTo} replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Página de login/registro - pública */}
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        
        {/* Home Page com StartScreen - PROTEGIDO */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } 
        />
        
        {/* Dashboard - PROTEGIDO */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirecionamentos padrão */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Depois do login, redirecionar para /home */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;