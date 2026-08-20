import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Shield } from 'lucide-react';
import { AppScrollState } from '../types';

interface State1HeroProps {
  onNext: () => void;
  onJumpToState?: (state: AppScrollState) => void;
}

export const State1Hero: React.FC<State1HeroProps> = ({ onNext, onJumpToState }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 sm:px-8 md:px-12 py-4 sm:py-6 relative z-10 select-none max-w-7xl mx-auto">
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
      <div className="w-full my-1 flex flex-col items-start text-left space-y-4 pt-2 pb-2">
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
        className="cursor-pointer group flex flex-col items-center gap-2 mb-2"
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

