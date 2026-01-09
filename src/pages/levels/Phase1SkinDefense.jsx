import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { savePhase1Score, checkScoresTable } from './Phase1Database';
import Phase1Tooltip, { TOWER_INFO_PHASE1, ENEMY_INFO_PHASE1 } from './Phase1Components';
import { 
  Play, Pause, RotateCcw, Trophy, Shield, Zap, 
  Sparkles, AlertTriangle, Heart, Layers,
  Home, Volume2, VolumeX, Star, Target,
  Activity, FastForward, Info, Microscope, RefreshCw
} from 'lucide-react';

// Configurações do jogo para fase 1 - TELA MAIOR
const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const CELL_SIZE = 40;

// DEFENSAS DA FASE 1 (MANTIDAS)
const TOWER_TYPES = {
  MACROFAGO: {
    id: 'MACROFAGO',
    name: 'Macrófago Residente',
    icon: Shield,
    cost: 100,
    damage: 15,
    range: 120,
    fireRate: 1000,
    color: '#f59e0b',
    description: 'Fagócito guarda - alta detecção, dano médio',
    projectileColor: '#fbbf24',
    scientificInfo: 'Primeira linha de defesa na pele. Fagocita invasores e remove detritos.',
    hasActiveAbility: false
  },
  DENDRITICA: {
    id: 'DENDRITICA',
    name: 'Célula Dendrítica',
    icon: Sparkles,
    cost: 120,
    damage: 0,
    range: 150,
    fireRate: 0,
    color: '#3b82f6',
    description: 'Coleta antígenos - gera ATP extra',
    projectileColor: '#60a5fa',
    scientificInfo: 'Célula apresentadora de antígenos. Coleta patógenos mortos para aprendizado imunológico.',
    hasActiveAbility: false,
    antigenMultiplier: 1.5
  },
  MASTOCITO: {
    id: 'MASTOCITO',
    name: 'Mastócito',
    icon: AlertTriangle,
    cost: 80,
    damage: 5,
    range: 90,
    fireRate: 2000,
    color: '#8b5cf6',
    description: 'Libera histamina - retarda inimigos',
    projectileColor: '#a78bfa',
    scientificInfo: 'Libera mediadores inflamatórios que aumentam a permeabilidade vascular.',
    hasActiveAbility: false,
    slowAmount: 0.5, // Reduz velocidade para 50%
    slowDuration: 2000 // Duração em ms
  },
  EOSINOFILO: {
    id: 'EOSINOFILO',
    name: 'Eosinófilo',
    icon: Zap,
    cost: 150,
    damage: 30,
    range: 100,
    fireRate: 1500,
    color: '#ec4899',
    description: 'Dano em área - ideal contra aglomerados',
    projectileColor: '#f472b6',
    scientificInfo: 'Especializado contra parasitas e reações alérgicas. Causa dano em área.',
    hasActiveAbility: false,
    splashRadius: 60
  },
  QUIMIOCINA: {
    id: 'QUIMIOCINA',
    name: 'Quimiocinas',
    icon: Activity,
    cost: 120,
    damage: 0,
    range: 180,
    fireRate: 0,
    color: '#10b981',
    description: 'Sinais químicos - buff de dano para aliados',
    projectileColor: '#34d399',
    scientificInfo: 'Sinais químicos liberados por células para chamar reforços e ampliar resposta inflamatória.',
    hasActiveAbility: true,
    abilityCooldown: 15000,
    abilityDuration: 8000,
    damageBuff: 1.5,
    auraColor: '#fbbf24'
  }
};

// INVASORES DA FASE 1 (MANTIDAS)
const ENEMY_TYPES = {
  BACTERIA_COMENSAL: {
    id: 'BACTERIA_COMENSAL',
    name: 'Bactéria Comensal',
    health: 80,
    speed: 1.0,
    reward: 15,
    color: '#22c55e',
    size: 12,
    description: 'Flora normal que se torna oportunista',
    scientificInfo: 'Bactérias da pele que causam infecção quando a barreira é rompida.',
    atpReward: 15
  },
  VIRUS_ENTRADA: {
    id: 'VIRUS_ENTRADA',
    name: 'Vírus de Entrada',
    health: 60,
    speed: 1.8,
    reward: 20,
    color: '#ef4444',
    size: 8,
    description: 'Rápido - tenta passar pelas defesas',
    scientificInfo: 'Vírus como Herpes simplex que infectam células da pele.',
    atpReward: 20
  },
  ESPORO_FUNGICO: {
    id: 'ESPORO_FUNGICO',
    name: 'Esporo Fúngico',
    health: 150,
    speed: 0.5,
    reward: 25,
    color: '#a855f7',
    size: 18,
    description: 'Resistente - alta vida, baixa velocidade',
    scientificInfo: 'Esporos de fungos ambientais que entram por feridas.',
    atpReward: 25
  },
  TOXINA: {
    id: 'TOXINA',
    name: 'Toxina Bacteriana',
    health: 100,
    speed: 1.0,
    reward: 30,
    color: '#f97316',
    size: 14,
    description: 'Slow - reduz velocidade das defesas',
    scientificInfo: 'Moléculas tóxicas liberadas por bactérias que prejudicam células.',
    atpReward: 30,
    toxinDebuff: 0.7
  },
  BIOFILME: {
    id: 'BIOFILME',
    name: 'Bactéria Agregada',
    health: 200,
    speed: 0.5,
    reward: 50,
    color: '#0ea5e9',
    size: 25,
    description: 'Horda - grupos de bactérias resistentes',
    scientificInfo: 'Biofilme bacteriano que resiste à fagocitose e antibióticos.',
    atpReward: 50
  }
};

const PATH = [
  { x: 0, y: 350 },               
  { x: 200, y: 350 },             
  { x: 200, y: 200 },             
  { x: 400, y: 200 },             
  { x: 400, y: 500 },             
  { x: 600, y: 500 },             
  { x: 600, y: 300 },             
  { x: 800, y: 300 },             
  { x: 800, y: 400 },             
  { x: 1000, y: 400 },            
  { x: 1000, y: 350 },            
  { x: 1200, y: 350 }             
];

// Configuração atualizada: Energia 500 no Médio, 700 no Difícil
const DIFFICULTY_SETTINGS = {
  easy: { enemyMultiplier: 1.0, rewardMultiplier: 1.0, startingEnergy: 400, startingHealth: 150, wavesPerPhase: 4, enemySpeedMultiplier: 0.8 },
  medium: { enemyMultiplier: 1.0, rewardMultiplier: 1.0, startingEnergy: 500, startingHealth: 100, wavesPerPhase: 5, enemySpeedMultiplier: 1.0 }, 
  hard: { enemyMultiplier: 1.0, rewardMultiplier: 0.8, startingEnergy: 700, startingHealth: 80, wavesPerPhase: 6, enemySpeedMultiplier: 1.0 }
};

const SideInfoPanel = ({ item, title }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  useEffect(() => { setIsFlipped(false); }, [item]);
  if (!item) return null;

  const detailedInfo = TOWER_INFO_PHASE1[item.type] || ENEMY_INFO_PHASE1[item.type];
  const color = item.color || '#3b82f6';
  const IconComponent = item.icon || Microscope;

  return (
    <div className="h-full w-full relative" style={{ perspective: '1000px' }}>
      <motion.div
        className="h-full w-full relative transition-all duration-500"
        style={{ transformStyle: 'preserve-3d', transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* FRENTE */}
        <div className="absolute inset-0 h-full w-full bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden flex flex-col" style={{ backfaceVisibility: 'hidden' }}>
          <div className="w-full h-2" style={{ backgroundColor: color }} />
          <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 shadow-inner mb-3 transform scale-125">
                 <IconComponent className="w-8 h-8" style={{ color: color }} />
              </div>
              <h3 className="font-bold text-2xl text-white leading-tight mb-2">{item.name}</h3>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 border border-slate-600 uppercase tracking-wider" style={{ color: color }}>{title} - Jogo</span>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Custo/Recompensa</span>
                  <span className="text-emerald-400 font-bold font-mono text-lg">{item.cost ? item.cost : `+${item.atpReward || item.reward}`} ATP</span>
                </div>
                {item.damage !== undefined && <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center"><span className="text-xs text-slate-400 block mb-1">Dano</span><span className="text-white font-bold font-mono text-lg">{item.damage}</span></div>}
                {item.health !== undefined && <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center"><span className="text-xs text-slate-400 block mb-1">Vida</span><span className="text-white font-bold font-mono text-lg">{item.health}</span></div>}
                {item.speed !== undefined && <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700/50 text-center"><span className="text-xs text-slate-400 block mb-1">Velocidade</span><span className="text-white font-bold font-mono text-lg">{item.speed?.toFixed(1)}x</span></div>}
            </div>
            <div className="space-y-4 mb-4 flex-grow">
              <div><span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-1">Habilidade no Jogo</span><p className="text-sm text-slate-300 leading-relaxed">{item.description}</p></div>
              {item.hasActiveAbility && (<div className="p-3 bg-sky-500/10 border border-sky-500/20 rounded-lg"><div className="flex items-start gap-2"><Info className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" /><div><span className="text-xs font-bold text-sky-400 block mb-0.5">Habilidade Ativa</span><p className="text-xs text-slate-300">Clique na torre no mapa para ativar.</p></div></div></div>)}
            </div>
            <button onClick={() => setIsFlipped(true)} className="w-full py-3 mt-auto bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors group"><RefreshCw className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" /><span className="text-sm font-bold text-white">Ver Informações Científicas</span></button>
          </div>
        </div>
        {/* VERSO */}
        <div className="absolute inset-0 h-full w-full bg-slate-900 rounded-2xl border-2 shadow-2xl overflow-hidden flex flex-col" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderColor: color }}>
             <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ backgroundColor: color }} />
             <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col relative z-10">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700/50"><Microscope className="w-6 h-6" style={{ color: color }} /><h3 className="font-bold text-xl text-white">Biologia Real</h3></div>
                {detailedInfo ? (
                    <div className="space-y-5 flex-grow">
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-2 text-slate-300"><Heart className="w-4 h-4 text-rose-400" /><span className="text-xs font-bold uppercase tracking-wide">Função Biológica</span></div>
                            <p className="text-sm text-slate-200 leading-relaxed italic mb-3">"{detailedInfo.realFunction}"</p>
                            <div className="border-t border-slate-700/50 pt-3 mt-1"><p className="text-sm text-slate-300 leading-relaxed">{detailedInfo.description}</p></div>
                        </div>
                        {detailedInfo.funFacts && (<div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20"><div className="flex items-center gap-2 mb-3"><Sparkles className="w-4 h-4 text-purple-400" /><span className="text-xs font-bold text-purple-300 uppercase tracking-wide">Curiosidades</span></div><ul className="space-y-2">{detailedInfo.funFacts.map((fact, idx) => (<li key={idx} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-purple-500 mt-1">•</span>{fact}</li>))}</ul></div>)}
                        {detailedInfo.diseases && (<div className="bg-red-900/20 rounded-xl p-4 border border-red-500/20"><div className="flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4 text-red-400" /><span className="text-xs font-bold text-red-300 uppercase tracking-wide">Doenças Associadas</span></div><ul className="space-y-2">{detailedInfo.diseases.map((disease, idx) => (<li key={idx} className="text-sm text-slate-300 flex items-start gap-2"><span className="text-red-500 mt-1">•</span>{disease}</li>))}</ul></div>)}
                         {detailedInfo.howItWorks && (<div className="bg-yellow-900/20 rounded-xl p-4 border border-yellow-500/20"><div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-yellow-400" /><span className="text-xs font-bold text-yellow-300 uppercase tracking-wide">Mecanismo</span></div><p className="text-sm text-slate-300">{detailedInfo.howItWorks}</p></div>)}
                    </div>
                ) : (<div className="flex items-center justify-center h-40 text-slate-500"><p>Informações detalhadas não disponíveis.</p></div>)}
                <button onClick={() => setIsFlipped(false)} className="w-full py-3 mt-6 bg-slate-800 border border-slate-600 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors group"><RefreshCw className="w-4 h-4 text-blue-400 group-hover:-rotate-180 transition-transform duration-500" /><span className="text-sm font-bold text-white">Voltar para Jogo</span></button>
             </div>
        </div>
      </motion.div>
    </div>
  );
};

export default function Phase1SkinDefense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canvasRef = useRef(null);
  
  // Estados de Renderização (Visual)
  const [gameState, setGameState] = useState('menu');
  const [energy, setEnergy] = useState(300);
  const [health, setHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);
  const [collectedAntigens, setCollectedAntigens] = useState(0);
  
  // Estados de UI
  const [selectedTower, setSelectedTower] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [hoveredCanvasItem, setHoveredCanvasItem] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [leftPanelItem, setLeftPanelItem] = useState(null);
  const [rightPanelItem, setRightPanelItem] = useState(null);
  const [gameSpeed, setGameSpeed] = useState(1.0); 
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [visualEffects, setVisualEffects] = useState([]);
  const [atpPopups, setAtpPopups] = useState([]);
  const [activeAbilities, setActiveAbilities] = useState({});
  const [abilityCooldowns, setAbilityCooldowns] = useState({});
  const [clickedTowerId, setClickedTowerId] = useState(null);

  // REFS PARA A FÍSICA E SALVAMENTO
  const towersRef = useRef([]);
  const enemiesRef = useRef([]);
  const projectilesRef = useRef([]);
  const gameStateRef = useRef('menu');
  
  const scoreRef = useRef(0);
  const antigensRef = useRef(0);
  const healthRef = useRef(100);

  // Referência para controlar o estado visual
  const [renderTrigger, setRenderTrigger] = useState(0); 

  const [difficulty, setDifficulty] = useState(() => {
    const saved = localStorage.getItem('virus-hunter-difficulty');
    return saved || 'medium';
  });
  
  const [wallBreaches, setWallBreaches] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [lastSavedScore, setLastSavedScore] = useState(null);

  const animationFrameRef = useRef();
  const lastTimeRef = useRef(Date.now());
  const enemySpawnTimerRef = useRef(0);
  const waveEnemiesSpawnedRef = useRef(0);
  const waveCompletedRef = useRef(false);
  const gameSettings = DIFFICULTY_SETTINGS[difficulty];

  // Sincronizar State com Refs para garantir salvamento correto
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { antigensRef.current = collectedAntigens; }, [collectedAntigens]);
  useEffect(() => { healthRef.current = health; }, [health]);

  useEffect(() => {
    const savedDifficulty = localStorage.getItem('virus-hunter-difficulty');
    if (savedDifficulty && DIFFICULTY_SETTINGS[savedDifficulty]) {
      setDifficulty(savedDifficulty);
    }
  }, []);

  useEffect(() => {
      gameStateRef.current = gameState;
  }, [gameState]);

  // Função encapsulada com useCallback para resolver dependência do useEffect
  const spawnEnemy = useCallback(() => {
    // Lista de todos os tipos de inimigos
    const enemyListAll = Object.values(ENEMY_TYPES);
    
    // IA ESTRATÉGICA PARA O MODO DIFÍCIL
    let enemyType;
    
    if (difficulty === 'hard') {
        // IA Decide com base no progresso
        // Se a saúde estiver baixa (<40%), manda inimigos rápidos (Vírus) para finalizar
        // Se a energia estiver alta (>600), manda inimigos tanques (Biofilme/Esporo) para drenar recursos
        // Caso contrário, mistura com pesos baseados na onda
        
        const currentHealth = healthRef.current;
        const currentEnergy = energy; // Note: energy state pode ter um pequeno delay em relação à ref, mas aceitável aqui
        
        const chance = Math.random();
        
        if (currentHealth < 40 && chance > 0.3) {
            enemyType = ENEMY_TYPES.VIRUS_ENTRADA; // Estratégia de finalização
        } else if (currentEnergy > 600 && chance > 0.4) {
            enemyType = chance > 0.7 ? ENEMY_TYPES.BIOFILME : ENEMY_TYPES.ESPORO_FUNGICO; // Estratégia de tanque
        } else {
             // Progressão normal ponderada pela onda no modo difícil
             const maxIndex = Math.min(wave, enemyListAll.length) - 1;
             // Chance maior de inimigos mais fortes
             const skewedIndex = Math.floor(Math.pow(Math.random(), 0.5) * (maxIndex + 1));
             enemyType = enemyListAll[Math.min(skewedIndex, maxIndex)];
        }
    } else {
        // Lógica padrão para Fácil/Médio
        const maxEnemyIndex = Math.min(wave, enemyListAll.length) - 1;
        const typeIndex = Math.floor(Math.random() * (maxEnemyIndex + 1));
        enemyType = enemyListAll[typeIndex];
    }
    
    // Calcular estatísticas base (sem multiplicadores globais, faremos aditivo)
    // Usando 1.0 como base nos settings para medio/dificil para facilitar a soma
    let calculatedHealth = enemyType.health;
    let calculatedSpeed = enemyType.speed;

    // APLICAÇÃO DE DIFICULDADE (Lógica Aditiva)
    if (difficulty === 'medium') {
      calculatedHealth += 20;
      calculatedSpeed += 0.5;
    } else if (difficulty === 'hard') {
      // Médio (+20) + 30 = +50
      calculatedHealth += 50; 
      // Médio (+0.5) + 0.5 = +1.0
      calculatedSpeed += 1.0;
    } else {
       // Fácil usa multiplicadores do settings (0.8x speed etc)
       calculatedHealth = Math.floor(enemyType.health * gameSettings.enemyMultiplier);
       calculatedSpeed = enemyType.speed * gameSettings.enemySpeedMultiplier;
    }

    // LÓGICA DE MUTAÇÃO (Apenas Difícil)
    let isMutated = false;
    if (difficulty === 'hard') {
        // 30% de chance de mutação
        if (Math.random() < 0.3) {
            isMutated = true;
            // Dobro da vida atual do modo difícil
            calculatedHealth = calculatedHealth * 2;
            // Velocidade permanece a mesma (já somada +1.0)
        }
    }

    const newEnemy = {
      id: Date.now() + Math.random(),
      type: enemyType.id,
      health: calculatedHealth,
      maxHealth: calculatedHealth,
      speed: calculatedSpeed,
      reward: Math.floor(enemyType.reward * gameSettings.rewardMultiplier),
      color: enemyType.color,
      size: enemyType.size,
      pathIndex: 0,
      x: PATH[0].x,
      y: PATH[0].y,
      progress: 0,
      slowEffect: null,
      originalSpeed: calculatedSpeed,
      toxinDebuff: enemyType.id === 'TOXINA',
      isMutated: isMutated // Nova propriedade
    };
    
    enemiesRef.current.push(newEnemy);
  }, [wave, gameSettings, difficulty, energy]); // Dependências do useCallback

  // Função encapsulada com useCallback
  const savePhaseResult = useCallback(async (victoryData) => {
    if (!user) {
      console.error('❌ Usuário não autenticado ao salvar pontuação');
      setSaveError('Usuário não autenticado');
      return;
    }
    
    try {
      console.log('💾 Salvando resultados da fase...', {
        userId: user.id,
        userEmail: user.email,
        phase: 1,
        difficulty,
        ...victoryData
      });

      const tableCheck = await checkScoresTable();
      console.log('📊 Verificação da tabela scores:', tableCheck);

      const saveData = {
        userId: user.id,
        userEmail: user.email,
        userName: user.user_metadata?.name || user.email?.split('@')[0],
        phase: 1,
        difficulty: difficulty || 'medium',
        score: victoryData.score,
        stars: victoryData.stars,
        enemiesKilled: victoryData.enemiesKilled,
        wavesCompleted: victoryData.wave,
        healthRemaining: victoryData.health,
        antigensCollected: victoryData.antigens,
        timeSpent: Math.floor((Date.now() - lastTimeRef.current) / 1000)
      };

      const result = await savePhase1Score(saveData);

      if (result.success) {
        console.log('✅ Resultados salvos com sucesso!', result.data);
        setShowSaveSuccess(true);
        setLastSavedScore(victoryData.score);
        setSaveError(null);
        
        setTimeout(() => {
          setShowSaveSuccess(false);
        }, 5000);
        
      } else {
        console.error('❌ Falha ao salvar resultados:', result.error);
        setSaveError(result.error || 'Erro desconhecido ao salvar');
        setShowSaveSuccess(false);
        
        try {
          const backupKey = 'virus-hunter-scores-backup';
          const existingBackup = JSON.parse(localStorage.getItem(backupKey) || '[]');
          
          const backupData = {
            ...saveData,
            backup_saved_at: new Date().toISOString(),
            error_message: result.error
          };
          
          existingBackup.push(backupData);
          localStorage.setItem(backupKey, JSON.stringify(existingBackup));
          
          console.log('📦 Pontuação salva localmente como backup');
          setSaveError('Pontuação salva localmente (backup)');
          
        } catch (backupError) {
          console.error('❌ Erro ao salvar backup:', backupError);
          setSaveError('Falha ao salvar pontuação e backup');
        }
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao salvar pontuação:', error);
      setSaveError(error.message || 'Erro inesperado');
      setShowSaveSuccess(false);
    }
  }, [user, difficulty]); // Dependências do useCallback

  // Encapsulado com useCallback
  const activateQuimiocinaAbility = useCallback((towerId) => {
    const tower = towersRef.current.find(t => t.id === towerId);
    if (!tower || TOWER_TYPES[tower.type].id !== 'QUIMIOCINA') return;
    
    const towerType = TOWER_TYPES.QUIMIOCINA;
    
    if (abilityCooldowns[towerId] && abilityCooldowns[towerId] > Date.now()) {
      return;
    }
    
    setActiveAbilities(prev => ({
      ...prev,
      [towerId]: {
        active: true,
        expiresAt: Date.now() + towerType.abilityDuration
      }
    }));
    
    setAbilityCooldowns(prev => ({
      ...prev,
      [towerId]: Date.now() + towerType.abilityCooldown
    }));
    
    setVisualEffects(prev => [...prev, {
      id: Date.now(),
      type: 'quimiocina_aura',
      x: tower.x,
      y: tower.y,
      radius: towerType.range,
      color: towerType.auraColor,
      duration: towerType.abilityDuration
    }]);
  }, [abilityCooldowns]); 

  // LOOP PRINCIPAL DO JOGO
  useEffect(() => {
    if (gameState !== 'playing') return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // 1. SPAWN INIMIGOS
      const enemiesPerWave = 8 + wave * 2;
      if (waveEnemiesSpawnedRef.current < enemiesPerWave) {
        enemySpawnTimerRef.current += deltaTime * gameSpeed;
        const spawnDelay = Math.max(1500, 3500 - wave * 200);
        if (enemySpawnTimerRef.current > spawnDelay) {
          spawnEnemy();
          waveEnemiesSpawnedRef.current++;
          enemySpawnTimerRef.current = 0;
        }
      }

      // 2. MOVER INIMIGOS
      enemiesRef.current = enemiesRef.current.map(enemy => {
          let updatedEnemy = { ...enemy };
          
          if (updatedEnemy.slowEffect) {
            if (updatedEnemy.slowEffect.expires > now) {
              updatedEnemy.speed = updatedEnemy.originalSpeed * TOWER_TYPES.MASTOCITO.slowAmount;
            } else {
              updatedEnemy.slowEffect = null;
              updatedEnemy.speed = updatedEnemy.originalSpeed;
            }
          }

          const currentPoint = PATH[updatedEnemy.pathIndex];
          const nextPoint = PATH[updatedEnemy.pathIndex + 1];
          
          if (!nextPoint) {
            const damage = updatedEnemy.type === 'BIOFILME' ? 20 : 10;
            setHealth(h => {
                const newH = Math.max(0, h - damage);
                if (newH <= 0) setGameState('gameOver');
                return newH;
            });
            return null; // Remove inimigo
          }

          const dx = nextPoint.x - currentPoint.x;
          const dy = nextPoint.y - currentPoint.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const moveDistance = updatedEnemy.speed * (deltaTime / 16) * gameSpeed;
          updatedEnemy.progress += moveDistance / distance;

          if (updatedEnemy.progress >= 1) {
            updatedEnemy.pathIndex++;
            updatedEnemy.progress = 0;
            updatedEnemy.x = nextPoint.x;
            updatedEnemy.y = nextPoint.y;
          } else {
            updatedEnemy.x = currentPoint.x + dx * updatedEnemy.progress;
            updatedEnemy.y = currentPoint.y + dy * updatedEnemy.progress;
          }
          return updatedEnemy;
      }).filter(Boolean);

      // 3. TORRES ATIRAM
      towersRef.current = towersRef.current.map(tower => {
          const towerType = TOWER_TYPES[tower.type];
          if (!towerType || towerType.fireRate === 0) return tower;

          const timeSinceLastShot = now - (tower.lastShot || 0);
          const effectiveFireRate = towerType.fireRate / gameSpeed;

          if (timeSinceLastShot < effectiveFireRate) return tower;

          const hasQuimiocinaBuff = Object.entries(activeAbilities).some(([sourceId, ability]) => {
            if (!ability.active || ability.expiresAt < now) return false;
            const sourceTower = towersRef.current.find(t => t.id === sourceId);
            if (!sourceTower || sourceTower.type !== 'QUIMIOCINA') return false;
            const dx = tower.x - sourceTower.x;
            const dy = tower.y - sourceTower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= TOWER_TYPES.QUIMIOCINA.range;
          });
          const damageMultiplier = hasQuimiocinaBuff ? TOWER_TYPES.QUIMIOCINA.damageBuff : 1;

          const enemiesInRange = enemiesRef.current.filter(enemy => {
            const dx = enemy.x - tower.x;
            const dy = enemy.y - tower.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= towerType.range;
          });

          if (enemiesInRange.length > 0) {
            const target = enemiesInRange[0];
            const finalDamage = towerType.damage * damageMultiplier;

            if (towerType.id === 'EOSINOFILO') {
                enemiesInRange.forEach(enemy => {
                    projectilesRef.current.push({
                        id: Date.now() + Math.random(),
                        x: tower.x, y: tower.y,
                        targetId: enemy.id,
                        damage: finalDamage * 0.7,
                        speed: 5,
                        color: towerType.projectileColor,
                        splashDamage: true
                    });
                    setVisualEffects(prev => [...prev, { 
                      id: Math.random(), 
                      type: 'explosion', 
                      x: enemy.x, 
                      y: enemy.y, 
                      color: '#ec4899', 
                      duration: 300 
                    }]);
                });
            } else if (towerType.id === 'MASTOCITO') {
                enemiesInRange.forEach(enemy => {
                  if (!enemy.slowEffect || enemy.slowEffect.expires < now) {
                    enemy.slowEffect = {
                      expires: now + TOWER_TYPES.MASTOCITO.slowDuration,
                      appliedAt: now
                    };
                  }
                  
                  projectilesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: tower.x, y: tower.y,
                    targetId: enemy.id,
                    damage: finalDamage,
                    speed: 5,
                    color: towerType.projectileColor,
                    isMastocito: true
                  });
                  
                  setVisualEffects(prev => [...prev, { 
                    id: Math.random(), 
                    type: 'slow', 
                    x: enemy.x, 
                    y: enemy.y, 
                    color: '#8b5cf6', 
                    duration: 500 
                  }]);
                });
            } else {
                projectilesRef.current.push({
                    id: Date.now() + Math.random(),
                    x: tower.x, y: tower.y,
                    targetId: target.id,
                    damage: finalDamage,
                    speed: 5,
                    color: towerType.projectileColor
                });
            }
            return { ...tower, lastShot: now };
          }
          return tower;
      });

      // 4. MOVER PROJÉTEIS
      projectilesRef.current = projectilesRef.current.map(proj => {
          const target = enemiesRef.current.find(e => e.id === proj.targetId);
          if (!target) return null; 

          const dx = target.x - proj.x;
          const dy = target.y - proj.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 10) {
              if (!proj.isMastocito) {
                target.health -= proj.damage;
              }

              if (target.health <= 0) {
                  const enemyTypeData = ENEMY_TYPES[target.type];
                  const reward = target.reward;
                  const atpReward = enemyTypeData?.atpReward || 15;

                  setEnergy(e => e + atpReward);
                  
                  // Atualizar pontuação e Refs
                  setScore(s => {
                    const newScore = s + reward * wave;
                    scoreRef.current = newScore;
                    return newScore;
                  });
                  
                  setAtpPopups(prev => [...prev, {
                      id: Math.random(), x: target.x, y: target.y, amount: atpReward, color: '#22c55e', duration: 1000
                  }]);

                  if (towersRef.current.some(t => t.type === 'DENDRITICA')) {
                      towersRef.current.filter(t => t.type === 'DENDRITICA').forEach(t => {
                          const dist = Math.sqrt(Math.pow(target.x - t.x, 2) + Math.pow(target.y - t.y, 2));
                          if (dist <= TOWER_TYPES.DENDRITICA.range) {
                              const extra = Math.floor(atpReward * TOWER_TYPES.DENDRITICA.antigenMultiplier);
                              setEnergy(e => e + extra);
                              
                              setCollectedAntigens(c => {
                                const newCount = c + 1;
                                antigensRef.current = newCount;
                                return newCount;
                              });
                              
                              setAtpPopups(prev => [...prev, { 
                                id: Math.random(), 
                                x: target.x, 
                                y: target.y - 20, 
                                amount: `+${extra} ATP`, 
                                color: '#3b82f6', 
                                duration: 1200 
                              }]);
                          }
                      });
                  }
              }
              return null; 
          }

          const speed = proj.speed * gameSpeed;
          proj.x += (dx / distance) * speed;
          proj.y += (dy / distance) * speed;
          return proj;
      }).filter(Boolean);

      enemiesRef.current = enemiesRef.current.filter(e => e.health > 0);
      setRenderTrigger(prev => prev + 1); 

      // 7. CHECAGEM DE VITÓRIA
      if (waveEnemiesSpawnedRef.current >= enemiesPerWave && enemiesRef.current.length === 0 && !waveCompletedRef.current) {
          waveCompletedRef.current = true;
          setTimeout(() => {
              if (wave >= gameSettings.wavesPerPhase) {
                  const currentScore = scoreRef.current;
                  const currentAntigens = antigensRef.current;
                  const currentHealth = healthRef.current;
                  
                  const finalScore = currentScore;
                  
                  let calculatedStars = 0;
                  if (currentHealth >= gameSettings.startingHealth * 0.8) calculatedStars++;
                  if (wave >= gameSettings.wavesPerPhase) calculatedStars++;
                  if (currentAntigens >= 10) calculatedStars++;
                  const stars = Math.min(calculatedStars, 3);
                  
                  const victoryData = {
                    score: finalScore,
                    stars: stars,
                    health: currentHealth,
                    antigens: currentAntigens,
                    enemiesKilled: wave * enemiesPerWave,
                    wave: wave
                  };
                  
                  savePhaseResult(victoryData).then(() => {
                    setGameState('victory');
                  }).catch(error => {
                    console.error('Erro ao salvar:', error);
                    setGameState('victory');
                  });
                  
              } else {
                  setWave(w => w + 1);
                  waveEnemiesSpawnedRef.current = 0;
                  waveCompletedRef.current = false;
                  setEnergy(e => e + 100 + wave * 20);
              }
          }, 2000);
      }

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [gameState, wave, difficulty, gameSpeed, activeAbilities, gameSettings, savePhaseResult, spawnEnemy]); // Deps atualizadas

  // Efeitos Visuais
  useEffect(() => {
      const interval = setInterval(() => {
          setVisualEffects(prev => prev.filter(e => {
              e.duration -= 50; 
              return e.duration > 0;
          }));
          setAtpPopups(prev => prev.filter(p => {
              p.duration -= 50;
              p.y -= 1;
              return p.duration > 0;
          }));
          
          const now = Date.now();
          setActiveAbilities(prev => {
             const next = {...prev};
             let changed = false;
             Object.keys(next).forEach(k => {
                 if (next[k].expiresAt < now) { next[k].active = false; changed = true; }
             });
             return changed ? next : prev;
          });

      }, 50);
      return () => clearInterval(interval);
  }, []);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (gameState !== 'playing') return;

    const clickedTower = towersRef.current.find(tower => {
      const dx = x - tower.x;
      const dy = y - tower.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 20 && tower.type === 'QUIMIOCINA';
    });

    if (clickedTower) {
      activateQuimiocinaAbility(clickedTower.id);
      setClickedTowerId(clickedTower.id);
      setTimeout(() => setClickedTowerId(null), 300);
      return;
    }

    if (selectedTower) {
      const gridX = Math.floor(x / CELL_SIZE);
      const gridY = Math.floor(y / CELL_SIZE);
      const towerType = TOWER_TYPES[selectedTower];

      const canPlace = !towersRef.current.some(t => 
        Math.abs(t.gridX - gridX) < 1 && 
        Math.abs(t.gridY - gridY) < 1
      ) && energy >= towerType.cost;

      if (canPlace) {
        const newTower = {
          id: Date.now(),
          type: selectedTower,
          x: gridX * CELL_SIZE + CELL_SIZE / 2,
          y: gridY * CELL_SIZE + CELL_SIZE / 2,
          gridX,
          gridY,
          lastShot: 0
        };
        towersRef.current.push(newTower);
        setEnergy(prev => prev - towerType.cost);
        setSelectedTower(null);
        setRenderTrigger(prev => prev + 1); 
      }
    }
  };

  const handleCanvasMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gridX = Math.floor(x / CELL_SIZE);
    const gridY = Math.floor(y / CELL_SIZE);
    setHoveredCell({ x: gridX, y: gridY });

    const hoveredTower = towersRef.current.find(tower => {
      const dx = x - tower.x;
      const dy = y - tower.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= 20;
    });

    const hoveredEnemy = enemiesRef.current.find(enemy => {
      const dx = x - enemy.x;
      const dy = y - enemy.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance <= enemy.size + 5;
    });

    if (hoveredTower) {
      setHoveredCanvasItem({ item: hoveredTower, type: 'tower' });
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else if (hoveredEnemy) {
      setHoveredCanvasItem({ item: hoveredEnemy, type: 'enemy' });
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredCanvasItem(null);
    }
  };

  const startGame = () => {
    console.log('🎮 Iniciando fase: Pele - Barreira Mecânica', { difficulty, user: user?.email });
    
    setGameState('playing');
    setEnergy(gameSettings.startingEnergy);
    setHealth(gameSettings.startingHealth);
    setWave(1);
    setScore(0);
    
    // Reset Refs e Syncs
    towersRef.current = [];
    enemiesRef.current = [];
    projectilesRef.current = [];
    scoreRef.current = 0;
    antigensRef.current = 0;
    healthRef.current = gameSettings.startingHealth;
    
    setCollectedAntigens(0);
    setWallBreaches(0);
    setActiveAbilities({});
    setAbilityCooldowns({});
    setVisualEffects([]);
    setAtpPopups([]);
    setLeftPanelItem(null);
    setRightPanelItem(null);
    waveEnemiesSpawnedRef.current = 0;
    waveCompletedRef.current = false;
    lastTimeRef.current = Date.now();
    setGameSpeed(1.0);
    
    setShowSaveSuccess(false);
    setSaveError(null);
    setLastSavedScore(null);
  };

  const togglePause = () => {
    setGameState(gameState === 'playing' ? 'paused' : 'playing');
  };

  const returnToDashboard = () => {
    navigate('/dashboard');
  };

  const calculateStars = () => {
    let stars = 0;
    if (health >= gameSettings.startingHealth * 0.8) stars++;
    if (wave >= gameSettings.wavesPerPhase) stars++;
    if (collectedAntigens >= 10) stars++;
    return Math.min(stars, 3);
  };

  // Renderização do canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Fundo
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#fde5d9');
    gradient.addColorStop(0.5, '#f5d5c8');
    gradient.addColorStop(1, '#edd5c7');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Textura
    for (let i = 0; i < 250; i++) {
      const x = Math.random() * CANVAS_WIDTH;
      const y = Math.random() * CANVAS_HEIGHT;
      const size = Math.random() * 2 + 1;
      ctx.fillStyle = 'rgba(180, 140, 120, 0.15)';
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ferida
    ctx.fillStyle = 'rgba(220, 100, 100, 0.3)';
    ctx.beginPath(); ctx.arc(50, 350, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(200, 80, 80, 0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(50, 350, 32, 0, Math.PI * 2); ctx.stroke();

    // Caminho
    ctx.strokeStyle = 'rgba(220, 130, 100, 0.4)';
    ctx.lineWidth = 40; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    PATH.forEach((point, i) => { 
      if (i === 0) ctx.moveTo(point.x, point.y); 
      else ctx.lineTo(point.x, point.y); 
    });
    ctx.stroke();

    // Grade do caminho
    ctx.strokeStyle = 'rgba(180, 100, 80, 0.2)';
    ctx.lineWidth = 1;
    PATH.forEach((point, i) => {
      if (i < PATH.length - 1) {
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(PATH[i + 1].x, PATH[i + 1].y);
        ctx.stroke();
      }
    });

    // Grid hover
    if (hoveredCell && selectedTower) {
      const towerType = TOWER_TYPES[selectedTower];
      const canPlace = !towersRef.current.some(t => Math.abs(t.gridX - hoveredCell.x) < 1 && Math.abs(t.gridY - hoveredCell.y) < 1) && energy >= towerType.cost;
      ctx.fillStyle = canPlace ? 'rgba(59, 130, 246, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(hoveredCell.x * CELL_SIZE, hoveredCell.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      if (towerType.range > 0) {
        ctx.strokeStyle = canPlace ? 'rgba(59, 130, 246, 0.3)' : 'rgba(239, 68, 68, 0.3)';
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(hoveredCell.x * CELL_SIZE + CELL_SIZE / 2, hoveredCell.y * CELL_SIZE + CELL_SIZE / 2, towerType.range, 0, Math.PI * 2); ctx.stroke();
      }
    }

    // Torres
    towersRef.current.forEach(tower => {
      const towerType = TOWER_TYPES[tower.type];
      const pulse = Math.sin(Date.now() / 300) * 2;
      const hasActiveAbility = activeAbilities[tower.id]?.active;
      
      if (hasActiveAbility && towerType.id === 'QUIMIOCINA') {
        ctx.fillStyle = 'rgba(251, 191, 36, 0.1)'; ctx.beginPath(); ctx.arc(tower.x, tower.y, towerType.range, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tower.x, tower.y, towerType.range, 0, Math.PI * 2); ctx.stroke();
      }

      ctx.fillStyle = towerType.color; ctx.shadowColor = towerType.color; ctx.shadowBlur = hasActiveAbility ? 20 : 15;
      ctx.beginPath(); ctx.arc(tower.x, tower.y, 15 + pulse, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;

      const isClicked = clickedTowerId === tower.id;
      ctx.strokeStyle = hasActiveAbility ? '#fbbf24' : isClicked ? '#ffffff' : 'white'; ctx.lineWidth = hasActiveAbility ? 3 : isClicked ? 3 : 2;
      ctx.beginPath(); ctx.arc(tower.x, tower.y, 15 + pulse, 0, Math.PI * 2); ctx.stroke();

      ctx.fillStyle = 'white'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(towerType.name.charAt(0), tower.x, tower.y);
      
      if (towerType.hasActiveAbility) {
        const cooldownEnd = abilityCooldowns[tower.id];
        if (cooldownEnd && cooldownEnd > Date.now()) {
          const cooldownPercent = (cooldownEnd - Date.now()) / towerType.abilityCooldown;
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'; ctx.beginPath(); ctx.moveTo(tower.x, tower.y);
          ctx.arc(tower.x, tower.y, 20, -Math.PI/2, -Math.PI/2 + (Math.PI * 2 * cooldownPercent), true); ctx.closePath(); ctx.fill();
        }
      }
    });

    // Inimigos
    enemiesRef.current.forEach(enemy => {
      // EFEITO VISUAL DE MUTAÇÃO (AURA ROXA)
      if (enemy.isMutated) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#8b5cf6'; // Roxo neon
          ctx.strokeStyle = '#8b5cf6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.size + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.shadowBlur = 0; // Reset
      }

      if (enemy.slowEffect && enemy.slowEffect.expires > Date.now()) {
        ctx.strokeStyle = 'rgba(139, 92, 246, 0.6)'; 
        ctx.lineWidth = 3; 
        ctx.beginPath(); 
        ctx.arc(enemy.x, enemy.y, enemy.size + 10, 0, Math.PI * 2); 
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(139, 92, 246, 0.8)';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', enemy.x, enemy.y + enemy.size + 15);
      }
      
      if (enemy.toxinDebuff) {
        ctx.strokeStyle = 'rgba(249, 115, 22, 0.4)'; ctx.lineWidth = 2; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.size + 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      
      ctx.fillStyle = enemy.color; ctx.shadowColor = enemy.color; ctx.shadowBlur = 10;
      if (enemy.type === 'BIOFILME') {
        for (let i = 0; i < 3; i++) { 
          const offsetX = Math.cos(i * 1.2) * 8; 
          const offsetY = Math.sin(i * 1.2) * 8; 
          ctx.beginPath(); 
          ctx.arc(enemy.x + offsetX, enemy.y + offsetY, enemy.size * 0.7, 0, Math.PI * 2); 
          ctx.fill(); 
        }
      } else {
        ctx.beginPath(); ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2); ctx.fill();
      }
      ctx.shadowBlur = 0;
      
      // Barra de vida
      const healthPercent = enemy.health / enemy.maxHealth;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; 
      ctx.fillRect(enemy.x - 20, enemy.y - enemy.size - 10, 40, 6);
      ctx.fillStyle = healthPercent > 0.5 ? '#22c55e' : healthPercent > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(enemy.x - 20, enemy.y - enemy.size - 10, 40 * healthPercent, 6);
    });

    // Projéteis
    projectilesRef.current.forEach(proj => {
      ctx.fillStyle = proj.color; 
      ctx.shadowColor = proj.color; 
      ctx.shadowBlur = proj.splashDamage ? 10 : 8;
      ctx.beginPath();
      if (proj.splashDamage) { 
        ctx.arc(proj.x, proj.y, 6, 0, Math.PI * 2); 
      } else if (proj.isMastocito) {
        ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#a78bfa';
        ctx.fillRect(proj.x - 2, proj.y - 8, 4, 4);
      } else { 
        ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2); 
      }
      ctx.fill(); 
      ctx.shadowBlur = 0;
    });

    // Efeitos visuais e Popups
    visualEffects.forEach(effect => {
      ctx.save();
      switch (effect.type) {
        case 'slow': ctx.fillStyle = effect.color + '40'; ctx.beginPath(); ctx.arc(effect.x, effect.y, 15, 0, Math.PI * 2); ctx.fill(); break;
        case 'buff': ctx.strokeStyle = effect.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(effect.x, effect.y, 20, 0, Math.PI * 2); ctx.stroke(); break;
        case 'explosion': ctx.fillStyle = effect.color + '60'; ctx.beginPath(); ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2); ctx.fill(); break;
        case 'trail': ctx.fillStyle = effect.color + '80'; ctx.beginPath(); ctx.arc(effect.x, effect.y, 2, 0, Math.PI * 2); ctx.fill(); break;
        case 'quimiocina_aura': break;
        default: break; // Case default adicionado
      }
      ctx.restore();
    });

    atpPopups.forEach(popup => {
      ctx.fillStyle = popup.color || '#22c55e'; 
      ctx.font = 'bold 14px Arial'; 
      ctx.textAlign = 'center'; 
      ctx.textBaseline = 'middle'; 
      ctx.fillText(`+${popup.amount} ATP`, popup.x, popup.y);
    });

  }, [renderTrigger, hoveredCell, selectedTower, energy, wallBreaches, visualEffects, atpPopups, activeAbilities, abilityCooldowns, clickedTowerId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 p-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Mensagens de salvamento */}
        <AnimatePresence>
          {showSaveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-emerald-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg border border-emerald-400 shadow-lg flex items-center gap-3">
                <Trophy className="w-5 h-5" />
                <div>
                  <div className="font-bold">Pontuação salva com sucesso!</div>
                  <div className="text-sm opacity-90">{lastSavedScore} pontos registrados</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {saveError && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50"
            >
              <div className="bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-lg border border-red-400 shadow-lg flex items-center gap-3">
                <AlertTriangle className="w-5 h-5" />
                <div className="text-sm">{saveError}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Menu Inicial */}
        <AnimatePresence>
          {gameState === 'menu' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-2xl w-full border border-emerald-500/30">
                <div className="text-center mb-8">
                  <div className="inline-block p-4 bg-amber-500/20 rounded-2xl mb-4">
                    <Layers className="w-16 h-16 text-amber-400" />
                  </div>
                  <h1 className="text-4xl font-bold text-white mb-2">Fase 1: Pele - Barreira Mecânica</h1>
                  <p className="text-emerald-300 mb-4">
                    Dificuldade: <span className="font-bold">{difficulty.toUpperCase()}</span>
                    {user && <span className="ml-4">Jogador: {user.email?.split('@')[0]}</span>}
                  </p>
                  <p className="text-gray-300">Defenda a pele rompida contra invasores oportunistas</p>
                </div>
                
                <div className="bg-slate-800/50 rounded-xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-white mb-3">Objetivos da Fase</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center text-emerald-300">
                      <Shield className="w-4 h-4 mr-2" /> 
                      Complete {gameSettings.wavesPerPhase} ondas de invasores
                    </li>
                    <li className="flex items-center text-blue-300">
                      <Sparkles className="w-4 h-4 mr-2" /> 
                      Colete antígenos com Células Dendríticas
                    </li>
                    <li className="flex items-center text-green-300">
                      <Activity className="w-4 h-4 mr-2" /> 
                      Use Quimiocinas para buffar suas defesas
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={startGame}
                    className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    <Play className="w-5 h-5 inline mr-2" />
                    Iniciar Fase
                  </button>
                  <button 
                    onClick={returnToDashboard}
                    className="px-6 py-4 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                </div>

                {process.env.NODE_ENV === 'development' && user && (
                  <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 text-xs">
                    <div className="text-emerald-300 mb-1">Informações de Debug:</div>
                    <div className="grid grid-cols-2 gap-2 text-slate-400">
                      <div>ID: {user.id?.substring(0, 8)}...</div>
                      <div>Email: {user.email}</div>
                      <div>Dificuldade: {difficulty}</div>
                      <div>Energia inicial: {gameSettings.startingEnergy}</div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Over */}
        <AnimatePresence>
          {gameState === 'gameOver' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-red-500/30">
                <div className="text-center mb-8">
                  <AlertTriangle className="w-20 h-20 text-red-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Infecção Grave!</h2>
                  <p className="text-red-300">
                    A pele foi comprometida e a infecção se espalhou
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-gray-300">Pontuação:</span>
                    <span className="text-2xl font-bold text-emerald-400">{score}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-gray-300">Onda alcançada:</span>
                    <span className="text-xl font-bold text-yellow-400">{wave}/{gameSettings.wavesPerPhase}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={startGame}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    <RotateCcw className="w-5 h-5 inline mr-2" />
                    Tentar Novamente
                  </button>
                  <button
                    onClick={returnToDashboard}
                    className="flex-1 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Home className="w-5 h-5 inline mr-2" />
                    Dashboard
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vitória */}
        <AnimatePresence>
          {gameState === 'victory' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-emerald-500/30">
                <div className="text-center mb-8">
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold text-white mb-2">Barreira Restaurada!</h2>
                  <p className="text-emerald-300">
                    A pele foi protegida com sucesso
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-gray-300">Pontuação Final:</span>
                    <span className="text-2xl font-bold text-emerald-400">
                      {score}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-gray-300">Estrelas:</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= calculateStars() 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                    <span className="text-gray-300">Saúde restante:</span>
                    <span className="text-xl font-bold text-green-400">{health}%</span>
                  </div>
                  
                  {/* Informações de salvamento */}
                  {showSaveSuccess && (
                    <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-300">
                        <Trophy className="w-4 h-4" />
                        <span className="text-sm font-bold">Pontuação salva com sucesso!</span>
                      </div>
                      <div className="text-xs text-emerald-400/80 mt-1">
                        Sua pontuação foi registrada no seu perfil.
                      </div>
                    </div>
                  )}
                  
                  {saveError && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2 text-red-300">
                        <AlertTriangle className="w-4 h-4" />
                        <span className="text-sm font-bold">Aviso:</span>
                      </div>
                      <div className="text-xs text-red-400/80 mt-1">
                        {saveError}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={startGame}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold rounded-xl hover:scale-105 transition-all"
                  >
                    <RotateCcw className="w-5 h-5 inline mr-2" />
                    Jogar Novamente
                  </button>
                  <button
                    onClick={returnToDashboard}
                    className="flex-1 py-3 bg-slate-700/50 border border-slate-600/50 text-white rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    <Home className="w-5 h-5 inline mr-2" />
                    Continuar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {(gameState === 'playing' || gameState === 'paused') && (
          <div className="flex flex-col gap-4">
            <div className="bg-slate-900/50 rounded-xl p-3 border border-emerald-800/30 max-w-7xl mx-auto w-full">
              <div className="flex flex-wrap justify-between items-center gap-4">
                <div className="flex flex-wrap gap-4">
                  <div className="text-center">
                    <div className="text-xs text-emerald-300">Saúde</div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      <div className="text-xl font-bold text-white">{health}%</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-emerald-300">Energia</div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      <div className="text-xl font-bold text-white">{energy}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-emerald-300">Onda</div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-purple-400" />
                      <div className="text-xl font-bold text-white">{wave}/{gameSettings.wavesPerPhase}</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-emerald-300">Pontos</div>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <div className="text-xl font-bold text-white">{score}</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setAudioEnabled(!audioEnabled)} 
                    className="p-2 rounded-lg border bg-slate-700/50 border-slate-500/30 text-slate-300"
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => setGameSpeed(prev => prev === 1 ? 1.5 : 1)} 
                    className="p-2 rounded-lg border bg-slate-700/50 border-slate-500/30 text-slate-300"
                  >
                    <div className="flex items-center gap-1">
                      <FastForward className="w-4 h-4" />
                      <span className="text-xs font-bold">{gameSpeed}x</span>
                    </div>
                  </button>
                  <button 
                    onClick={togglePause} 
                    className="p-2 bg-slate-700/50 border border-slate-600/50 text-white rounded-lg"
                  >
                    {gameState === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={returnToDashboard} 
                    className="p-2 bg-red-600/20 border border-red-500/30 text-white rounded-lg"
                  >
                    <Home className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-center items-start gap-4">
              <div className="hidden xl:block w-80 h-[700px] shrink-0">
                 {leftPanelItem ? (
                   <SideInfoPanel item={leftPanelItem} title="Defesa Selecionada" />
                 ) : (
                   <div className="h-full w-full rounded-2xl border border-slate-700/30 bg-slate-900/20 flex items-center justify-center text-slate-600 text-center p-6">
                     <p>Selecione uma Célula de Defesa abaixo para ver os detalhes</p>
                   </div>
                 )}
              </div>
              <div className="relative bg-gradient-to-br from-slate-900/80 to-slate-800/80 rounded-xl p-2 border border-emerald-500/30 shadow-xl shrink-0">
                <canvas 
                  ref={canvasRef} 
                  width={CANVAS_WIDTH} 
                  height={CANVAS_HEIGHT} 
                  onClick={handleCanvasClick} 
                  onMouseMove={handleCanvasMove} 
                  onMouseLeave={() => { 
                    setHoveredCell(null); 
                    setHoveredCanvasItem(null); 
                  }} 
                  className="rounded-lg cursor-crosshair w-full h-auto" 
                  style={{ imageRendering: 'crisp-edges' }}
                />
                {gameState === 'paused' && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-lg">
                    <div className="text-center">
                      <Pause className="w-16 h-16 text-white mx-auto mb-3 opacity-50" />
                      <div className="text-2xl font-bold text-white">JOGO PAUSADO</div>
                    </div>
                  </div>
                )}
              </div>
              <div className="hidden xl:block w-80 h-[700px] shrink-0">
                 {rightPanelItem ? (
                   <SideInfoPanel item={rightPanelItem} title="Invasor Identificado" />
                 ) : (
                   <div className="h-full w-full rounded-2xl border border-slate-700/30 bg-slate-900/20 flex items-center justify-center text-slate-600 text-center p-6">
                     <p>Clique em um Invasor abaixo para ver os detalhes</p>
                   </div>
                 )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto w-full">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-emerald-500/30">
                <h3 className="text-lg font-bold text-white mb-3">Células de Defesa</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {Object.values(TOWER_TYPES).map(tower => {
                    const Icon = tower.icon;
                    const canAfford = energy >= tower.cost;
                    const isSelected = selectedTower === tower.id;
                    return (
                      <div 
                        key={tower.id} 
                        className={`p-2 rounded-lg border cursor-pointer transition-all flex flex-col items-center text-center ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-500/20' : 'bg-slate-800/50'
                        } ${!canAfford ? 'opacity-50' : ''}`} 
                        onClick={() => { 
                          if (canAfford) { 
                            setSelectedTower(isSelected ? null : tower.id); 
                            setLeftPanelItem(isSelected ? null : { ...tower, type: tower.id }); 
                          } 
                        }}
                      >
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center mb-1" 
                          style={{ backgroundColor: tower.color + '20' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: tower.color }} />
                        </div>
                        <div className="text-xs font-semibold text-white leading-tight">{tower.name}</div>
                        <div className="text-xs text-emerald-300 mt-1">{tower.cost} ATP</div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 flex gap-2">
                  {Object.values(activeAbilities).some(a => a.active) && (
                    <div className="px-2 py-1 bg-emerald-500/10 rounded flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-emerald-300">Buff Ativo</span>
                    </div>
                  )}
                  {towersRef.current.some(t => t.type === 'DENDRITICA') && (
                    <div className="px-2 py-1 bg-blue-500/10 rounded flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-blue-300">Coletando</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-red-500/30">
                <h3 className="text-sm font-bold text-white mb-2">Invasores - ATP e Informações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {Object.values(ENEMY_TYPES).map(enemy => {
                    // CÁLCULO DE ESTATÍSTICAS PARA EXIBIÇÃO NO PAINEL DIREITO
                    let displayHealth = Math.floor(enemy.health * gameSettings.enemyMultiplier);
                    let displaySpeed = enemy.speed * gameSettings.enemySpeedMultiplier;

                    // Adição direta para Médio e Difícil (Baseado na lógica de Spawn)
                    if (difficulty === 'medium') {
                      displayHealth = enemy.health + 20;
                      displaySpeed = enemy.speed + 0.5;
                    } else if (difficulty === 'hard') {
                      displayHealth = enemy.health + 50; // Médio(+20) + 30
                      displaySpeed = enemy.speed + 1.0; // Médio(+0.5) + 0.5
                    }

                    const enemyWithStats = { 
                      ...enemy, 
                      type: enemy.id,
                      health: displayHealth,
                      speed: displaySpeed
                    };

                    return (
                      <div 
                        key={enemy.id} 
                        className="flex gap-2 p-2 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors cursor-pointer border border-transparent hover:border-red-500/30" 
                        onClick={() => { 
                          setRightPanelItem(prev => (prev?.id === enemy.id ? null : enemyWithStats)); 
                        }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex-shrink-0 mt-1" 
                          style={{ backgroundColor: enemy.color }} 
                        />
                        <div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{enemy.name}</span>
                            <span className="text-xs text-emerald-300">{enemy.atpReward} ATP</span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Clique para ver detalhes</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {hoveredCanvasItem && (
          <div style={{ 
            position: 'fixed', 
            left: tooltipPosition.x, 
            top: tooltipPosition.y, 
            zIndex: 9999, 
            pointerEvents: 'none', 
            transform: 'translate(15px, 15px)' 
          }}>
            <Phase1Tooltip item={hoveredCanvasItem.item} type={hoveredCanvasItem.type} position={{ x: 0, y: 0 }} />
          </div>
        )}
      </div>
    </div>
  );
}