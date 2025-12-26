import { supabase } from '../lib/supabase';

export const scoresService = {
  // Obter pontuações do usuário atual
  async getUserScores() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) {
        console.log('Usuário não autenticado');
        return [];
      }

      const session = JSON.parse(sessionStr);
      const userId = session.user.id;

      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar pontuações:', error);
      return [];
    }
  },

  // Salvar pontuação do jogo
  async saveScore(scoreData) {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) {
        throw new Error('Usuário não autenticado');
      }

      const session = JSON.parse(sessionStr);
      const userId = session.user.id;

      const score = {
        user_id: userId,
        level_id: scoreData.level_id,
        difficulty: scoreData.difficulty,
        score: scoreData.score,
        stars: scoreData.stars || 0,
        enemies_killed: scoreData.enemies_killed || 0,
        completed: scoreData.completed || false,
        time_spent: scoreData.time_spent || 0,
        created_at: new Date().toISOString()
      };

      // Verificar se já existe uma pontuação para este nível/dificuldade
      const { data: existingScore } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId)
        .eq('level_id', score.level_id)
        .eq('difficulty', score.difficulty)
        .maybeSingle();

      let result;

      if (existingScore) {
        // Atualizar se a nova pontuação for maior
        if (score.score > existingScore.score || 
            score.stars > existingScore.stars ||
            (score.completed && !existingScore.completed)) {
          
          const { data, error } = await supabase
            .from('scores')
            .update(score)
            .eq('id', existingScore.id)
            .select()
            .single();

          if (error) throw error;
          result = data;
          console.log('📈 Pontuação atualizada:', scoreData.level_id);
        } else {
          console.log('Pontuação existente é maior ou igual, mantendo...');
          result = existingScore;
        }
      } else {
        // Inserir nova pontuação
        const { data, error } = await supabase
          .from('scores')
          .insert(score)
          .select()
          .single();

        if (error) throw error;
        result = data;
        console.log('🎯 Nova pontuação salva:', scoreData.level_id);
      }

      // Atualizar perfil do usuário (tabela profiles)
      await this.updateUserProfile(userId);
      
      // Atualizar progresso no jogo (tabela game_progress)
      await this.updateGameProgress(userId);
      
      return { success: true, data: result };
      
    } catch (error) {
      console.error('❌ Erro ao salvar pontuação:', error);
      return { success: false, error: error.message };
    }
  },

  // Atualizar perfil do usuário (tabela profiles)
  async updateUserProfile(userId) {
    try {
      // Calcular totais das pontuações
      const { data: scores } = await supabase
        .from('scores')
        .select('score, stars, completed')
        .eq('user_id', userId);

      if (!scores) return;

      const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
      const totalStars = scores.reduce((sum, s) => sum + (s.stars || 0), 0);
      const completedLevels = scores.filter(s => s.completed).length;

      // Verificar se perfil já existe
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (existingProfile) {
        // Atualizar perfil existente
        const { error } = await supabase
          .from('profiles')
          .update({
            total_score: totalScore,
            total_stars: totalStars,
            completed_levels: completedLevels,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (error) throw error;
      } else {
        // Criar novo perfil
        const { data: user } = await supabase
          .from('users')
          .select('email, name')
          .eq('id', userId)
          .single();

        if (user) {
          const { error } = await supabase
            .from('profiles')
            .insert({
              id: userId,
              email: user.email,
              username: user.name,
              total_score: totalScore,
              total_stars: totalStars,
              completed_levels: completedLevels,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      }
      
      console.log('📊 Perfil atualizado:', { totalScore, totalStars, completedLevels });
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  },

  // Atualizar progresso do jogo (tabela game_progress)
  async updateGameProgress(userId) {
    try {
      // Obter todas as pontuações
      const { data: scores } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', userId);

      if (!scores || scores.length === 0) return;

      const totalScore = scores.reduce((sum, s) => sum + (s.score || 0), 0);
      const virusesDefeated = scores.reduce((sum, s) => sum + (s.enemies_killed || 0), 0);
      
      // Determinar nível atual (maior nível completado + 1, ou 1 se nenhum completado)
      const completedLevels = scores.filter(s => s.completed);
      const highestCompleted = completedLevels.length > 0 
        ? Math.max(...completedLevels.map(s => s.level_id))
        : 0;
      const currentLevel = highestCompleted + 1;

      // Obter conquistas
      const achievements = [];
      if (totalScore >= 1000) achievements.push('score_1000');
      if (completedLevels.length >= 5) achievements.push('levels_5');
      if (virusesDefeated >= 50) achievements.push('viruses_50');

      // Verificar se game_progress já existe
      const { data: existingProgress } = await supabase
        .from('game_progress')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const progressData = {
        user_id: userId,
        total_score: totalScore,
        current_level: currentLevel,
        missions_completed: completedLevels.map(s => `level_${s.level_id}`),
        achievements: achievements,
        game_stats: {
          total_time_played: scores.reduce((sum, s) => sum + (s.time_spent || 0), 0),
          viruses_defeated: virusesDefeated,
          cells_saved: virusesDefeated * 10, // Exemplo: cada vírus derrotado salva 10 células
          outbreaks_contained: completedLevels.length
        },
        updated_at: new Date().toISOString()
      };

      if (existingProgress) {
        // Atualizar progresso existente
        const { error } = await supabase
          .from('game_progress')
          .update(progressData)
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Criar novo progresso
        const { error } = await supabase
          .from('game_progress')
          .insert([progressData]);

        if (error) throw error;
      }
      
      console.log('🎮 Progresso do jogo atualizado:', currentLevel, totalScore);
      
    } catch (error) {
      console.error('Erro ao atualizar progresso do jogo:', error);
    }
  },

  // Obter estatísticas do usuário atual
  async getUserStats() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);
      const userId = session.user.id;

      // Buscar do perfil (tabela profiles)
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_score, total_stars, completed_levels')
        .eq('id', userId)
        .single();

      // Buscar do progresso do jogo (tabela game_progress)
      const { data: progress } = await supabase
        .from('game_progress')
        .select('current_level, game_stats')
        .eq('user_id', userId)
        .single();

      return {
        ...profile,
        ...progress
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return null;
    }
  },

  // Obter ranking global (top 10)
  async getGlobalRanking(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, total_score, total_stars, completed_levels')
        .order('total_score', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      return [];
    }
  },

  // Obter progresso detalhado do usuário
  async getUserDetailedProgress() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) return null;

      const session = JSON.parse(sessionStr);
      const userId = session.user.id;

      // Buscar todas as informações do usuário
      const [scores, profile, progress] = await Promise.all([
        this.getUserScores(),
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('game_progress').select('*').eq('user_id', userId).single()
      ]);

      return {
        scores: scores.data || [],
        profile: profile.data || null,
        game_progress: progress.data || null,
        user: session.user
      };
    } catch (error) {
      console.error('Erro ao buscar progresso detalhado:', error);
      return null;
    }
  },

  // Reiniciar progresso (para testes)
  async resetProgress() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) throw new Error('Usuário não autenticado');

      const session = JSON.parse(sessionStr);
      const userId = session.user.id;

      // Deletar todas as pontuações
      const { error: scoresError } = await supabase
        .from('scores')
        .delete()
        .eq('user_id', userId);

      if (scoresError) throw scoresError;

      // Resetar perfil
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          total_score: 0,
          total_stars: 0,
          completed_levels: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Resetar progresso do jogo
      const { error: progressError } = await supabase
        .from('game_progress')
        .update({
          total_score: 0,
          current_level: 1,
          missions_completed: [],
          achievements: [],
          game_stats: {
            total_time_played: 0,
            viruses_defeated: 0,
            cells_saved: 0,
            outbreaks_contained: 0
          },
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (progressError) throw progressError;

      console.log('🔄 Progresso reiniciado para:', userId);
      return { success: true };
      
    } catch (error) {
      console.error('Erro ao reiniciar progresso:', error);
      return { success: false, error: error.message };
    }
  }
};