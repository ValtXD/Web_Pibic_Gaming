import React, { useState, useEffect, useRef } from 'react';
import StartScreen from '../components/StartScreen';
import ScoresModal from '../components/ScoresModal';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, RefreshCw } from 'lucide-react';
import { syncAllBackups } from '../pages/levels/Phase1Database';

export default function HomePage() {
  const { user, logout, isAuthenticated, loading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [showScores, setShowScores] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState(() => {
    // Carregar configurações do localStorage ou usar padrão
    const saved = localStorage.getItem('virus-hunter-settings');
    return saved ? JSON.parse(saved) : {
      soundEnabled: false,
      volume: 70,
      gameSpeed: 1
    };
  });

  // REF para controle do áudio
  const audioRef = useRef(null);

  // DEBUG - Verificar estado da autenticação
  useEffect(() => {
    console.log('🔍 HomePage Auth State:', {
      isAuthenticated,
      loading,
      userExists: !!user,
      userEmail: user?.email,
      userId: user?.id
    });
  }, [isAuthenticated, loading, user]);

  // VERIFICAR AUTENTICAÇÃO - Agora mais robusto
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        console.log('❌ Não autenticado, redirecionando para login');
        navigate('/login');
      } else {
        console.log('✅ Autenticado, mostrando HomePage para:', user.email);
        
        // Tentar sincronizar backups automaticamente
        syncBackupsAutomatically();
      }
    }
  }, [isAuthenticated, loading, user, navigate]);

  // Sincronizar backups automaticamente quando usuário logar
  const syncBackupsAutomatically = async () => {
    if (user?.id) {
      try {
        const backupKey = 'virus-hunter-scores-backup';
        const backups = JSON.parse(localStorage.getItem(backupKey) || '[]');
        
        const userBackups = backups.filter(backup => backup.userId === user.id);
        
        if (userBackups.length > 0) {
          console.log(`🔄 Sincronizando ${userBackups.length} backup(s) automaticamente...`);
          // A sincronização será feita quando o usuário jogar novamente
        }
      } catch (error) {
        console.error('❌ Erro ao verificar backups:', error);
      }
    }
  };

  // CONTROLE DA MÚSICA
  useEffect(() => {
    if (audioRef.current) {
      if (settings.soundEnabled) {
        audioRef.current.volume = settings.volume / 100;
        audioRef.current.loop = true;

        console.log('🎵 Tentando iniciar música...');

        // Tenta tocar (requer interação do usuário em alguns navegadores)
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log('🔇 Autoplay bloqueado, aguardando interação do usuário', error.message);
          });
        }
      } else {
        console.log('🔇 Som desativado');
        audioRef.current.pause();
      }
    }
  }, [settings.soundEnabled, settings.volume]);

  // Ajustar volume quando mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = settings.volume / 100;
    }
  }, [settings.volume]);

  // Salvar configurações no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('virus-hunter-settings', JSON.stringify(settings));
  }, [settings]);

  // LOADING STATE
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-emerald-300 text-lg">Carregando...</p>
          <p className="text-slate-400 text-sm mt-2">Verificando autenticação</p>
        </div>
      </div>
    );
  }

  const handleStartGame = () => {
    console.log('🎮 Iniciando jogo...');
    navigate('/dashboard');
  };

  const handleCredits = () => {
    alert('Vírus Hunter\nProjeto PIBIC/UFAM\nDesenvolvido por Francisco\n\nUm jogo educativo sobre o sistema imunológico!');
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleManualSync = async () => {
    if (!user?.id) return;
    
    setIsSyncing(true);
    try {
      const result = await syncAllBackups();
      if (result) {
        alert('✅ Sincronização iniciada! As pontuações serão salvas online.');
      }
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
      alert('⚠️ Não foi possível sincronizar. Tente novamente mais tarde.');
    } finally {
      setIsSyncing(false);
    }
  };

  // Botão de controle de som flutuante
  const toggleSound = () => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
  };

  const handleRefreshUser = async () => {
    await refreshUser();
  };

  return (
    <>
      {/* Áudio da música tema */}
      <audio 
        ref={audioRef} 
        src="/audio/theme-music.mp3" 
        preload="auto"
      />

      <StartScreen 
        onStart={handleStartGame}
        onSettings={() => setShowSettings(true)}
        onCredits={handleCredits}
        onScores={() => setShowScores(true)}
      />
      
      <ScoresModal
        isOpen={showScores}
        onClose={() => setShowScores(false)}
      />
      
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {/* Botões de navegação */}
      <div className="fixed top-4 left-4 right-4 flex justify-between items-center z-50">
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-white px-4 py-2 rounded-lg border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
        >
          <span>Ir para Dashboard</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Botão de atualizar usuário */}
          <button
            onClick={handleRefreshUser}
            className="bg-blue-600/20 hover:bg-blue-600/30 text-white px-3 py-2 rounded-lg border border-blue-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
            title="Atualizar dados do usuário"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Botão de sincronização */}
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="bg-purple-600/20 hover:bg-purple-600/30 text-white px-3 py-2 rounded-lg border border-purple-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
            title="Sincronizar pontuações"
          >
            {isSyncing ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </button>

          {/* Botão de controle de som */}
          <button
            onClick={toggleSound}
            className="bg-emerald-600/30 hover:bg-emerald-600/30 text-white px-3 py-2 rounded-lg border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
            title={settings.soundEnabled ? "Desligar som" : "Ligar som"}
          >
            {settings.soundEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span className="text-xs">{settings.volume}%</span>
          </button>

          <button
            onClick={logout}
            className="bg-red-600/20 hover:bg-red-600/30 text-white px-4 py-2 rounded-lg border border-red-500/30 backdrop-blur-sm transition-all hover:scale-105"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Informações do usuário */}
      <div className="fixed bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm text-sm p-3 rounded-lg border border-emerald-500/30 z-50 max-w-xs">
        <p className="text-emerald-300 font-semibold">👤 {user?.email}</p>
        <p className="text-white/70 text-xs mt-1">ID: {user?.id?.substring(0, 8)}...</p>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span className="text-green-400 text-xs">Conectado</span>
        </div>
      </div>

      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-slate-900/80 backdrop-blur-sm text-xs p-3 rounded-lg border border-emerald-500/30 z-50">
          <p className="text-emerald-300">🛠️ Modo Desenvolvimento</p>
          <p className="text-white/70">Usuário: {user?.email}</p>
          <p className="text-white/70">ID: {user?.id}</p>
          <p className="text-white/70">Som: {settings.soundEnabled ? 'ON' : 'OFF'} ({settings.volume}%)</p>
          <p className="text-emerald-400">✓ Autenticado</p>
        </div>
      )}
    </>
  );
}