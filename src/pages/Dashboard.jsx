import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { 
  Shield, LogOut, Gamepad2, BarChart3, Lock, Star,
  Layers, Wind, Heart, Brain, Bone, ArrowRight, Volume2, VolumeX
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
    waves: 4,
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
    waves: 5,
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
    waves: 6,
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
    waves: 7,
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
    waves: 8,
    enemies: ['Reinfecção Viral', 'Bactéria Resistente', 'Super Patógeno'],
    mechanics: 'Células T de Memória + Células B de Memória',
    baseDifficulty: 'hard',
    lockedMessage: 'Complete a fase 4 para desbloquear'
  }
];

// Dificuldades disponíveis
const difficulties = [
  { id: 'easy', name: 'Fácil', color: 'text-green-400', bgColor: 'bg-green-500/20', desc: 'Patógenos básicos' },
  { id: 'medium', name: 'Médio', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', desc: 'Equilíbrio realista' },
  { id: 'hard', name: 'Difícil', color: 'text-red-400', bgColor: 'bg-red-500/20', desc: 'Patógenos evoluídos' }
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
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  
  // ESTADOS PARA CONTROLE DE ÁUDIO
  const [audioSettings, setAudioSettings] = useState(() => {
    const saved = localStorage.getItem('virus-hunter-settings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: false,
      volume: 70,
      gameSpeed: 1
    };
  });
  
  const audioRef = useRef(null);

  // BUSCAR DADOS DO USUÁRIO
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchUserStats();
    }
  }, [isAuthenticated, user]);

  // CONTROLE DA MÚSICA TEMA
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioSettings.volume / 100;
      audioRef.current.loop = true;
      
      if (audioSettings.soundEnabled) {
        console.log('▶️ Iniciando música no dashboard...');
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('⚠️ Navegador bloqueou autoplay:', error.message);
          });
        }
      } else {
        console.log('⏸️ Música pausada no dashboard');
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

  const fetchUserStats = async () => {
    try {
      const { data: gameProgress } = await supabase
        .from('game_progress')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      const { data: levelScores } = await supabase
        .from('level_scores')
        .select('*')
        .eq('user_id', user?.id);

      setStats({
        gameProgress: gameProgress || {},
        levelScores: levelScores || [],
        totalScore: gameProgress?.total_score || 0,
        completedLevels: levelScores?.filter(s => s.completed).length || 0
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  // BOTÃO DE LOGOUT
  const handleLogout = async () => {
    console.log('🚪 Iniciando logout...');
    
    try {
      localStorage.removeItem('virus-hunter-session');
      localStorage.removeItem('virus-hunter-user-id');
      localStorage.removeItem('user-interacted');
      
      console.log('✅ LocalStorage limpo');
      
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
    alert(`🚀 Iniciando ${level.name} no modo ${selectedDifficulty.toUpperCase()}!\n\nEsta funcionalidade será integrada com o jogo Tower Defense em breve.`);
  };

  // Verificar pontuação da fase
  const getLevelScore = (levelId) => {
    if (!stats?.levelScores) return null;
    return stats.levelScores.find(s => 
      s.level_id === levelId && s.difficulty === selectedDifficulty
    );
  };

  // Determinar a dificuldade final do nível
  const getLevelDifficulty = (level) => {
    return selectedDifficulty;
  };

  // Controle de áudio
  const toggleSound = () => {
    setAudioSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
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
                <h1 className="text-2xl font-bold">Bem-vindo, {user?.name}!</h1>
                <p className="text-emerald-300 text-sm">
                  Nível {user?.progress?.level || 1} • {user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Botão de controle de som */}
             <button
                onClick={toggleSound}
              
                //className="fixed top-4 right-20 bg-emerald-600/30 hover:bg-emerald-600/30 text-white px-4 py-2 rounded-lg z-50 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
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

        {/* Seleção de Dificuldade */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-emerald-300 mb-4">Selecione a Dificuldade</h3>
          <div className="flex gap-3 flex-wrap">
            {difficulties.map((diff) => (
              <button
                key={diff.id}
                onClick={() => setSelectedDifficulty(diff.id)}
                className={`px-4 py-3 rounded-lg border transition-all ${
                  selectedDifficulty === diff.id
                    ? `${diff.bgColor} border-emerald-500 text-white`
                    : 'border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10'
                }`}
              >
                <span className={`font-medium ${diff.color}`}>{diff.name}</span>
                <p className="text-xs text-slate-400 mt-1">{diff.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Fases do Sistema Imunológico */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">Fases de Defesa Imunológica</h3>
            <div className="text-sm text-emerald-300">
              Dificuldade: <span className="font-bold">{selectedDifficulty.toUpperCase()}</span>
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
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= (levelScore?.stars || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          {levelScore?.score && (
                            <span className="text-emerald-400 font-bold text-sm">{levelScore.score} pts</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-sm">{level.waves} ondas</span>
                          <button
                            onClick={() => handlePlayLevel(level)}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                              level.unlocked
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
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
            Progresso do Jogador
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-400">ID do Usuário</p>
              <p className="text-xs font-mono truncate">{user?.id?.substring(0, 8)}...</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Último Login</p>
              <p className="text-sm">
                {user?.progress?.last_login 
                  ? new Date(user.progress.last_login).toLocaleDateString('pt-BR')
                  : 'Primeiro acesso'
                }
              </p>
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
        </div>

        {/* Botões de navegação */}
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <button
            onClick={() => window.location.href = '/home'}
            className="px-6 py-3 bg-emerald-600/30 hover:bg-emerald-600/40 text-white rounded-lg border border-emerald-500/30 transition-all hover:scale-105"
          >
            ← Voltar para Home Page
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={() => alert('🏆 Sistema de conquistas em desenvolvimento!')}
              className="px-6 py-3 bg-purple-600/30 hover:bg-purple-600/40 text-white rounded-lg border border-purple-500/30 transition-all"
            >
              Ver Conquistas
            </button>
            <button
              onClick={() => alert('📚 Tutoriais em desenvolvimento!')}
              className="px-6 py-3 bg-blue-600/30 hover:bg-blue-600/40 text-white rounded-lg border border-blue-500/30 transition-all"
            >
              Tutorial
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}