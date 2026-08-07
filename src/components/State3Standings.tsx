import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Trophy, Info } from 'lucide-react';
import { Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';

interface State3StandingsProps {
  teams: Team[];
  onNext: () => void;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
}

export const State3Standings: React.FC<State3StandingsProps> = ({ teams, onNext, onSelectTeam }) => {

  // Sort teams by points, then goal difference
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 py-10 relative z-10 select-none">
      {/* Top Title Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <Trophy className="w-4 h-4 text-[#B7CEEC]" />
        <span className="f1-header text-[11px] tracking-[0.2em]">OFFICIAL LEAGUE STANDINGS</span>
      </motion.div>

      {/* Main Standings Glass Table */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg p-5 sm:p-6 rounded-3xl border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl my-auto"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#B7CEEC]/20 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black f1-header tracking-[0.15em] uppercase text-white">
              SUNDAY LEAGUE 2026
            </h2>
            <p className="text-xs text-[#B7CEEC]/80 font-medium">3 Teams • Regular Season Table</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-[#080d14] text-[#B7CEEC] text-[11px] font-extrabold border border-[#B7CEEC]/30 font-mono">
            LEAGUE PHASE
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 text-[10px] sm:text-xs font-bold text-[#B7CEEC]/70 uppercase tracking-wider px-2 py-2 border-b border-[#B7CEEC]/20 f1-sub-header">
          <span className="col-span-1 text-center">#</span>
          <span className="col-span-5">Club</span>
          <span className="col-span-1 text-center">MP</span>
          <span className="col-span-1 text-center">W</span>
          <span className="col-span-1 text-center">D</span>
          <span className="col-span-1 text-center">L</span>
          <span className="col-span-1 text-center">GD</span>
          <span className="col-span-1 text-center font-black text-[#4C787E]">PTS</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#B7CEEC]/15 mt-1">
          {sortedTeams.map((team, index) => {
            const rank = index + 1;

            return (
              <motion.div
                key={`standing-row-${team.id}-${index}`}
                whileHover={{ backgroundColor: 'rgba(76, 120, 126, 0.2)' }}
                onClick={() => onSelectTeam(team)}
                className={`grid grid-cols-12 items-center px-2 py-3.5 rounded-xl cursor-pointer transition-all ${
                  rank === 1 ? 'bg-[#4C787E]/15 border-l-4 border-[#4C787E]' : ''
                }`}
              >
                {/* Rank */}
                <span className="col-span-1 text-center font-black text-sm">
                  {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                </span>

                {/* Team Name + Badge */}
                <div className="col-span-5 flex items-center gap-2 overflow-hidden">
                  <TeamLogo teamId={team.id} size={28} />
                  <div className="truncate">
                    <p className="font-bold text-xs sm:text-sm leading-tight text-white truncate">
                      {team.name}
                    </p>
                    <p className="text-[10px] text-[#B7CEEC]/60 truncate font-mono tracking-widest">{team.shortName}</p>
                  </div>
                </div>

                {/* Matches Played */}
                <span className="col-span-1 text-center font-semibold text-xs text-gray-300 font-mono">{team.played}</span>

                {/* Wins */}
                <span className="col-span-1 text-center font-semibold text-xs text-emerald-400 font-mono">{team.won}</span>

                {/* Draws */}
                <span className="col-span-1 text-center font-semibold text-xs text-amber-300 font-mono">{team.drawn}</span>

                {/* Losses */}
                <span className="col-span-1 text-center font-semibold text-xs text-rose-400 font-mono">{team.lost}</span>

                {/* Goal Difference */}
                <span className={`col-span-1 text-center font-semibold text-xs font-mono ${team.goalDifference >= 0 ? 'text-gray-300' : 'text-rose-300'}`}>
                  {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                </span>

                {/* Points */}
                <span className="col-span-1 text-center font-black text-sm sm:text-base text-[#4C787E] font-mono">
                  {team.points}
                </span>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-[#B7CEEC]/20 flex items-center justify-between text-[11px] text-[#B7CEEC]/70">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#4C787E]" />
            Tap any team to inspect details
          </span>
          <span className="text-[#4C787E] font-extrabold f1-sub-header text-[10px]">1st Place = Championship Trophy</span>
        </div>
      </motion.div>

      {/* Scroll Down Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="cursor-pointer group flex flex-col items-center gap-2"
        onClick={onNext}
      >
        <p className="text-[10px] f1-header tracking-[0.22em] text-[#B7CEEC] group-hover:text-white transition-colors">
          SCROLL TO TOP CLUBS
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
