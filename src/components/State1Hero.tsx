import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Shield } from 'lucide-react';
import { AppScrollState } from '../types';

interface State1HeroProps {
  onNext: () => void;
  onJumpToState?: (state: AppScrollState) => void;
  championData?: { teamName: string; seasonTitle: string } | null;
  onOpenCelebration?: () => void;
}

export const State1Hero: React.FC<State1HeroProps> = ({ onNext, onJumpToState, championData, onOpenCelebration }) => {
  return (
    <div className="min-h-[100dvh] w-full flex flex-col justify-between px-4 sm:px-8 md:px-12 pt-14 pb-8 sm:pt-8 relative z-10 select-none max-w-7xl mx-auto">
      {/* Top Header Navigation Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full flex items-center justify-between pt-1 pb-3 border-b border-[#B7CEEC]/15 pr-14"
      >
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#080d14] border border-[#B7CEEC]/30 text-[#B7CEEC] shadow-md">
            <Shield className="w-5 h-5 text-[#4C787E]" />
          </div>
          <div>
            <span className="f1-header text-xs sm:text-sm tracking-[0.2em] text-white font-black block leading-tight">
              SUNDAY LEAGUE
            </span>
            <span className="text-[10px] font-mono text-teal-300 font-bold tracking-widest block mt-0.5">
              Est: 2026
            </span>
          </div>
        </div>

        {/* Clean Header Bar */}
      </motion.div>

      {/* Hero Main Body Content */}
      <div className="w-full flex-1 flex flex-col justify-center items-start text-left space-y-4 py-8 relative">
        
        {/* Flashing Champion Banner Overlay */}
        {championData && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', bounce: 0.5, duration: 0.8 }}
            className="absolute top-0 left-0 w-full z-50 mb-6 cursor-pointer"
            onClick={onOpenCelebration}
          >
            <motion.div 
              animate={{ boxShadow: ['0 0 15px rgba(251,191,36,0.3)', '0 0 40px rgba(251,191,36,0.7)', '0 0 15px rgba(251,191,36,0.3)'] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="px-4 py-3 sm:px-6 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500/25 via-yellow-400/35 to-amber-500/25 border-2 border-amber-400/60 backdrop-blur-md shadow-2xl flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl sm:text-3xl animate-bounce">🏆</span>
                <div>
                  <span className="text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase text-amber-300 drop-shadow-md block">
                    {championData.seasonTitle} CHAMPIONS
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tighter drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
                    {championData.teamName}
                  </h2>
                </div>
              </div>

              {onOpenCelebration && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCelebration();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow-lg hover:brightness-110 transition-all shrink-0"
                >
                  ✨ View 3D Poster
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
        {/* Season & Matchday Badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B7CEEC]/30 bg-[#05080c]/80 backdrop-blur-xl shadow-xl shadow-[#4C787E]/10"
        >
          <span className="w-2 h-2 rounded-full bg-[#4C787E] animate-pulse" />
          <span className="text-xs font-mono tracking-widest text-[#B7CEEC] font-semibold uppercase">
            SEASON 1
          </span>
        </motion.div>

        {/* Giant Stacked Display Headline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2 }}
          className="space-y-0 text-left w-full"
        >
          <h1 className="f1-header font-black tracking-tighter uppercase leading-[0.88] w-full">
            <span className="block text-[#B7CEEC] drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-[clamp(2.25rem,8.5vw,6.5rem)]">
              SMALL
            </span>
            <span className="block text-[#4C787E] drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-[clamp(2.25rem,8.5vw,6.5rem)]">
              TEAMS.
            </span>
            <span className="block text-[#B7CEEC] drop-shadow-[0_10px_25px_rgba(0,0,0,0.8)] text-[clamp(2rem,7.5vw,5.75rem)] tracking-tight">
              BIG GLORY.
            </span>
          </h1>
        </motion.div>

        {/* Subtitle Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-sm sm:text-base md:text-lg text-[#B7CEEC]/85 font-medium leading-relaxed max-w-xl text-left tracking-wide"
        >
          Three squads. Multiple matchdays. Every point counts. Track the complete season — live standings, fixtures and player performance.
        </motion.p>
      </div>

      {/* Scroll Down Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="w-full cursor-pointer group flex flex-col items-center gap-2 mt-auto"
        onClick={onNext}
      >
        <p className="text-[10px] f1-header text-[#B7CEEC] group-hover:text-white transition-colors tracking-[0.22em]">
          SCROLL TO OFFICIAL LEADERBOARDS
        </p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-2.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/80 text-[#B7CEEC] backdrop-blur-md group-hover:border-[#4C787E] group-hover:text-[#4C787E] transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
};

