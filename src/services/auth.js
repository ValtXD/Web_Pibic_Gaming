import { supabase } from '../lib/supabase';

export const authService = {
  // REGISTRO OBRIGATÓRIO - Salva no banco de dados
  async register(userData) {
    try {
      console.log('🔐 Tentando registrar usuário:', userData.email);
      
      // 1. VALIDAÇÃO DE DADOS
      if (!userData.name || !userData.email || !userData.password) {
        throw new Error('Todos os campos são obrigatórios');
      }

      if (userData.password.length < 6) {
        throw new Error('A senha deve ter pelo menos 6 caracteres');
      }

      if (userData.password !== userData.confirmPassword) {
        throw new Error('As senhas não coincidem');
      }

      // 2. VERIFICAR SE E-MAIL JÁ EXISTE NO BANCO
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('email')
        .eq('email', userData.email)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Erro ao verificar email:', checkError);
        throw new Error('Erro ao verificar e-mail');
      }

      if (existingUser) {
        throw new Error('Este e-mail já está registrado. Faça login.');
      }

      // 3. CRIPTOGRAFAR SENHA (simplificado para demo)
      // Em produção: usar bcrypt ou auth do Supabase
      const passwordHash = btoa(userData.password); // Base64 para demo

      // 4. INSERIR USUÁRIO NO BANCO DE DADOS
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: userData.email.toLowerCase().trim(),
            name: userData.name.trim(),
            password_hash: passwordHash,
            role: 'student',
            progress: {
              level: 1,
              score: 0,
              missions_completed: 0,
              last_login: null,
              account_verified: true
            },
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao inserir usuário:', insertError);
        throw new Error('Erro ao criar conta: ' + insertError.message);
      }

      console.log('✅ Usuário registrado com ID:', newUser.id);

      // 5. CRIAR REGISTRO DE PROGRESSO DO JOGO
      const { error: progressError } = await supabase
        .from('game_progress')
        .insert([
          {
            user_id: newUser.id,
            total_score: 0,
            current_level: 1,
            missions_completed: [],
            achievements: ['conta_criada'],
            game_stats: {
              total_time_played: 0,
              viruses_defeated: 0,
              cells_saved: 0,
              outbreaks_contained: 0
            }
          }
        ]);

      if (progressError) {
        console.error('⚠️ Erro ao criar progresso:', progressError);
        // Não falhar se só o progresso der erro
      }

      return {
        success: true,
        message: '🎉 Conta criada com sucesso! Faça login para continuar.',
        userId: newUser.id,
        userData: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name
        }
      };

    } catch (error) {
      console.error('🚨 Erro no registro:', error);
      throw new Error(error.message || 'Erro ao criar conta');
    }
  },

  // LOGIN - Verifica NO BANCO se usuário existe
  async login(email, password) {
    try {
      console.log('🔐 Tentando login para:', email);
      
      if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios');
      }

      // 1. BUSCAR USUÁRIO NO BANCO DE DADOS
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.toLowerCase().trim())
        .single();

      if (userError || !user) {
        console.log('❌ Usuário não encontrado no banco:', email);
        throw new Error('E-mail não cadastrado. Registre-se primeiro.');
      }

      // 2. VERIFICAR SENHA
      const passwordHash = btoa(password); // Mesma criptografia do registro
      
      if (passwordHash !== user.password_hash) {
        console.log('❌ Senha incorreta para:', email);
        throw new Error('Senha incorreta');
      }

      // 3. VERIFICAR SE CONTA ESTÁ ATIVA
      if (user.progress?.account_verified === false) {
        throw new Error('Conta não verificada. Verifique seu e-mail.');
      }

      // 4. BUSCAR PROGRESSO DO JOGO
      const { data: gameProgress, error: progressError } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        console.error('⚠️ Erro ao buscar progresso:', progressError);
      }

      // 5. CRIAR SESSÃO
      const sessionToken = `vh_${Date.now()}_${user.id}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

      // 6. ATUALIZAR ÚLTIMO LOGIN NO BANCO
      const { error: updateError } = await supabase
        .from('users')
        .update({
          last_login: new Date().toISOString(),
          progress: {
            ...user.progress,
            last_login: new Date().toISOString(),
            login_count: (user.progress?.login_count || 0) + 1
          }
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('⚠️ Erro ao atualizar último login:', updateError);
      }

      // 7. CRIAR OBJETO DE SESSÃO
      const session = {
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          progress: user.progress,
          game_progress: gameProgress || null
        },
        expiresAt: expiresAt.getTime(),
        created_at: new Date().toISOString()
      };

      // 8. SALVAR NO LOCALSTORAGE (apenas para frontend)
      localStorage.setItem('virus-hunter-session', JSON.stringify(session));
      localStorage.setItem('virus-hunter-user-id', user.id);

      console.log('✅ Login realizado com sucesso para:', user.email);
      
      return {
        success: true,
        message: ' Login realizado! Redirecionando...',
        session,
        redirectTo: '/home'
      };

    } catch (error) {
      console.error('🚨 Erro no login:', error);
      throw new Error(error.message || 'Erro ao fazer login');
    }
  },

  // VERIFICAR SE USUÁRIO ESTÁ AUTENTICADO (consulta banco)
  async verifySession() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (!sessionStr) {
        console.log('❌ Nenhuma sessão encontrada');
        return null;
      }

      const session = JSON.parse(sessionStr);
      
      // Verificar se sessão expirou
      if (Date.now() > session.expiresAt) {
        console.log('⚠️ Sessão expirada');
        await this.logout();
        return null;
      }

      // VERIFICAR NO BANCO se usuário ainda existe
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, role, progress')
        .eq('id', session.user.id)
        .single();

      if (error || !user) {
        console.log('❌ Usuário não encontrado no banco');
        await this.logout();
        return null;
      }

      // Atualizar dados do usuário
      session.user = {
        ...session.user,
        ...user
      };

      localStorage.setItem('virus-hunter-session', JSON.stringify(session));
      
      return session;

    } catch (error) {
      console.error('🚨 Erro ao verificar sessão:', error);
      await this.logout();
      return null;
    }
  },

  // VERIFICAR SE E-MAIL JÁ ESTÁ REGISTRADO (para validação em tempo real)
  async checkEmailExists(email) {
    try {
      if (!email) return false;
      
      const { data, error } = await supabase
        .from('users')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      if (error) {
        console.error('Erro ao verificar email:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Erro checkEmailExists:', error);
      return false;
    }
  },

  // LOGOUT - Limpa tudo
  async logout() {
    try {
      const sessionStr = localStorage.getItem('virus-hunter-session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        
        // Opcional: marcar sessão como expirada no banco
        // await supabase
        //   .from('user_sessions')
        //   .update({ expired: true })
        //   .eq('token', session.token);
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      // SEMPRE limpar localStorage
      localStorage.removeItem('virus-hunter-session');
      localStorage.removeItem('virus-hunter-user-id');
      console.log('👋 Usuário deslogado');
    }
  },

  // RECUPERAR PROGRESSO ATUALIZADO
  async getUpdatedProgress(userId) {
    try {
      const { data: progress, error } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return progress;
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      return null;
    }
  }
};