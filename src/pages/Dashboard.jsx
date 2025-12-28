import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, LogOut, Gamepad2, BarChart3, Lock, Star, Trophy, Medal,
  Layers, Wind, Heart, Brain, Bone, ArrowRight, Volume2, VolumeX, Target, Sparkles,
  Users, Clock, Award
} from 'lucide-react';

// Dados das fases do sistema imunológico
const immuneSystemLevels = [
  {
    id: 1,
    name: 'Pele - Barreira Mecânica',
    icon: Layers,
    description: 'Defesa inicial: pele rompida por corte ou ferimento',
    color: 'from-amber-500 to-orange-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    unlocked: true,
    enemies: ['Bactéria Comensal', 'Vírus de Entrada', 'Esporo Fúngico', 'Toxina Bacteriana', 'Bactéria Agregada'],
    mechanics: 'Células epiteliais + Macrófagos',
    baseDifficulty: 'easy'
  },
  {
    id: 2,
    name: 'Mucosas Respiratórias',
    icon: Wind,
    description: 'Barreira de muco e cílios nas vias respiratórias',
    color: 'from-blue-400 to-cyan-300',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/50',
    unlocked: true,
    enemies: ['Vírus Influenza', 'Bactéria Pneumonia', 'Alérgeno', 'Poluente', 'Mycobacterium'],
    mechanics: 'Muco + Cílios + IgA Secretora',
    baseDifficulty: 'medium'
  },
  {
    id: 3,
    name: 'Resposta Inata (Sangue)',
    icon: Heart,
    description: 'Sistema complemento e fagócitos na corrente sanguínea',
    color: 'from-red-600 to-pink-500',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/50',
    unlocked: false,
    enemies: ['Bactéria Sanguínea', 'Vírus HIV', 'Parasita Malária'],
    mechanics: 'Neutrófilos + Monócitos + Complemento',
    baseDifficulty: 'hard',
    lockedMessage: 'Complete as fases 1 e 2 para desbloquear'
  },
  {
    id: 4,
    name: 'Resposta Adaptativa (Linfa)',
    icon: Brain,
    description: 'Linfócitos T e B nos gânglios linfáticos',
    color: 'from-purple-600 to-indigo-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/50',
    unlocked: false,
    enemies: ['Vírus Específico', 'Célula Cancerosa', 'Autoimune'],
    mechanics: 'Linfócitos T + Linfócitos B + Anticorpos',
    baseDifficulty: 'hard',
    lockedMessage: 'Complete a fase 3 para desbloquear'
  },
  {
    id: 5,
    name: 'Memória Imunológica',
    icon: Bone,
    description: 'Células de memória e vacinação',
    color: 'from-amber-600 to-yellow-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/50',
    unlocked: false,
    enemies: ['Reinfecção Viral', 'Bactéria Resistente', 'Super Patógeno'],
    mechanics: 'Células T de Memória + Células B de Memória',
    baseDifficulty: 'hard',
    lockedMessage: 'Complete a fase 4 para desbloquear'
  }
];

// Dificuldades disponíveis com número de ondas
const difficulties = [
  { 
    id: 'easy', 
    name: 'Fácil', 
    color: 'text-green-400', 
    bgColor: 'bg-green-500/20', 
    desc: 'Patógenos básicos',
    waves: 4
  },
  { 
    id: 'medium', 
    name: 'Médio', 
    color: 'text-yellow-400', 
    bgColor: 'bg-yellow-500/20', 
    desc: 'Equilíbrio realista',
    waves: 5
  },
  { 
    id: 'hard', 
    name: 'Difícil', 
    color: 'text-red-400', 
    bgColor: 'bg-red-500/20', 
    desc: 'Patógenos evoluídos',
    waves: 6
  }
];

// Configuração de cores por dificuldade
const difficultyConfig = {
  easy: {
    textColor: 'text-green-400',
    bgColor: 'bg-green-500/20',
    label: 'FÁCIL'
  },
  medium: {
    textColor: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    label: 'MÉDIO'
  },
  hard: {
    textColor: 'text-red-400',
    bgColor: 'bg-red-500/20',
    label: 'DIFÍCIL'
  }
};

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [userScores, setUserScores] = useState([]);
  const [profileStats, setProfileStats] = useState(null);
  const [bestScores, setBestScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  
  // Estados para controle de áudio
  const [audioSettings, setAudioSettings] = useState(() => {
    const saved = localStorage.getItem('virus-hunter-settings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: false,
      volume: 70,
      gameSpeed: 1
    };
  });
  
  const audioRef = useRef(null);

  // Carregar pontuações e estatísticas
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserData();
    }
  }, [isAuthenticated, user]);

  // Controle da música tema
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioSettings.volume / 100;
      audioRef.current.loop = true;
      
      if (audioSettings.soundEnabled) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('⚠️ Navegador bloqueou autoplay:', error.message);
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [audioSettings.soundEnabled, audioSettings.volume]);

  // Ajustar volume quando mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioSettings.volume / 100;
    }
  }, [audioSettings.volume]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Carregar dados em paralelo
      const [scoresResult, profileResult] = await Promise.all([
        loadUserScores(),
        loadProfileStats()
      ]);

      setUserScores(scoresResult);
      setProfileStats(profileResult);
      
      // Calcular melhores pontuações por fase
      const bestScoresMap = {};
      scoresResult.forEach(score => {
        if (!bestScoresMap[score.level_id] || score.score > bestScoresMap[score.level_id].score) {
          bestScoresMap[score.level_id] = score;
        }
      });
      
      setBestScores(bestScoresMap);
      
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data || [];
      
    } catch (error) {
      console.error('Erro ao carregar pontuações:', error);
      return [];
    }
  };

  const loadProfileStats = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      return data;
      
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Retornar estatísticas padrão se não houver perfil
      return {
        total_score: 0,
        total_stars: 0,
        completed_levels: 0,
        username: user.email?.split('@')[0],
        email: user.email
      };
    }
  };

  // Botão de logout
  const handleLogout = async () => {
    try {
      localStorage.removeItem('virus-hunter-session');
      localStorage.removeItem('virus-hunter-user-id');
      localStorage.removeItem('user-interacted');
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 300);
      
    } catch (error) {
      console.error('Erro no logout:', error);
      window.location.href = '/login';
    }
  };

  // Função para jogar fase selecionada
  const handlePlayLevel = (level) => {
    if (!level.unlocked) {
      alert(`🔒 ${level.lockedMessage || 'Fase bloqueada! Complete as fases anteriores.'}`);
      return;
    }
    
    console.log(`🎮 Iniciando fase: ${level.name} (${selectedDifficulty})`);
    
    // Verifica se é a fase 1 (Pele)
    if (level.id === 1) {
      // Salva a dificuldade no localStorage para a fase usar
      localStorage.setItem('virus-hunter-difficulty', selectedDifficulty);
      localStorage.setItem('virus-hunter-level', level.id.toString());
      
      // Navega para a fase 1
      navigate('/phase1');
    } else {
      alert(`🚧 Fase ${level.id} em desenvolvimento!\nPor enquanto, jogue a Fase 1: Pele.`);
    }
  };

  // Função para pegar a pontuação do nível
  const getLevelScore = (levelId) => {
    if (!userScores || userScores.length === 0) return null;
    
    // Filtrar scores para este nível e dificuldade selecionada
    const levelScores = userScores.filter(score => 
      score.level_id === levelId && 
      score.difficulty === selectedDifficulty
    );
    
    if (levelScores.length === 0) return null;
    
    // Retornar o melhor score (maior pontuação)
    return levelScores.reduce((best, current) => 
      current.score > best.score ? current : best
    );
  };

  // Determinar a dificuldade final do nível
  const getLevelDifficulty = (level) => {
    return selectedDifficulty;
  };

  // Obter número de ondas para a dificuldade selecionada
  const getWavesForDifficulty = () => {
    const difficulty = difficulties.find(d => d.id === selectedDifficulty);
    return difficulty ? difficulty.waves : 5;
  };

  // Controle de áudio
  const toggleSound = () => {
    setAudioSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  // Calcular estatísticas do dia
  const getTodayStats = () => {
    const today = new Date().toDateString();
    const todayScores = userScores.filter(score => 
      new Date(score.created_at).toDateString() === today
    );
    
    return {
      matches: todayScores.length,
      score: todayScores.reduce((sum, s) => sum + s.score, 0),
      stars: todayScores.reduce((sum, s) => sum + s.stars, 0),
      average: todayScores.length > 0 ? 
        Math.round(todayScores.reduce((sum, s) => sum + s.score, 0) / todayScores.length) : 0
    };
  };

  // Se não estiver autenticado OU carregando, mostrar loading
  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-emerald-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-emerald-300">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  const todayStats = getTodayStats();
  const wavesCount = getWavesForDifficulty();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-emerald-950 text-white">
      {/* Áudio da música tema */}
      <audio 
        ref={audioRef} 
        src="/audio/theme-music.mp3" 
        preload="auto"
      />

      {/* Header */}
      <header className="bg-slate-900/50 border-b border-emerald-800/30">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Shield className="w-10 h-10 text-emerald-400" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold">Bem-vindo, {user?.name || profileStats?.username || 'Jogador'}!</h1>
                <p className="text-emerald-300 text-sm">
                  Nível {profileStats?.completed_levels || 1} • {user?.email || profileStats?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botão de controle de som */}
              <button
                onClick={toggleSound}
                className={`px-3 py-2 rounded-lg border backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105 ${
                  audioSettings.soundEnabled 
                    ? 'bg-emerald-600/30 border-emerald-500/30 text-emerald-300' 
                    : 'bg-slate-700/50 border-slate-500/30 text-slate-300'
                }`}
                title={audioSettings.soundEnabled ? "Desligar som" : "Ligar som"}
              >
                {audioSettings.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span className="text-xs">{audioSettings.volume}%</span>
              </button>
              
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600/15 hover:bg-red-600/30 rounded-lg border border-red-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="container mx-auto px-4 md:px-6 py-8">
        {/* Título */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">
            Vírus Hunter
          </h2>
          <p className="text-emerald-300">
            Defenda o corpo humano contra invasores patogênicos
          </p>
        </div>

        {/* Estatísticas do Jogador */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-emerald-500/30 mb-8">
          <h3 className="text-xl font-bold text-emerald-300 mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Meu Progresso
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
              <div className="text-3xl font-bold text-white mb-1">
                {profileStats?.total_score || 0}
              </div>
              <div className="text-sm text-emerald-300">Pontos Totais</div>
            </div>
            
            <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/20">
              <div className="text-3xl font-bold text-white mb-1">
                {profileStats?.total_stars || 0}
              </div>
              <div className="text-sm text-amber-300">Estrelas</div>
            </div>
            
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
              <div className="text-3xl font-bold text-white mb-1">
                {profileStats?.completed_levels || 0}/5
              </div>
              <div className="text-sm text-purple-300">Fases Completas</div>
            </div>
            
            <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
              <div className="text-3xl font-bold text-white mb-1">
                {userScores.length}
              </div>
              <div className="text-sm text-blue-300">Partidas Jogadas</div>
            </div>
          </div>
          
          {/* Estatísticas do dia */}
          <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
            <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Estatísticas de Hoje
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-xs text-slate-400 mb-1">Partidas Hoje</div>
                <div className="text-xl font-bold text-emerald-400">{todayStats.matches}</div>
              </div>
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-xs text-slate-400 mb-1">Pontos Hoje</div>
                <div className="text-xl font-bold text-emerald-400">{todayStats.score}</div>
              </div>
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-xs text-slate-400 mb-1">Média Hoje</div>
                <div className="text-xl font-bold text-emerald-400">{todayStats.average}</div>
              </div>
              <div className="p-3 rounded-lg bg-black/20">
                <div className="text-xs text-slate-400 mb-1">Estrelas Hoje</div>
                <div className="text-xl font-bold text-emerald-400">{todayStats.stars}</div>
              </div>
            </div>
          </div>
          
          {/* Últimas partidas */}
          {userScores.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Últimas Partidas
              </h4>
              <div className="space-y-2">
                {userScores.slice(0, 3).map((score, index) => (
                  <div key={score.id || index} className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg">
                    <div>
                      <div className="text-white font-medium">
                        Fase {score.level_id} • {score.difficulty}
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(score.created_at).toLocaleDateString('pt-BR')} • {score.enemies_killed || 0} eliminados
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-emerald-400">{score.score}</div>
                      <div className="text-xs text-slate-400">pontos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Seleção de Dificuldade */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-emerald-300">Selecione a Dificuldade</h3>
            <div className="text-sm text-emerald-400">
              {wavesCount} ondas • {selectedDifficulty === 'easy' ? 'Mais fácil' : selectedDifficulty === 'hard' ? 'Desafio máximo' : 'Equilibrado'}
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`px-4 py-3 rounded-lg border transition-all flex-1 min-w-[120px] ${
                  selectedDifficulty === diff.id
                    ? `${diff.bgColor} border-emerald-500 text-white scale-105`
                    : 'border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10'
                }`}
              >
                <span className={`font-medium ${diff.color}`}>{diff.name}</span>
                <p className="text-xs text-slate-400 mt-1">{diff.desc}</p>
                <div className="mt-2 text-xs text-white/70">
                  {diff.waves} ondas
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Fases do Sistema Imunológico */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Fases de Defesa Imunológica</h3>
            <div className="text-sm text-emerald-300">
              Dificuldade: <span className={`font-bold ${difficultyConfig[selectedDifficulty]?.textColor || 'text-white'}`}>
                {selectedDifficulty.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {immuneSystemLevels.map((level) => {
              const Icon = level.icon;
              const levelScore = getLevelScore(level.id);
              const isSelected = selectedLevel?.id === level.id;
              const currentDifficulty = getLevelDifficulty(level);
              const difficultyInfo = difficultyConfig[currentDifficulty];
              
              return (
                <div
                  key={level.id}
                  className={`rounded-xl border-2 p-5 transition-all ${
                    isSelected ? 'border-emerald-500 bg-emerald-500/10 scale-[1.02]' : 
                    level.unlocked ? 'border-emerald-500/30 bg-slate-900/50 hover:bg-slate-800/50' : 
                    'border-gray-700/50 bg-gray-900/30 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${level.bgColor} ${!level.unlocked ? 'opacity-50' : ''}`}>
                      {level.unlocked ? (
                        <Icon className="w-7 h-7 text-white" />
                      ) : (
                        <Lock className="w-7 h-7 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-1">{level.name}</h4>
                          <p className="text-emerald-200/70 text-sm mb-2">{level.description}</p>
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${difficultyInfo.bgColor} ${difficultyInfo.textColor}`}>
                          {difficultyInfo.label}
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-slate-400 mb-1">
                          <span className="text-emerald-300">Mecânica: </span>
                          {level.mechanics}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {level.enemies.map((enemy, i) => (
                            <span key={i} className="text-xs px-2 py-0.5 bg-black/30 rounded text-emerald-300">
                              {enemy}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {levelScore?.score ? (
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-emerald-400 font-bold">
                                Melhor: {levelScore.score} pts
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-sm">Ainda não jogado</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-sm">{wavesCount} ondas</span>
                          <button
                            onClick={() => handlePlayLevel(level)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                              level.unlocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-105'
                                : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {level.unlocked ? (
                              <>
                                <Gamepad2 className="w-4 h-4" />
                                Jogar
                                <ArrowRight className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" />
                                Bloqueado
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {!level.unlocked && level.lockedMessage && (
                        <div className="mt-3 p-2 bg-gray-800/50 rounded text-sm text-gray-400">
                          🔒 {level.lockedMessage}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informações adicionais */}
        <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 p-6 mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-emerald-400" />
            Estatísticas Detalhadas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">ID do Usuário</p>
              <p className="text-xs font-mono truncate">{user?.id?.substring(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Partidas Jogadas</p>
              <p className="text-sm text-emerald-400 font-bold">{userScores.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Fases Ativas</p>
              <p className="text-sm text-emerald-400 font-bold">2/5</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Status da Conta</p>
              <p className="text-sm text-green-400 font-bold">✓ Verificada</p>
            </div>
          </div>
          
          {/* Resumo de pontuações por dificuldade */}
          {userScores.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-700/50">
              <h4 className="text-md font-bold text-white mb-3">Resumo por Dificuldade</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {['easy', 'medium', 'hard'].map(diff => {
                  const diffScores = userScores.filter(s => s.difficulty === diff);
                  const totalScore = diffScores.reduce((sum, score) => sum + score.score, 0);
                  const totalMatches = diffScores.length;
                  const bestScore = totalMatches > 0 ? Math.max(...diffScores.map(s => s.score)) : 0;
                  
                  return (
                    <div key={diff} className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-bold ${difficultyConfig[diff]?.textColor || 'text-white'}`}>
                          {diff.toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">{totalMatches} partidas</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Pontos:</span>
                          <span className="text-white font-bold">{totalScore}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Recorde:</span>
                          <span className="text-emerald-400 font-bold">{bestScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Botões de navegação */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <button
            onClick={() => navigate('/home')}
            className="px-6 py-3 bg-emerald-600/30 hover:bg-emerald-600/40 text-white rounded-lg border border-emerald-500/30 transition-all hover:scale-105"
          >
            ← Voltar para Home Page
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/scores')}
              className="px-6 py-3 bg-purple-600/30 hover:bg-purple-600/40 text-white rounded-lg border border-purple-500/30 transition-all hover:scale-105 flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Ver Histórico Completo
            </button>
            <button
              onClick={() => alert('📚 Tutoriais em desenvolvimento!')}
              className="px-6 py-3 bg-blue-600/30 hover:bg-blue-600/40 text-white rounded-lg border border-blue-500/30 transition-all hover:scale-105"
            >
              Tutorial
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-slate-800/50 text-center">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-emerald-300 font-bold">Vírus Hunter</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Sistema Imunológico - Jogo Educativo
              </p>
            </div>
            
            <div className="text-sm text-slate-400">
              <p>Usuário: {user?.email?.split('@')[0] || 'Jogador'}</p>
              <p className="text-xs mt-1">ID: {user?.id?.substring(0, 8)}...</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Users className="w-4 h-4" />
                <span>Versão 1.0 • {new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}