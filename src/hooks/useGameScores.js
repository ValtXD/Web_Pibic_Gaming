import { useState, useEffect, useCallback } from 'react';
import { scoresService } from '../services/scores';

export const useGameScores = () => {
  const [scores, setScores] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar pontuações do usuário
  const loadScores = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userScores = await scoresService.getUserScores();
      setScores(userScores);
      return userScores;
    } catch (error) {
      console.error('Erro ao carregar pontuações:', error);
      setError(error.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    try {
      const userStats = await scoresService.getUserStats();
      setStats(userStats);
      return userStats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      return null;
    }
  }, []);

  // Salvar nova pontuação
  const saveScore = useCallback(async (scoreData) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await scoresService.saveScore(scoreData);
      
      if (result.success) {
        // Recarregar dados atualizados
        await Promise.all([loadScores(), loadStats()]);
        return { success: true, data: result.data };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Erro ao salvar pontuação:', error);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [loadScores, loadStats]);

  // Carregar ranking global
  const loadRanking = useCallback(async (limit = 10) => {
    try {
      return await scoresService.getGlobalRanking(limit);
    } catch (error) {
      console.error('Erro ao carregar ranking:', error);
      return [];
    }
  }, []);

  // Carregar progresso detalhado
  const loadDetailedProgress = useCallback(async () => {
    try {
      return await scoresService.getUserDetailedProgress();
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
      return null;
    }
  }, []);

  // Inicializar: carregar dados ao montar o hook
  useEffect(() => {
    const sessionStr = localStorage.getItem('virus-hunter-session');
    if (sessionStr) {
      loadScores();
      loadStats();
    }
  }, [loadScores, loadStats]);

  return {
    // Dados
    scores,
    stats,
    loading,
    error,
    
    // Ações
    loadScores,
    loadStats,
    saveScore,
    loadRanking,
    loadDetailedProgress,
    
    // Utilitários
    getTotalScore: () => scores.reduce((sum, s) => sum + (s.score || 0), 0),
    getTotalStars: () => scores.reduce((sum, s) => sum + (s.stars || 0), 0),
    getCompletedLevels: () => scores.filter(s => s.completed).length,
    
    // Status
    hasScores: scores.length > 0,
    isAuthenticated: !!localStorage.getItem('virus-hunter-session')
  };
};