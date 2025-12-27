import React from 'react';
import { motion } from 'framer-motion';
import { X, Volume2, VolumeX, Zap, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, settings, onSettingsChange }) {
  if (!isOpen) return null;

  const handleVolumeChange = (e) => {
    const value = parseInt(e.target.value);
    onSettingsChange({ ...settings, volume: value });
  };

  const handleSoundToggle = () => {
    onSettingsChange({ ...settings, soundEnabled: !settings.soundEnabled });
  };

  const handleGameSpeedChange = (speed) => {
    onSettingsChange({ ...settings, gameSpeed: speed });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-emerald-500/30 shadow-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold text-white">Configurações</h2>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white hover:bg-emerald-500/20 p-2 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-8">
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-300" />
              ) : (
                <VolumeX className="w-5 h-5 text-emerald-300/50" />
              )}
              <span className="text-white font-medium">Som</span>
            </div>
            <button
              onClick={handleSoundToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
          </div>

          {/* Volume Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Volume</span>
              <span className="text-emerald-300 text-sm">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={handleVolumeChange}
              disabled={!settings.soundEnabled}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>


          {/* Outras opções */}
          <div className="space-y-4 pt-4 border-t border-emerald-500/20">
            <div className="flex items-center justify-between">
              <span className="text-white">Efeitos Sonoros</span>
              <button className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full">
                Ativo
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white">Vibração</span>
              <button className="text-xs bg-slate-700/50 text-slate-300 px-3 py-1 rounded-full">
                Inativo
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          Salvar e Fechar
        </button>

        <p className="text-center text-emerald-200/40 text-xs mt-4">
          Configurações salvas automaticamente
        </p>
      </motion.div>
    </motion.div>
  );
}