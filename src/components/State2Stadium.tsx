import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Compass, Sun, Users, Flame, Volume2, MapPin } from 'lucide-react';
import { WeatherWidget } from './WeatherWidget';
import { TiltCard } from './TiltCard';

interface State2StadiumProps {
  onNext: () => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
}

export const State2Stadium: React.FC<State2StadiumProps> = ({ onNext, isSoundEnabled, onToggleSound }) => {
  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-6 py-12 relative z-10 select-none">
      {/* Top Banner Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#4C787E]/50 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <Compass className="w-4 h-4 text-[#4C787E] animate-spin" style={{ animationDuration: '10s' }} />
        <span className="f1-header text-[11px] tracking-[0.2em]">OFFICIAL MATCH VENUE</span>
      </motion.div>

      {/* Center Stadium Card Overlay */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-sm p-6 rounded-3xl border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl my-auto text-center relative overflow-hidden space-y-4"
      >
        {/* Ambient Glow Corner */}
        <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#4C787E]/25 blur-3xl pointer-events-none" />

        <div className="inline-flex p-3 rounded-2xl bg-[#080d14] border border-[#4C787E]/40 text-[#B7CEEC] shadow-inner">
          <Flame className="w-6 h-6 text-[#4C787E]" />
        </div>

        <div>
          <h2 className="text-[clamp(1.25rem,5vw,1.75rem)] font-black f1-header tracking-[0.2em] uppercase text-white">
            De Anza STADIUM
          </h2>
          <p className="text-[clamp(0.7rem,2.5vw,0.8rem)] text-[#B7CEEC]/80 mt-1 font-medium tracking-wide flex items-center justify-center gap-1">
          Home of Sunday League
          </p>
        </div>

        {/* Real-time Weather Widget for El Sobrante, CA */}
        <TiltCard maxTilt={8} scale={1.02} glowColor="rgba(76, 120, 126, 0.3)" className="w-full rounded-2xl">
          <WeatherWidget className="w-full" />
        </TiltCard>

        {/* Stadium Specs Grid */}
        <div className="grid grid-cols-2 gap-3 text-left text-xs">
          <TiltCard maxTilt={8} scale={1.03} glowColor="rgba(183, 206, 236, 0.2)" className="p-3.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/20">
            <div className="flex items-center gap-1.5 text-[#B7CEEC]/70 mb-1 f1-sub-header text-[10px]">
              <Sun className="w-3.5 h-3.5 text-[#4C787E]" />
              <span>Pitch Turf</span>
            </div>
            <p className="font-extrabold text-white text-sm font-mono">Eco Turf</p>
          </TiltCard>

          <TiltCard maxTilt={8} scale={1.03} glowColor="rgba(183, 206, 236, 0.2)" className="p-3.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/20">
            <div className="flex items-center gap-1.5 text-[#B7CEEC]/70 mb-1 f1-sub-header text-[10px]">
              <MapPin className="w-3.5 h-3.5 text-[#4C787E]" />
              <span>Location</span>
            </div>
            <a 
              href="https://www.google.com/maps/search/?api=1&query=5000+Valley+View+Rd,+Richmond,+CA+94803" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-extrabold text-white text-sm font-mono hover:text-[#B7CEEC] transition-colors flex items-center gap-1 underline decoration-[#B7CEEC]/30 underline-offset-4"
            >
              5000 Valley View Rd
            </a>
          </TiltCard>
        </div>

        {/* Stadium Sound Atmosphere Button */}
        <button
          onClick={onToggleSound}
          className="w-full py-3 px-4 rounded-xl border border-[#B7CEEC]/30 bg-[#080d14] text-xs font-bold text-[#B7CEEC] hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-[#4C787E] f1-sub-header tracking-wider"
        >
          <Volume2 className="w-4 h-4 text-[#4C787E]" />
          <span>{isSoundEnabled ? 'Stadium Crowd FX: ON' : 'Enable Stadium Crowd FX'}</span>
        </button>
      </motion.div>

      {/* Scroll Down Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="cursor-pointer group flex flex-col items-center gap-2"
        onClick={onNext}
      >
        <p className="text-[10px] f1-header tracking-[0.22em] text-[#B7CEEC] group-hover:text-white transition-colors">
          SCROLL TO LEAGUE STANDINGS
        </p>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-2.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/80 text-[#B7CEEC] backdrop-blur-md group-hover:border-[#4C787E] group-hover:text-[#4C787E] transition-all"
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
};
