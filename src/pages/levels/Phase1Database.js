import { supabase } from '../../lib/supabase';

const TABLE_NAME = 'scores';

// Função auxiliar para garantir que o usuário tem perfil na SUA tabela users
const ensureUserExists = async (userId, userData = {}) => {
  try {
    // 1. Verificar se existe na SUA tabela users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    // Se não existe na tabela users, cria um registro
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('👤 Criando usuário na tabela users:', userId);
      
      const userDataToInsert = {
        id: userId,
        email: userData.email || 'unknown@email.com',
        name: userData.name || userData.username || `user_${userId.substring(0, 8)}`,
        password_hash: 'temp_hash_' + Date.now(), // Hash temporário
        role: 'student',
        progress: {
          level: 1,
          score: 0,
          missions_completed: 0,
          immunology_quizzes: 0,
          epidemiology_quizzes: 0
        }
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userDataToInsert);

      if (error) {
        console.error('❌ Erro ao criar usuário:', error);
        // Tentar inserir sem o ID (deixar o banco gerar)
        const { data: altData, error: altError } = await supabase
          .from('users')
          .insert({
            email: userData.email || 'unknown@email.com',
            name: userData.name || userData.username || `user_${userId.substring(0, 8)}`,
            password_hash: 'temp_hash_' + Date.now()
          })
          .select('id')
          .single();

        if (altError) {
          console.error('❌ Erro alternativo ao criar usuário:', altError);
          throw altError;
        }

        console.log('✅ Usuário criado com ID gerado:', altData.id);
        return { id: altData.id, ...userDataToInsert };
      }

      console.log('✅ Usuário criado:', data);
      return userDataToInsert;
    }

    if (fetchError) throw fetchError;

    console.log('✅ Usuário já existe na tabela users:', existingUser);
    return existingUser;

  } catch (error) {
    console.error('❌ Erro no ensureUserExists:', error);
    return null;
  }
};

// Função para garantir que o usuário tem perfil na tabela profiles
const ensureUserProfile = async (userId, userData = {}) => {
  try {
    // 1. Primeiro garantir que existe na SUA tabela users
    const userRecord = await ensureUserExists(userId, userData);
    
    if (!userRecord) {
      throw new Error('Não foi possível criar registro na tabela users');
    }

    // Usar o ID da sua tabela users (pode ser diferente do auth)
    const effectiveUserId = userRecord.id;

    // 2. Verificar se existe na tabela profiles
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', effectiveUserId)
      .single();

    // Se não existe na profiles, cria um perfil
    if (profileError && profileError.code === 'PGRST116') {
      console.log('👤 Criando perfil na tabela profiles:', effectiveUserId);
      
      const profileData = {
        id: effectiveUserId,
        email: userData.email || 'unknown@email.com',
        username: userData.username || `user_${effectiveUserId.substring(0, 8)}`,
        total_score: userData.score || 0,
        total_stars: userData.stars || 0,
        completed_levels: 1
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData);

      if (error) {
        console.error('❌ Erro ao criar perfil:', error);
        
        // Se for erro de foreign key, tentar criar com um UUID diferente
        if (error.code === '23503') {
          console.log('🔄 Tentando criar perfil com novo UUID...');
          
          // Criar um novo UUID para o perfil
          const newProfileId = crypto.randomUUID ? crypto.randomUUID() : 
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const altProfileData = {
            id: newProfileId,
            email: userData.email || 'unknown@email.com',
            username: userData.username || `user_${newProfileId.substring(0, 8)}`,
            total_score: userData.score || 0,
            total_stars: userData.stars || 0,
            completed_levels: 1
          };

          const { data: altData, error: altError } = await supabase
            .from('profiles')
            .insert(altProfileData);

          if (altError) {
            console.error('❌ Erro alternativo ao criar perfil:', altError);
            throw altError;
          }

          console.log('✅ Perfil criado com novo ID:', altData);
          return altProfileData;
        }
        
        throw error;
      }

      console.log('✅ Perfil criado:', data);
      return profileData;
    }

    if (profileError) throw profileError;

    console.log('✅ Perfil já existe:', existingProfile);
    return existingProfile;

  } catch (error) {
    console.error('❌ Erro no ensureUserProfile:', error);
    return null;
  }
};

// Salvar pontuação da fase 1
export const savePhase1Score = async (gameData) => {
  try {
    console.log('💾 Salvando pontuação da fase 1:', {
      userId: gameData.userId,
      phase: gameData.phase,
      difficulty: gameData.difficulty,
      score: gameData.score,
      stars: gameData.stars
    });

    // 1. Garantir que o usuário tem perfil
    const userProfile = await ensureUserProfile(gameData.userId, {
      email: gameData.userEmail,
      username: gameData.userName,
      name: gameData.userName,
      score: gameData.score,
      stars: gameData.stars
    });

    if (!userProfile) {
      throw new Error('Não foi possível criar/obter perfil do usuário');
    }

    // Usar o ID do perfil para salvar a pontuação
    const userIdForScores = userProfile.id;

    // 2. Preparar payload para a tabela scores (APENAS COLUNAS QUE EXISTEM)
    const scorePayload = {
      user_id: userIdForScores,
      level_id: gameData.phase || 1,
      difficulty: gameData.difficulty || 'medium',
      score: parseInt(gameData.score) || 0,
      stars: parseInt(gameData.stars) || 0,
      enemies_killed: parseInt(gameData.enemiesKilled) || 0,
      completed: true,
      time_spent: parseInt(gameData.timeSpent) || 0,
      created_at: new Date().toISOString()
    };

    console.log('📤 Enviando payload para scores:', scorePayload);

    // 3. Tentar upsert (atualizar ou inserir) com duplicatas permitidas
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([scorePayload])
      .select();

    if (error) {
      console.error('❌ Erro ao salvar na tabela scores:', error);
      
      // Se for erro de duplicata, tentar inserir de qualquer forma
      if (error.code === '23505') { // Violação de unicidade
        console.log('⚠️ Registro duplicado, tentando inserir com ID diferente...');
        
        // Criar novo payload com novo ID
        const newScorePayload = {
          ...scorePayload,
          id: crypto.randomUUID ? crypto.randomUUID() : 
            `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
        
        const { data: insertData, error: insertError } = await supabase
          .from(TABLE_NAME)
          .insert([newScorePayload])
          .select();

        if (insertError) {
          console.error('❌ Insert também falhou:', insertError);
          throw insertError;
        }

        console.log('✅ Pontuação salva com novo ID:', insertData);
        await updateUserProgress(userIdForScores, insertData[0]);
        return { success: true, data: insertData };
      }
      
      throw error;
    }

    console.log('✅ Pontuação salva:', data);

    // 4. Atualizar progresso do usuário
    await updateUserProgress(userIdForScores, data[0]);

    return { success: true, data };

  } catch (error) {
    console.error('❌ Erro fatal ao salvar pontuação:', error);
    
    // Fallback: salvar no localStorage
    try {
      const backupKey = 'virus-hunter-scores-backup';
      const existingBackup = JSON.parse(localStorage.getItem(backupKey) || '[]');
      
      const backupData = {
        ...gameData,
        backup_saved_at: new Date().toISOString(),
        error_message: error.message
      };
      
      existingBackup.push(backupData);
      localStorage.setItem(backupKey, JSON.stringify(existingBackup));
      
      console.log('📦 Pontuação salva localmente como backup');
      
      // Tentar sincronizar backups posteriormente
      setTimeout(() => {
        syncBackupScores();
      }, 5000);
      
    } catch (backupError) {
      console.error('❌ Erro ao salvar backup:', backupError);
    }
    
    return { 
      success: false, 
      error: error.message,
      backup_saved: true
    };
  }
};

// Atualizar progresso do usuário
const updateUserProgress = async (userId, newScore) => {
  try {
    // 1. Buscar todas as pontuações do usuário (incluindo de perfis duplicados)
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userProfile?.email) {
      console.error('❌ Email do perfil não encontrado');
      return;
    }

    // Buscar todos os perfis com o mesmo email
    const { data: duplicateProfiles, error: dupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userProfile.email);

    if (dupError) {
      console.error('❌ Erro ao buscar perfis duplicados:', dupError);
      return;
    }

    const profileIds = duplicateProfiles.map(p => p.id);
    
    // Buscar todas as pontuações de todos os perfis duplicados
    const { data: allScores, error: scoresError } = await supabase
      .from(TABLE_NAME)
      .select('score, stars, level_id, completed')
      .in('user_id', profileIds);

    if (scoresError) {
      console.error('❌ Erro ao buscar pontuações:', scoresError);
      return;
    }

    // 2. Calcular totais
    const totalScore = allScores.reduce((sum, s) => sum + (s.score || 0), 0);
    const totalStars = allScores.reduce((sum, s) => sum + (s.stars || 0), 0);
    const completedLevels = new Set(allScores.filter(s => s.completed).map(s => s.level_id)).size;

    // 3. Atualizar todos os perfis duplicados
    for (const profileId of profileIds) {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          total_score: totalScore,
          total_stars: totalStars,
          completed_levels: completedLevels,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);

      if (updateError) {
        console.error(`❌ Erro ao atualizar perfil ${profileId}:`, updateError);
      }
    }

    // 4. Atualizar game_progress se existir
    const { data: gameProgress } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (gameProgress) {
      const { error: gameProgressError } = await supabase
        .from('game_progress')
        .update({
          total_score: totalScore,
          current_level: Math.max(gameProgress.current_level || 1, (newScore.level_id || 1) + 1),
          updated_at: new Date().toISOString()
        })
        .eq('id', gameProgress.id);

      if (gameProgressError) {
        console.error('❌ Erro ao atualizar game_progress:', gameProgressError);
      }
    }

    console.log('📊 Estatísticas atualizadas:', {
      totalScore,
      totalStars,
      completedLevels,
      totalMatches: allScores.length,
      duplicateProfiles: profileIds.length
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar progresso:', error);
  }
};

// CORREÇÃO PRINCIPAL: Buscar pontuações de TODOS os perfis com mesmo email
export const getUserPhaseScores = async (userId) => {
  try {
    console.log('🔍 Buscando pontuações para userId:', userId);
    
    // 1. Primeiro buscar o perfil do usuário atual para obter o email
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      // Tentar buscar por email do usuário
      const { data: userFromUsers } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!userFromUsers?.email) {
        console.error('❌ Email do usuário não encontrado');
        return getDefaultResponse();
      }
      
      return await getScoresByEmail(userFromUsers.email);
    }

    // 2. Buscar TODOS os perfis com o mesmo email
    const { data: allProfilesByEmail, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', currentProfile.email);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis por email:', profilesError);
      return getDefaultResponse();
    }

    console.log('👥 Perfis encontrados com mesmo email:', allProfilesByEmail?.length || 0);

    // 3. Extrair todos os IDs de perfis para buscar pontuações
    const profileIds = allProfilesByEmail?.map(profile => profile.id) || [userId];
    
    // 4. Buscar pontuações de TODOS os perfis deste usuário
    const { data: allScores, error: scoresError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .in('user_id', profileIds)
      .order('created_at', { ascending: false });

    if (scoresError) {
      console.error('❌ Erro ao buscar pontuações:', scoresError);
      return getDefaultResponse();
    }

    console.log('📊 Total de pontuações encontradas:', allScores?.length || 0);

    // 5. Calcular estatísticas totais
    const totalScore = allScores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
    const totalStars = allScores?.reduce((sum, s) => sum + (s.stars || 0), 0) || 0;
    const completedLevels = new Set(allScores?.filter(s => s.completed).map(s => s.level_id)).size;

    return {
      scores: allScores || [],
      profile: currentProfile,
      stats: {
        totalScore,
        totalStars,
        completedLevels,
        totalMatches: allScores?.length || 0,
        averageScore: allScores?.length > 0 ? Math.round(totalScore / allScores.length) : 0,
        duplicateProfiles: allProfilesByEmail?.length || 1
      }
    };

  } catch (error) {
    console.error('❌ Erro ao buscar pontuações:', error);
    return getDefaultResponse();
  }
};

// Função auxiliar para buscar pontuações por email
const getScoresByEmail = async (email) => {
  try {
    console.log('📧 Buscando pontuações por email:', email);
    
    // Buscar todos os perfis com este email
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email);

    if (profilesError) {
      console.error('❌ Erro ao buscar perfis:', profilesError);
      return getDefaultResponse();
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️ Nenhum perfil encontrado para este email');
      return getDefaultResponse();
    }

    const profileIds = profiles.map(p => p.id);
    
    // Buscar perfil principal
    const { data: mainProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileIds[0])
      .single();

    // Buscar todas as pontuações
    const { data: allScores, error: scoresError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .in('user_id', profileIds)
      .order('created_at', { ascending: false });

    if (scoresError) {
      console.error('❌ Erro ao buscar pontuações:', scoresError);
      return getDefaultResponse();
    }

    const totalScore = allScores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
    const totalStars = allScores?.reduce((sum, s) => sum + (s.stars || 0), 0) || 0;
    const completedLevels = new Set(allScores?.filter(s => s.completed).map(s => s.level_id)).size;

    return {
      scores: allScores || [],
      profile: mainProfile || null,
      stats: {
        totalScore,
        totalStars,
        completedLevels,
        totalMatches: allScores?.length || 0,
        averageScore: allScores?.length > 0 ? Math.round(totalScore / allScores.length) : 0,
        duplicateProfiles: profiles.length
      }
    };
    
  } catch (error) {
    console.error('❌ Erro no getScoresByEmail:', error);
    return getDefaultResponse();
  }
};

// Função para resposta padrão
const getDefaultResponse = () => ({
  scores: [],
  profile: null,
  stats: {
    totalScore: 0,
    totalStars: 0,
    completedLevels: 0,
    totalMatches: 0,
    averageScore: 0,
    duplicateProfiles: 0
  }
});

// Sincronizar backups do localStorage
const syncBackupScores = async () => {
  try {
    const backupKey = 'virus-hunter-scores-backup';
    const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
    
    if (backups.length === 0) {
      console.log('✅ Nenhum backup para sincronizar');
      return;
    }

    console.log(`🔄 Tentando sincronizar ${backups.length} backup(s)...`);

    const successfulSyncs = [];
    const failedSyncs = [];

    for (const backup of backups) {
      try {
        // Usar savePhase1Score para sincronizar cada backup
        const result = await savePhase1Score(backup);
        
        if (result.success) {
          successfulSyncs.push(backup);
        } else {
          failedSyncs.push({ backup, error: result.error });
        }
      } catch (error) {
        failedSyncs.push({ backup, error: error.message });
      }
    }

    // Remover backups sincronizados com sucesso
    const remainingBackups = backups.filter(backup => 
      !successfulSyncs.some(success => 
        success.userId === backup.userId && 
        success.phase === backup.phase && 
        success.difficulty === backup.difficulty &&
        success.backup_saved_at === backup.backup_saved_at
      )
    );

    localStorage.setItem(backupKey, JSON.stringify(remainingBackups));

    console.log(`✅ Sincronização concluída: ${successfulSyncs.length} sucesso, ${failedSyncs.length} falhas`);
    console.log(`📦 Backups restantes: ${remainingBackups.length}`);

  } catch (error) {
    console.error('❌ Erro na sincronização de backups:', error);
  }
};

// Buscar recordes específicos
export const getPhase1Records = async (userId) => {
  try {
    const result = await getUserPhaseScores(userId);
    const allScores = result.scores;
    
    const records = {
      easy: null,
      medium: null,
      hard: null
    };

    allScores?.forEach(score => {
      if (score.difficulty in records && score.level_id === 1) {
        if (!records[score.difficulty] || score.score > records[score.difficulty].score) {
          records[score.difficulty] = score;
        }
      }
    });

    return records;

  } catch (error) {
    console.error('❌ Erro ao buscar recordes:', error);
    return { easy: null, medium: null, hard: null };
  }
};

// Função para apagar pontuação
export const deleteScore = async (scoreId) => {
  try {
    console.log('🗑️ Apagando pontuação:', scoreId);
    
    // 1. Buscar a pontuação para obter o user_id
    const { data: score, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('user_id')
      .eq('id', scoreId)
      .single();

    if (fetchError) throw fetchError;
    
    if (!score) {
      throw new Error('Pontuação não encontrada');
    }

    // 2. Apagar a pontuação
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', scoreId);

    if (deleteError) throw deleteError;
    
    console.log('✅ Pontuação apagada com sucesso');
    
    // 3. Atualizar estatísticas do usuário
    await updateUserProgressAfterDeletion(score.user_id);
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erro ao apagar pontuação:', error);
    throw error;
  }
};

// Atualizar estatísticas após apagar pontuação
const updateUserProgressAfterDeletion = async (userId) => {
  try {
    // Buscar perfil para obter email
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!userProfile?.email) return;

    // Buscar todos os perfis com mesmo email
    const { data: duplicateProfiles } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', userProfile.email);

    const profileIds = duplicateProfiles?.map(p => p.id) || [userId];
    
    // Buscar todas as pontuações restantes
    const { data: allScores } = await supabase
      .from(TABLE_NAME)
      .select('score, stars, level_id, completed')
      .in('user_id', profileIds);

    // Calcular novos totais
    const totalScore = allScores?.reduce((sum, s) => sum + (s.score || 0), 0) || 0;
    const totalStars = allScores?.reduce((sum, s) => sum + (s.stars || 0), 0) || 0;
    const completedLevels = new Set(allScores?.filter(s => s.completed).map(s => s.level_id)).size;

    // Atualizar todos os perfis duplicados
    for (const profileId of profileIds) {
      await supabase
        .from('profiles')
        .update({
          total_score: totalScore,
          total_stars: totalStars,
          completed_levels: completedLevels,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);
    }

    console.log('📊 Estatísticas atualizadas após deleção:', {
      totalScore,
      totalStars,
      completedLevels
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar estatísticas após deleção:', error);
  }
};

// Função para Debug: Verificar estrutura da tabela
export const checkScoresTable = async () => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao verificar tabela scores:', error);
      return { exists: false, error: error.message };
    }

    console.log('✅ Tabela scores existe. Estrutura da primeira linha:', data?.[0]);
    return { exists: true, sample: data?.[0] };

  } catch (error) {
    console.error('❌ Erro no checkScoresTable:', error);
    return { exists: false, error: error.message };
  }
};

// Buscar estatísticas detalhadas do usuário
export const getUserStats = async (userId) => {
  try {
    const result = await getUserPhaseScores(userId);
    const { scores, profile, stats } = result;
    
    // Calcular estatísticas adicionais
    const today = new Date().toDateString();
    const todayScores = scores.filter(s => 
      new Date(s.created_at).toDateString() === today
    );
    
    const todayStats = {
      matches: todayScores.length,
      score: todayScores.reduce((sum, s) => sum + s.score, 0),
      stars: todayScores.reduce((sum, s) => sum + s.stars, 0),
      enemies: todayScores.reduce((sum, s) => sum + (s.enemies_killed || 0), 0),
      average: todayScores.length > 0 ? 
        Math.round(todayScores.reduce((sum, s) => sum + s.score, 0) / todayScores.length) : 0
    };
    
    // Estatísticas por dificuldade
    const difficultyStats = {
      easy: { matches: 0, score: 0, stars: 0, bestScore: 0 },
      medium: { matches: 0, score: 0, stars: 0, bestScore: 0 },
      hard: { matches: 0, score: 0, stars: 0, bestScore: 0 }
    };
    
    scores.forEach(score => {
      const diff = score.difficulty;
      if (difficultyStats[diff]) {
        difficultyStats[diff].matches += 1;
        difficultyStats[diff].score += score.score;
        difficultyStats[diff].stars += score.stars;
        if (score.score > difficultyStats[diff].bestScore) {
          difficultyStats[diff].bestScore = score.score;
        }
      }
    });
    
    return {
      general: stats,
      today: todayStats,
      difficulty: difficultyStats,
      profile: profile,
      totalMatches: scores.length,
      duplicateProfiles: stats.duplicateProfiles || 1
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    return getDefaultStats();
  }
};

const getDefaultStats = () => ({
  general: {
    totalScore: 0,
    totalStars: 0,
    completedLevels: 0,
    totalMatches: 0,
    averageScore: 0,
    duplicateProfiles: 0
  },
  today: {
    matches: 0,
    score: 0,
    stars: 0,
    enemies: 0,
    average: 0
  },
  difficulty: {
    easy: { matches: 0, score: 0, stars: 0, bestScore: 0 },
    medium: { matches: 0, score: 0, stars: 0, bestScore: 0 },
    hard: { matches: 0, score: 0, stars: 0, bestScore: 0 }
  },
  profile: null,
  totalMatches: 0,
  duplicateProfiles: 0
});

// Função para unificar perfis duplicados
export const mergeDuplicateProfiles = async (userId) => {
  try {
    console.log('🔄 Verificando perfis duplicados para:', userId);
    
    // Buscar perfil atual
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Buscar TODOS os perfis com o mesmo email
    const { data: duplicateProfiles, error: dupError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', currentProfile.email);

    if (dupError) throw dupError;

    if (duplicateProfiles.length <= 1) {
      console.log('✅ Nenhum perfil duplicado encontrado');
      return { success: true, profiles: duplicateProfiles };
    }

    console.log(`⚠️ Encontrados ${duplicateProfiles.length} perfis duplicados`);

    // Encontrar o perfil principal (mais antigo)
    const mainProfile = duplicateProfiles.reduce((main, profile) => {
      if (!main.created_at || (profile.created_at && profile.created_at < main.created_at)) {
        return profile;
      }
      return main;
    });

    const duplicateIds = duplicateProfiles
      .filter(p => p.id !== mainProfile.id)
      .map(p => p.id);

    if (duplicateIds.length === 0) {
      return { success: true, mainProfile, duplicates: [] };
    }

    console.log(`🔄 Migrando pontuações de ${duplicateIds.length} perfis duplicados`);

    // Para cada perfil duplicado, migrar pontuações
    for (const dupId of duplicateIds) {
      // Buscar pontuações do perfil duplicado
      const { data: dupScores, error: scoresError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('user_id', dupId);

      if (scoresError) {
        console.error(`❌ Erro ao buscar pontuações do perfil ${dupId}:`, scoresError);
        continue;
      }

      if (dupScores && dupScores.length > 0) {
        // Atualizar user_id das pontuações para o perfil principal
        for (const score of dupScores) {
          const { error: updateError } = await supabase
            .from(TABLE_NAME)
            .update({ user_id: mainProfile.id })
            .eq('id', score.id);

          if (updateError) {
            console.error(`❌ Erro ao atualizar pontuação ${score.id}:`, updateError);
          }
        }
        console.log(`✅ Migradas ${dupScores.length} pontuações do perfil ${dupId}`);
      }

      // Apagar perfil duplicado (opcional)
      // const { error: deleteError } = await supabase
      //   .from('profiles')
      //   .delete()
      //   .eq('id', dupId);
    }

    // Atualizar estatísticas do perfil principal
    await updateUserProgress(mainProfile.id, {});

    console.log(`✅ Perfis duplicados unificados com sucesso`);
    return { 
      success: true, 
      mainProfile, 
      duplicates: duplicateIds,
      message: `Unificados ${duplicateIds.length} perfis duplicados`
    };

  } catch (error) {
    console.error('❌ Erro ao unificar perfis duplicados:', error);
    return { success: false, error: error.message };
  }
};

// Sincronizar todos os backups
export const syncAllBackups = async () => {
  return syncBackupScores();
};

// Buscar pontuações por nível e dificuldade
export const getScoresByLevelAndDifficulty = async (userId, levelId, difficulty) => {
  try {
    const result = await getUserPhaseScores(userId);
    return result.scores.filter(score => 
      score.level_id === levelId && 
      score.difficulty === difficulty
    );
    
  } catch (error) {
    console.error('❌ Erro ao buscar pontuações:', error);
    return [];
  }
};

// Buscar melhor pontuação por nível
export const getBestScoreByLevel = async (userId, levelId) => {
  try {
    const result = await getUserPhaseScores(userId);
    const levelScores = result.scores.filter(score => score.level_id === levelId);
    
    if (levelScores.length === 0) return null;
    
    return levelScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
  } catch (error) {
    console.error('❌ Erro ao buscar melhor pontuação:', error);
    return null;
  }
};

// Alias para compatibilidade
export const getPhase1Scores = getUserPhaseScores;

// Limpar todos os backups
export const clearAllBackups = () => {
  try {
    localStorage.removeItem('virus-hunter-scores-backup');
    console.log('✅ Todos os backups foram removidos');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao limpar backups:', error);
    return { success: false, error: error.message };
  }
};

// Exportar todas as pontuações do usuário
export const exportUserScores = async (userId) => {
  try {
    const result = await getUserPhaseScores(userId);
    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      scores: result.scores,
      profile: result.profile,
      stats: result.stats,
      totalMatches: result.scores.length
    };
    
    // Criar arquivo para download
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    return {
      success: true,
      data: exportData,
      downloadUrl: dataUri,
      filename: `virus-hunter-scores-${userId}-${Date.now()}.json`
    };
    
  } catch (error) {
    console.error('❌ Erro ao exportar pontuações:', error);
    return { success: false, error: error.message };
  }
};