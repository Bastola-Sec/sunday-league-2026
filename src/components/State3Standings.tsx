import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Trophy, Info, Flame, Award, Star, Zap } from 'lucide-react';
import { Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';

interface State3StandingsProps {
  teams: Team[];
  onNext: () => void;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
}

export const State3Standings: React.FC<State3StandingsProps> = ({
  teams,
  onNext,
  onSelectTeam,
  onSelectPlayer,
}) => {
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'assists' | 'motm'>('standings');

  // Sort teams by points, then goal difference
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });

  // Aggregate all players across all team rosters for leaderboards
  const allPlayers = teams.flatMap((team) =>
    (team.roster || []).map((player) => ({
      ...player,
      team,
    }))
  );

  // Leaderboard 1: Top Goalscorers (Golden Boot) - > 0 goals only
  const topScorers = [...allPlayers]
    .filter((p) => (p.goals || 0) > 0)
    .sort((a, b) => (b.goals || 0) - (a.goals || 0))
    .slice(0, 10);

  // Leaderboard 2: Top Assist Providers (Playmakers) - > 0 assists only
  const topAssists = [...allPlayers]
    .filter((p) => (p.assists || 0) > 0)
    .sort((a, b) => (b.assists || 0) - (a.assists || 0))
    .slice(0, 10);

  // Leaderboard 3: Most Player of the Match Awards (MOTM) - > 0 MOTMs only
  const topMotm = [...allPlayers]
    .filter((p) => (p.motmAwards || 0) > 0)
    .sort((a, b) => (b.motmAwards || 0) - (a.motmAwards || 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen flex flex-col justify-between items-center px-4 sm:px-6 py-10 relative z-10 select-none">
      {/* Top Title Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-4 flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <Trophy className="w-4 h-4 text-[#B7CEEC]" />
        <span className="f1-header text-[11px] tracking-[0.2em]">OFFICIAL LEAGUE & TELEMETRY LEADERBOARDS</span>
      </motion.div>

      {/* Main Standings & Leaderboards Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg p-4 sm:p-6 rounded-3xl border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl my-auto space-y-4"
      >
        {/* Module Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#B7CEEC]/20">
          <div>
            <h2 className="text-xl sm:text-2xl font-black f1-header tracking-[0.15em] uppercase text-white">
              SUNDAY LEAGUE 2026
            </h2>
            <p className="text-xs text-[#B7CEEC]/80 font-medium">3 Teams • Live Season Telemetry</p>
          </div>
          <span className="px-3 py-1 rounded-lg bg-[#080d14] text-[#B7CEEC] text-[11px] font-extrabold border border-[#B7CEEC]/30 font-mono">
            LEAGUE PHASE
          </span>
        </div>

        {/* DYNAMIC LEADERBOARD SUB-TABS SWITCHER */}
        <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl bg-[#080d15] border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('standings')}
            className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'standings'
                ? 'bg-gradient-to-r from-[#4C787E] to-teal-500 text-white shadow-lg scale-105 border border-teal-300/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Table</span>
            <span className="sm:hidden">Table</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scorers')}
            className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'scorers'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 shadow-lg scale-105 border border-emerald-200'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Goals</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assists')}
            className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'assists'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-400 text-slate-950 shadow-lg scale-105 border border-cyan-200'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span>Assists</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('motm')}
            className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'motm'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 shadow-lg scale-105 border border-amber-200'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span>MOTM</span>
          </button>
        </div>

        {/* TAB 1: OFFICIAL STANDINGS TABLE */}
        {activeTab === 'standings' && (
          <div>
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
          </div>
        )}

        {/* TAB 2: TOP GOALSCORERS (GOLDEN BOOT) */}
        {activeTab === 'scorers' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-400 uppercase tracking-wider px-2 py-1 border-b border-emerald-500/30">
              <span>Golden Boot Race</span>
              <span>Total Goals</span>
            </div>

            {topScorers.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 space-y-1">
                <p className="font-bold text-emerald-300">No Goals Scored Yet</p>
                <p className="text-[10px] text-gray-500">Only players with &gt; 0 goals appear on the Golden Boot leaderboard.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {topScorers.map((player, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`scorer-${player.id}-${index}`}
                      whileHover={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
                      onClick={() => onSelectPlayer && onSelectPlayer(player, player.team)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:border-emerald-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-xs sm:text-sm">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </span>

                        <TeamLogo teamId={player.team.id} size={26} />

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-extrabold text-xs sm:text-sm">
                              #{player.number} {player.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold uppercase">
                              {player.position}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {player.team.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-black font-mono text-sm shadow-md">
                        <span>⚽</span>
                        <span>{player.goals || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TOP ASSIST PROVIDERS (PLAYMAKERS) */}
        {activeTab === 'assists' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-cyan-400 uppercase tracking-wider px-2 py-1 border-b border-cyan-500/30">
              <span>Playmaker Leaderboard</span>
              <span>Total Assists</span>
            </div>

            {topAssists.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 space-y-1">
                <p className="font-bold text-cyan-300">No Assists Recorded Yet</p>
                <p className="text-[10px] text-gray-500">Only players with &gt; 0 assists appear on the Playmakers leaderboard.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {topAssists.map((player, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`assist-${player.id}-${index}`}
                      whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.15)' }}
                      onClick={() => onSelectPlayer && onSelectPlayer(player, player.team)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:border-cyan-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-xs sm:text-sm">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </span>

                        <TeamLogo teamId={player.team.id} size={26} />

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-extrabold text-xs sm:text-sm">
                              #{player.number} {player.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px] font-bold uppercase">
                              {player.position}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {player.team.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-black font-mono text-sm shadow-md">
                        <span>🅰️</span>
                        <span>{player.assists || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: MOST PLAYER OF THE MATCH AWARDS (MOTM) */}
        {activeTab === 'motm' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider px-2 py-1 border-b border-amber-500/30">
              <span>Player of the Match Leaders</span>
              <span>MOTM Awards</span>
            </div>

            {topMotm.length === 0 ? (
              <div className="py-8 text-center text-xs text-gray-400 space-y-1">
                <p className="font-bold text-amber-300">No MOTM Awards Awarded Yet</p>
                <p className="text-[10px] text-gray-500">Select Player of the Match at Full Time to populate this leaderboard!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {topMotm.map((player, index) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={`motm-${player.id}-${index}`}
                      whileHover={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
                      onClick={() => onSelectPlayer && onSelectPlayer(player, player.team)}
                      className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all hover:border-amber-500/40"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-black text-xs sm:text-sm">
                          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                        </span>

                        <TeamLogo teamId={player.team.id} size={26} />

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-extrabold text-xs sm:text-sm">
                              #{player.number} {player.name}
                            </span>
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold uppercase">
                              {player.position}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {player.team.name}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-black font-mono text-sm shadow-md">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{player.motmAwards || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#B7CEEC]/20 flex items-center justify-between text-[11px] text-[#B7CEEC]/70">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-[#4C787E]" />
            {activeTab === 'standings' ? 'Tap team to inspect roster' : 'Tap player to inspect telemetry'}
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
