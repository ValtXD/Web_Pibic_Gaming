import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Star, Medal, Target, Droplets, Wind, Heart, Brain, Bone } from 'lucide-react';
import { scoresService } from '../services/scores';

// Componentes UI simples (sem @/ importações)
const Button = ({ children, className, ...props }) => (
  <button 
    className={`px-4 py-2 rounded-lg font-medium transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

const Tabs = ({ defaultValue, onValueChange, children }) => {
  const [value, setValue] = useState(defaultValue);

  const handleChange = (newValue) => {
    setValue(newValue);
    onValueChange(newValue);
  };

  return (
    <div className="tabs">
      {React.Children.map(children, child => 
        React.cloneElement(child, { 
          value, 
          onValueChange: handleChange 
        })
      )}
    </div>
  );
};

const TabsList = ({ children, className }) => (
  <div className={`flex bg-slate-800 rounded-lg p-1 ${className}`}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, className, ...props }) => (
  <button
    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${className}`}
    onClick={() => props.onValueChange?.(value)}
    data-state={props.value === value ? 'active' : 'inactive'}
    {...props}
  >
    {children}
  </button>
);

const levelIcons = {
  1: Droplets,
  2: Wind,
  3: Heart,
  4: Brain,
  5: Bone,
};

const levelNames = {
  1: 'Corrente Sanguínea',
  2: 'Pulmões',
  3: 'Coração',
  4: 'Cérebro',
  5: 'Medula Óssea',
};

const difficultyLabels = {
  easy: { name: 'Fácil', color: 'text-green-400' },
  medium: { name: 'Médio', color: 'text-yellow-400' },
  hard: { name: 'Difícil', color: 'text-red-400' },
};

export default function ScoresModal({ isOpen, onClose }) {
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalScore: 0, totalStars: 0, completedLevels: 0 });

  // Carregar pontuações quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      loadScores();
    }
  }, [isOpen]);

  const loadScores = async () => {
    setLoading(true);
    try {
      const userScores = await scoresService.getUserScores();
      setScores(userScores);
      
      const totalScore = userScores.reduce((sum, s) => sum + (s.score || 0), 0);
      const totalStars = userScores.reduce((sum, s) => sum + (s.stars || 0), 0);
      const completedLevels = userScores.filter(s => s.completed).length;
      
      setStats({ totalScore, totalStars, completedLevels });
    } catch (error) {
      console.error('Erro ao carregar pontuações:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredScores = selectedDifficulty === 'all' 
    ? scores 
    : scores.filter(s => s.difficulty === selectedDifficulty);

  const sortedScores = [...filteredScores].sort((a, b) => b.score - a.score);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 max-w-lg w-full border border-emerald-500/30 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              Minhas Pontuações
            </h2>
            <Button
              onClick={onClose}
              className="text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded-full p-2"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mb-4"></div>
              <p className="text-emerald-300">Carregando pontuações...</p>
            </div>
          )}

          {!loading && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
                  <Target className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.totalScore}</div>
                  <div className="text-xs text-emerald-300/70">Pontos Totais</div>
                </div>
                <div className="bg-amber-500/10 rounded-xl p-4 text-center border border-amber-500/20">
                  <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.totalStars}</div>
                  <div className="text-xs text-amber-300/70">Estrelas</div>
                </div>
                <div className="bg-purple-500/10 rounded-xl p-4 text-center border border-purple-500/20">
                  <Medal className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stats.completedLevels}</div>
                  <div className="text-xs text-purple-300/70">Fases Completas</div>
                </div>
              </div>

              <Tabs defaultValue="all" onValueChange={setSelectedDifficulty} className="mb-4">
                <TabsList className="w-full">
                  <TabsTrigger 
                    value="all" 
                    className="flex-1 data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                  >
                    Todos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="easy" 
                    className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white"
                  >
                    Fácil
                  </TabsTrigger>
                  <TabsTrigger 
                    value="medium" 
                    className="flex-1 data-[state=active]:bg-yellow-600 data-[state=active]:text-white"
                  >
                    Médio
                  </TabsTrigger>
                  <TabsTrigger 
                    value="hard" 
                    className="flex-1 data-[state=active]:bg-red-600 data-[state=active]:text-white"
                  >
                    Difícil
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {sortedScores.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhuma pontuação registrada</p>
                    <p className="text-sm text-slate-500 mt-1">Jogue para registrar suas conquistas!</p>
                    <Button
                      onClick={onClose}
                      className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg"
                    >
                      Começar a Jogar
                    </Button>
                  </div>
                ) : (
                  sortedScores.map((score, index) => {
                    const Icon = levelIcons[score.level_id] || Target;
                    const diff = difficultyLabels[score.difficulty];
                    
                    return (
                      <motion.div
                        key={score.id || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex items-center gap-4 p-4 rounded-xl border ${
                          index === 0 ? 'bg-amber-500/10 border-amber-500/30' :
                          index === 1 ? 'bg-slate-400/10 border-slate-400/30' :
                          index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                          'bg-slate-800/50 border-slate-700/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-amber-500 text-amber-950' :
                          index === 1 ? 'bg-slate-400 text-slate-900' :
                          index === 2 ? 'bg-orange-500 text-orange-950' :
                          'bg-slate-700 text-slate-300'
                        }`}>
                          {index + 1}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-emerald-400" />
                            <span className="text-white font-medium">
                              {levelNames[score.level_id] || `Fase ${score.level_id}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-xs ${diff?.color || 'text-slate-400'}`}>
                              {diff?.name || score.difficulty}
                            </span>
                            <span className="text-slate-500">•</span>
                            <span className="text-xs text-slate-400">
                              {score.enemies_killed || 0} eliminados
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= (score.stars || 0) ? 'text-amber-400 fill-amber-400' : 'text-slate-600'
                              }`}
                            />
                          ))}
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-bold text-emerald-400">{score.score}</div>
                          <div className="text-xs text-slate-500">pts</div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </>
          )}

          <Button
            onClick={onClose}
            className="w-full mt-4 py-5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl"
          >
            Fechar
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}