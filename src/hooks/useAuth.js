import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // VERIFICAR SESSÃO AO INICIAR
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação...');
        const session = await authService.verifySession();
        
        if (session) {
          console.log('✅ Sessão válida para:', session.user.email);
          setUser(session.user);
        } else {
          console.log('❌ Sessão inválida ou expirada');
          setUser(null);
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // REGISTRO
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📝 Iniciando registro...');
      const result = await authService.register(userData);
      
      if (result.success) {
        console.log('✅ Registro bem-sucedido');
        return { 
          success: true, 
          message: result.message,
          requiresLogin: true
        };
      }
      
      return { success: false, error: result.error };
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // LOGIN - AGORA SEM REDIRECIONAMENTO AUTOMÁTICO
  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔐 Tentando login...');
      const result = await authService.login(email, password);
      
      if (result.success) {
        console.log('✅ Login bem-sucedido');
        setUser(result.session.user);
        
        // Apenas retorna sucesso, o App.jsx cuida do redirecionamento
        return { 
          success: true, 
          message: result.message,
          user: result.session.user
        };
      }
      
      return { success: false, error: result.error };
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // LOGOUT
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setError(null);
  }, []);

  // VERIFICAR EMAIL EM TEMPO REAL
  const checkEmail = useCallback(async (email) => {
    try {
      return await authService.checkEmailExists(email);
    } catch (error) {
      console.error('Erro ao verificar email:', error);
      return false;
    }
  }, []);

  // ATUALIZAR DADOS DO USUÁRIO
  const refreshUser = useCallback(async () => {
    if (!user) return null;
    
    try {
      const session = await authService.verifySession();
      if (session) {
        setUser(session.user);
      }
      return session?.user || null;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      return null;
    }
  }, [user]);

  return {
    // Estado
    user,
    loading,
    error,
    
    // Status
    isAuthenticated: !!user,
    isRegistered: !!user,
    
    // Ações
    register,
    login,
    logout,
    checkEmail,
    refreshUser,
    
    // Helper para atualizar usuário
    setUser: setUser // Exportar setUser para atualizações
  };
};