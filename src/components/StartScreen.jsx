import React from 'react';
import { motion } from 'framer-motion';
import { Play, Settings, Info, Trophy, Crosshair, Target } from 'lucide-react';

// Componente Button simples (sem dependências externas)
const Button = ({ children, className, variant = 'default', onClick, ...props }) => {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center';
  
  const variants = {
    default: 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border border-emerald-400/30',
    outline: 'border-2 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20 hover:border-emerald-400 bg-transparent',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default function StartScreen({ onStart, onSettings, onCredits, onScores }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Animated background - virus particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 60 + 20,
              height: Math.random() * 60 + 20,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: `radial-gradient(circle, ${
                ['rgba(34, 197, 94, 0.15)', 'rgba(234, 179, 8, 0.1)', 'rgba(239, 68, 68, 0.1)', 'rgba(168, 85, 247, 0.1)'][Math.floor(Math.random() * 4)]
              } 0%, transparent 70%)`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
              scale: [1, 1.3, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              repeatType: "reverse",
            }}
          />
        ))}
      </div>

      {/* Crosshair decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`crosshair-${i}`}
            className="absolute text-emerald-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Crosshair size={Math.random() * 40 + 30} />
          </motion.div>
        ))}
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-6"
        >
          <div className="relative inline-block">
            <Target className="w-24 h-24 text-emerald-400 mx-auto" strokeWidth={1.5} />
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-28 h-28 border-2 border-dashed border-emerald-500/30 rounded-full" />
            </motion.div>
          </div>
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-green-400 to-emerald-300 mb-2 tracking-wider">
          VIRUS HUNTER
        </h1>
        <p className="text-emerald-200/60 text-lg md:text-xl mb-12 font-light tracking-widest uppercase">
          Proteja o corpo humano
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex flex-col gap-4 z-10 w-full max-w-sm px-4"
      >
        <Button
          onClick={onStart}
          className="group relative px-12 py-6 text-xl font-semibold rounded-2xl shadow-2xl shadow-emerald-500/30 hover:scale-105"
        >
          <Play className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
          JOGAR
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/20"
            animate={{ opacity: [0, 0.3, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </Button>

        <Button
          onClick={onScores}
          className="py-5 bg-gradient-to-r from-amber-600/80 to-yellow-600/80 hover:from-amber-500 hover:to-yellow-500"
        >
          <Trophy className="w-5 h-5 mr-2" />
          Pontuações
        </Button>

        <div className="flex gap-3">
          <Button
            onClick={onSettings}
            variant="outline"
            className="flex-1 py-5"
          >
            <Settings className="w-5 h-5 mr-2" />
            Config
          </Button>
          <Button
            onClick={onCredits}
            variant="outline"
            className="flex-1 py-5"
          >
            <Info className="w-5 h-5 mr-2" />
            Créditos
          </Button>
        </div>
      </motion.div>

      {/* Bottom decoration */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </div>
  );
}