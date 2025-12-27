import { supabase } from '../../lib/supabase';

//  CORRIGIDO: Use a tabela 'scores' que existe no seu SQL
const TABLE_NAME = 'scores';

//  ATUALIZADO: SQL para criar a tabela scores (caso não exista)
export const createScoresTable = async () => {
  const query = `
    -- Tabela de pontuações (compatível com seu schema)
    CREATE TABLE IF NOT EXISTS scores (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      level_id INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      score INTEGER NOT NULL,
      stars INTEGER DEFAULT 0,
      enemies_killed INTEGER DEFAULT 0,
      completed BOOLEAN DEFAULT false,
      time_spent INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE (user_id, level_id, difficulty)
    );

    CREATE INDEX IF NOT EXISTS scores_user_id_idx ON scores(user_id);
    CREATE INDEX IF NOT EXISTS scores_level_id_idx ON scores(level_id);
  `;
  
  console.log('Criando/verificando tabela scores...');
  return query;
};

//  CORRIGIDO: Salvar pontuação da fase 1 (agora usa 'scores')
export const savePhase1Score = async (gameData) => {
  try {
    console.log('Salvando pontuação da fase 1:', gameData);
    
    const { data, error } = await supabase
      .from(TABLE_NAME) // 'scores'
      .upsert({
        user_id: gameData.userId,
        level_id: gameData.phase || 1,
        difficulty: gameData.difficulty,
        score: gameData.score,
        stars: gameData.stars || 0,
        enemies_killed: gameData.enemiesKilled || 0,
        completed: true, //  Marca como completado
        time_spent: gameData.timeSpent || 0,
        // Adiciona campos extras se necessário
        ...(gameData.healthRemaining && { health_remaining: gameData.healthRemaining }),
        ...(gameData.antigensCollected && { antigens_collected: gameData.antigensCollected }),
        ...(gameData.wavesCompleted && { waves_completed: gameData.wavesCompleted })
      }, {
        onConflict: 'user_id,level_id,difficulty'
      });

    if (error) {
      console.error('Erro ao salvar pontuação:', error);
      
      //  CORRIGIDO: Em vez de tentar criar via RPC, mostra erro
      if (error.code === '42P01') { // Tabela não existe
        console.error('❌ Tabela "scores" não existe! Execute o SQL de criação no Supabase.');
        console.log('📋 SQL para criar tabela:');
        console.log(await createScoresTable());
      }
      
      throw error;
    }

    console.log('✅ Pontuação salva com sucesso:', data);
    
    //  ATUALIZA progresso do usuário
    await updateUserProgress(gameData.userId, gameData);
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro fatal ao salvar pontuação:', error);
    return { success: false, error: error.message };
  }
};

//  CORRIGIDO: Buscar pontuações do usuário
export const getUserPhaseScores = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME) // 'scores'
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar pontuações:', error);
    return [];
  }
};

//  CORRIGIDO: Buscar recordes da fase 1 por dificuldade
export const getPhase1Records = async (userId) => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME) // 'scores'
      .select('*')
      .eq('user_id', userId)
      .eq('level_id', 1) // ✅ CORRIGIDO: era 'phase', agora 'level_id'
      .order('score', { ascending: false });

    if (error) throw error;
    
    // Agrupa por dificuldade
    const records = {
      easy: null,
      medium: null,
      hard: null
    };

    data?.forEach(record => {
      if (!records[record.difficulty] || record.score > records[record.difficulty].score) {
        records[record.difficulty] = record;
      }
    });

    return records;
  } catch (error) {
    console.error('Erro ao buscar recordes:', error);
    return { easy: null, medium: null, hard: null };
  }
};

//  CORRIGIDO: Atualizar progresso geral do usuário (agora em 'game_progress')
export const updateUserProgress = async (userId, phaseScore) => {
  try {
    // Busca progresso atual
    const { data: currentProgress, error: fetchError } = await supabase
      .from('game_progress') // ✅ Existe no seu SQL
      .select('*')
      .eq('user_id', userId)
      .single();

    // Se não existir, cria um novo registro
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('Criando novo registro de game_progress para usuário:', userId);
      
      const { data, error } = await supabase
        .from('game_progress')
        .insert({
          user_id: userId,
          total_score: phaseScore.score,
          current_level: Math.max(phaseScore.phase || 1, 1),
          missions_completed: [phaseScore.phase || 1],
          game_stats: {
            total_time_played: phaseScore.timeSpent || 0,
            viruses_defeated: phaseScore.enemiesKilled || 0,
            cells_saved: phaseScore.healthRemaining || 0,
            outbreaks_contained: phaseScore.stars === 3 ? 1 : 0
          }
        });

      if (error) throw error;
      console.log('✅ Novo game_progress criado:', data);
      return { success: true, data };
    }

    if (fetchError) throw fetchError;

    //  ATUALIZADO: Calcula novos valores com estrutura correta
    const totalScore = (currentProgress?.total_score || 0) + phaseScore.score;
    const currentLevel = Math.max(phaseScore.phase || 1, currentProgress?.current_level || 1);
    
    // Adiciona fase completada se for sucesso
    let missionsCompleted = currentProgress?.missions_completed || [];
    if (Array.isArray(missionsCompleted)) {
      if (!missionsCompleted.includes(phaseScore.phase || 1)) {
        missionsCompleted.push(phaseScore.phase || 1);
      }
    } else {
      missionsCompleted = [phaseScore.phase || 1];
    }

    // Atualiza estatísticas do jogo
    const gameStats = currentProgress?.game_stats || {
      total_time_played: 0,
      viruses_defeated: 0,
      cells_saved: 0,
      outbreaks_contained: 0
    };

    //  CORRIGIDO: Acesso correto às propriedades
    if (typeof gameStats === 'object') {
      gameStats.total_time_played = (gameStats.total_time_played || 0) + (phaseScore.timeSpent || 0);
      gameStats.viruses_defeated = (gameStats.viruses_defeated || 0) + (phaseScore.enemiesKilled || 0);
      gameStats.cells_saved = (gameStats.cells_saved || 0) + (phaseScore.healthRemaining || 0);
      if (phaseScore.stars === 3) {
        gameStats.outbreaks_contained = (gameStats.outbreaks_contained || 0) + 1;
      }
    }

    // Salva progresso atualizado
    const { data, error } = await supabase
      .from('game_progress')
      .upsert({
        user_id: userId,
        total_score: totalScore,
        current_level: currentLevel,
        missions_completed: missionsCompleted,
        game_stats: gameStats,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    
    console.log('✅ Progresso do usuário atualizado:', data);
    return { success: true, data };
  } catch (error) {
    console.error('❌ Erro ao atualizar progresso:', error);
    return { success: false, error: error.message };
  }
};

//  MANTIDO: Alias para compatibilidade
export const getPhase1Scores = getUserPhaseScores;