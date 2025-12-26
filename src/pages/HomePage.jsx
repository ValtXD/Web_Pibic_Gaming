import React, { useState, useEffect, useRef } from 'react';
import StartScreen from '../components/StartScreen';
import ScoresModal from '../components/ScoresModal';
import SettingsModal from '../components/SettingsModal';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';

export default function HomePage() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [showScores, setShowScores] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({
    soundEnabled: false,
    volume: 70,
    gameSpeed: 1
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

  // VERIFICAR AUTENTICAÇÃO - Igual ao Dashboard
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('❌ Não autenticado, redirecionando para login');
        navigate('/login');
      } else {
        console.log('✅ Autenticado, mostrando HomePage');
      }
    }
  }, [isAuthenticated, loading, navigate]);

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

  // LOADING STATE - Igual ao Dashboard
  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        <p className="ml-3 text-emerald-300">Verificando autenticação...</p>
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
    // Você pode salvar no localStorage se quiser persistir entre sessões
    localStorage.setItem('virus-hunter-settings', JSON.stringify(newSettings));
  };

  // Botão de controle de som flutuante
  const toggleSound = () => {
    setSettings(prev => ({
      ...prev,
      soundEnabled: !prev.soundEnabled
    }));
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
      <button
        onClick={() => navigate('/dashboard')}
        className="fixed top-4 left-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-white px-4 py-2 rounded-lg z-50 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
      >
        <span>Ir para Dashboard</span>
      </button>

      {/* Botão de controle de som */}
      <button
        onClick={toggleSound}
        className="fixed top-4 right-20 bg-emerald-600/30 hover:bg-emerald-600/30 text-white px-4 py-2 rounded-lg z-50 border border-emerald-500/30 backdrop-blur-sm flex items-center gap-2 transition-all hover:scale-105"
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
        className="fixed top-4 right-4 bg-red-600/20 hover:bg-red-600/30 text-white px-4 py-2 rounded-lg z-50 border border-red-500/30 backdrop-blur-sm transition-all hover:scale-105"
      >
        Sair
      </button>

      {/* Debug info (apenas em desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm text-xs p-3 rounded-lg border border-emerald-500/30 z-50">
          <p className="text-emerald-300">🛠️ Modo Desenvolvimento</p>
          <p className="text-white/70">Usuário: {user?.email}</p>
          <p className="text-white/70">Som: {settings.soundEnabled ? 'ON' : 'OFF'} ({settings.volume}%)</p>
          <p className="text-emerald-400">✓ Autenticado</p>
        </div>
      )}
    </>
  );
}