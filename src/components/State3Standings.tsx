import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Trophy, Info, Flame, Award, Star, Zap, Swords, ArrowRight, Sparkles, Clock } from 'lucide-react';
import { Team, Player, Match } from '../types';
import { TeamLogo } from './TeamLogos';
import { TiltCard } from './TiltCard';
import { computeStandingsAndFinalsMatch } from '../utils/leagueEngine';

interface State3StandingsProps {
  teams: Team[];
  matches?: Match[];
  onNext: () => void;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
  onOpenMatchModal?: (match: Match) => void;
}

export const State3Standings: React.FC<State3StandingsProps> = ({
  teams,
  matches = [],
  onNext,
  onSelectTeam,
  onSelectPlayer,
  onOpenMatchModal,
}) => {
  // Main Phase Switcher: LEAGUE PHASE vs CUP PHASE
  const [currentPhase, setCurrentPhase] = useState<'league' | 'cup'>('league');

  // Season Selector State
  const availableSeasons = Array.from(
    new Set(matches.map((m) => m.seasonNumber || 1))
  ).sort((a, b) => b - a);
  if (availableSeasons.length === 0) availableSeasons.push(1);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(() => availableSeasons[0] || 1);

  // Sub-tabs for League Phase (6 categories + Honours)
  const [activeTab, setActiveTab] = useState<'standings' | 'scorers' | 'assists' | 'motm' | 'yellows' | 'reds' | 'honours'>('standings');

  // Sub-tabs for Cup Phase
  const [cupTab, setCupTab] = useState<'league_cup' | 'super_cup'>('league_cup');

  // Filter matches strictly by selected season (defaulting undefined to season 1)
  const seasonMatches = matches.filter(
    (m) => (m.seasonNumber ?? 1) === selectedSeasonNumber
  );

  // Compute season-isolated standings and player telemetry for selected season
  const { updatedTeams: seasonTeams } = computeStandingsAndFinalsMatch(
    teams,
    seasonMatches
  );

  const displayTeams = seasonTeams.length > 0 ? seasonTeams : teams;

  // Sort teams by points, then goal difference for selected season
  const sortedTeams = [...displayTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return b.goalDifference - a.goalDifference;
  });

  const regularMatches = seasonMatches.filter(
    (m) =>
      (m.matchType === 'Regular' || !m.matchType || m.matchType === 'Regular Season') &&
      m.id !== 'FIX-007' &&
      m.id !== 'FIX-008' &&
      m.id !== 'FIX-009'
  );

  const isLeagueComplete =
    regularMatches.length > 0
      ? regularMatches.every((m) => m.isFinished === true || m.status === 'ended')
      : displayTeams.length > 0 && displayTeams.every((t) => (t.played || 0) >= 4);

  const rank1Team = sortedTeams[0] || displayTeams[0];
  const rank2Team = sortedTeams[1] || displayTeams[1] || displayTeams[0];
  const rank3Team = sortedTeams[2] || displayTeams[2] || displayTeams[0];

  const displayLeagueTopperName = isLeagueComplete ? (rank1Team?.name || '1st Place') : '1st Place (TBD)';
  const displayRunnerUpName = isLeagueComplete ? (rank2Team?.name || '2nd Place') : '2nd Place (TBD)';
  const display3rdPlaceName = isLeagueComplete ? (rank3Team?.name || '3rd Place') : '3rd Place (TBD)';

  // Cup matches lookup strictly for selected season
  const leagueCupMatch = seasonMatches.find(
    (m) => m.matchType === 'League Cup' || m.matchType === 'Finals' || m.id === `FIX-S${selectedSeasonNumber}-007` || m.id === 'FIX-007'
  );
  const superCupQualifier = seasonMatches.find(
    (m) => m.matchType === 'Super Cup Qualifier' || m.id === `FIX-S${selectedSeasonNumber}-008` || m.id === 'FIX-SC-QUAL' || m.id === 'FIX-008'
  );
  const superCupFinal = seasonMatches.find(
    (m) => m.matchType === 'Super Cup Final' || m.id === `FIX-S${selectedSeasonNumber}-009` || m.id === 'FIX-SC-FINAL' || m.id === 'FIX-009'
  );

  // Aggregate all players across season team rosters for leaderboards
  const allPlayers = displayTeams.flatMap((team) =>
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

  // Leaderboard 4: Yellow Cards Leaders - > 0 yellow cards
  const topYellows = [...allPlayers]
    .filter((p) => (p.yellowCards || 0) > 0)
    .sort((a, b) => (b.yellowCards || 0) - (a.yellowCards || 0))
    .slice(0, 10);

  // Leaderboard 5: Red Cards Leaders - > 0 red cards
  const topReds = [...allPlayers]
    .filter((p) => (p.redCards || 0) > 0)
    .sort((a, b) => (b.redCards || 0) - (a.redCards || 0))
    .slice(0, 10);

  // --- SEASON HONOURS & HIGHLIGHTS COMPUTATIONS ---
  // 1. League Winner
  const leagueWinner = isLeagueComplete ? rank1Team : null;

  // 2. League Cup Winner
  let leagueCupWinner: Team | null = null;
  if (leagueCupMatch && (leagueCupMatch.isFinished || leagueCupMatch.status === 'ended')) {
    if (leagueCupMatch.homeScore > leagueCupMatch.awayScore) {
      leagueCupWinner = displayTeams.find((t) => t.id === leagueCupMatch.homeTeamId) || null;
    } else if (leagueCupMatch.awayScore > leagueCupMatch.homeScore) {
      leagueCupWinner = displayTeams.find((t) => t.id === leagueCupMatch.awayTeamId) || null;
    }
  }

  // 3. Super Cup Winner
  let superCupWinner: Team | null = null;
  if (superCupFinal && (superCupFinal.isFinished || superCupFinal.status === 'ended')) {
    if (superCupFinal.homeScore > superCupFinal.awayScore) {
      superCupWinner = displayTeams.find((t) => t.id === superCupFinal.homeTeamId) || null;
    } else if (superCupFinal.awayScore > superCupFinal.homeScore) {
      superCupWinner = displayTeams.find((t) => t.id === superCupFinal.awayTeamId) || null;
    }
  }

  // 4. Top Goalscorer (Golden Boot)
  const topGoalscorerWinner = topScorers.length > 0 ? topScorers[0] : null;

  // 5. Top Playmaker (Assist Award)
  const topPlaymakerWinner = topAssists.length > 0 ? topAssists[0] : null;

  // 6. Fair Play Award (Lowest Penalty Cards: Yellow=1, Red=3)
  const teamDisciplineList = displayTeams
    .map((team) => {
      const roster = team.roster || [];
      const yellowCount = roster.reduce((sum, p) => sum + (p.yellowCards || 0), 0);
      const redCount = roster.reduce((sum, p) => sum + (p.redCards || 0), 0);
      const penaltyPoints = yellowCount * 1 + redCount * 3;
      return {
        team,
        yellowCount,
        redCount,
        penaltyPoints,
      };
    })
    .sort((a, b) => a.penaltyPoints - b.penaltyPoints);

  const fairPlayWinner = teamDisciplineList.length > 0 ? teamDisciplineList[0] : null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 sm:px-6 py-6 sm:py-8 relative z-10 select-none">
      {/* Top Title Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-1 flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <Trophy className="w-4 h-4 text-[#B7CEEC]" />
        <span className="f1-header text-[11px] tracking-[0.2em]">OFFICIAL LEADERBOARDS</span>
      </motion.div>

      {/* Main Standings & Leaderboards Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg p-4 sm:p-6 rounded-3xl border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl my-1 space-y-4"
      >
        {/* Module Header with Phase Switcher & Season Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#B7CEEC]/20">
          <div>
            <h2 className="text-lg sm:text-2xl font-black f1-header tracking-[0.15em] uppercase text-white">
              {currentPhase === 'league' ? 'SUNDAY LEAGUE' : 'SUNDAY CUPS'}
            </h2>
            <div className="text-[11px] font-mono text-teal-300 font-bold tracking-widest mt-0.5">
              Est: 2026
            </div>
            <p className="text-xs text-[#B7CEEC]/80 font-medium mt-1">
              {currentPhase === 'league' ? '3 Teams • Season Leaderboards' : '3 Teams • Live Season Knockout Path & Finals'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            {/* Season Selector Dropdown */}
            {availableSeasons.length >= 1 && (
              <div className="relative">
                <select
                  value={selectedSeasonNumber}
                  onChange={(e) => setSelectedSeasonNumber(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-[#080d14] border border-amber-400/50 text-amber-300 text-[10px] font-mono font-black uppercase tracking-wider appearance-none cursor-pointer pr-7 shadow-md hover:border-amber-400 transition-all"
                >
                  {availableSeasons.map((sNum) => (
                    <option key={`season-selector-opt-${sNum}`} value={sNum} className="bg-[#05080c] text-white font-mono">
                      SEASON {sNum}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-amber-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            )}

            {/* Phase Toggle Buttons (LEAGUE PHASE vs CUP PHASE) */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#080d14] border border-[#B7CEEC]/30">
              <button
                type="button"
                onClick={() => setCurrentPhase('league')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-wider transition-all cursor-pointer ${
                  currentPhase === 'league'
                    ? 'bg-[#4C787E] text-white shadow-md shadow-[#4C787E]/30'
                    : 'text-[#B7CEEC]/60 hover:text-white hover:bg-white/5'
                }`}
              >
                LEAGUE PHASE
              </button>
              <button
                type="button"
                onClick={() => setCurrentPhase('cup')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-black font-mono tracking-wider transition-all cursor-pointer ${
                  currentPhase === 'cup'
                    ? 'bg-[#4C787E] text-white shadow-md shadow-[#4C787E]/30'
                    : 'text-[#B7CEEC]/60 hover:text-white hover:bg-white/5'
                }`}
              >
                CUP PHASE
              </button>
            </div>
          </div>
        </div>

        {/* PHASE 1: LEAGUE PHASE CONTENT */}
        {currentPhase === 'league' && (
          <div className="space-y-4">
            {/* CLEAN 3-BUTTON NAVIGATION BAR: TABLE vs STATS vs HONOURS */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#080d15] border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('standings')}
                className={`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'standings'
                    ? 'bg-gradient-to-r from-[#4C787E] to-teal-500 text-white shadow-lg border border-teal-300/40'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-300" />
                <span>Table</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'standings' || activeTab === 'honours') {
                    setActiveTab('scorers');
                  }
                }}
                className={`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab !== 'standings' && activeTab !== 'honours'
                    ? 'bg-gradient-to-r from-teal-600 to-emerald-500 text-white shadow-lg border border-teal-200'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>Stats</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('honours')}
                className={`py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'honours'
                    ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg border border-amber-200'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-950 fill-amber-950" />
                <span>Honours</span>
              </button>
            </div>

            {/* SECONDARY STATS CATEGORY SUB-PILL SELECTOR (Shown ONLY in Stats mode) */}
            {activeTab !== 'standings' && activeTab !== 'honours' && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-[#080d14] border border-white/10 w-full"
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('scorers')}
                  className={`w-full py-1 px-0.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-0.5 cursor-pointer truncate ${
                    activeTab === 'scorers'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 shrink-0" />
                  <span className="truncate">Goals</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('assists')}
                  className={`w-full py-1 px-0.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-0.5 cursor-pointer truncate ${
                    activeTab === 'assists'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-cyan-400 shrink-0" />
                  <span className="truncate">Assists</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('motm')}
                  className={`w-full py-1 px-0.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-0.5 cursor-pointer truncate ${
                    activeTab === 'motm'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400 fill-amber-400 shrink-0" />
                  <span className="truncate">MOTM</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('yellows')}
                  className={`w-full py-1 px-0.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-0.5 cursor-pointer truncate ${
                    activeTab === 'yellows'
                      ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] shrink-0">🟨</span>
                  <span className="truncate">Yellows</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('reds')}
                  className={`w-full py-1 px-0.5 rounded-lg font-bold text-[9px] sm:text-[10px] transition-all flex items-center justify-center gap-0.5 cursor-pointer truncate ${
                    activeTab === 'reds'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] shrink-0">🟥</span>
                  <span className="truncate">Reds</span>
                </button>
              </motion.div>
            )}

            {/* TAB 1: STANDINGS TABLE */}
            {activeTab === 'standings' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#B7CEEC]/20 text-[#B7CEEC]/70 font-mono">
                      <th className="py-2 px-1 text-center w-8">#</th>
                      <th className="py-2 px-2">CLUB</th>
                      <th className="py-2 px-1 text-center font-bold text-white">MP</th>
                      <th className="py-2 px-1 text-center text-emerald-400 font-bold">W</th>
                      <th className="py-2 px-1 text-center text-amber-400 font-bold">D</th>
                      <th className="py-2 px-1 text-center text-rose-400 font-bold">L</th>
                      <th className="py-2 px-1 text-center font-bold">GD</th>
                      <th className="py-2 px-2 text-right font-black text-[#B7CEEC]">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#B7CEEC]/10">
                    {sortedTeams.map((team, idx) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                      const isTop2 = idx < 2;

                      return (
                        <tr
                          key={team.id}
                          onClick={() => onSelectTeam(team)}
                          className={`hover:bg-[#080d14] transition-colors cursor-pointer group ${
                            isTop2 ? 'bg-[#080d14]/60' : ''
                          }`}
                        >
                          <td className="py-3 px-1 text-center font-bold text-[#B7CEEC]">
                            <span className="text-sm">{medal}</span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="shrink-0">
                                <TeamLogo teamId={team.id} size={28} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-white text-xs leading-tight truncate group-hover:text-[#B7CEEC] transition-colors">
                                  {team.name}
                                </p>
                                <p className="text-[10px] text-[#B7CEEC]/80 font-mono tracking-wider">
                                  {team.shortName}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-1 text-center font-bold font-mono text-white">{team.played}</td>
                          <td className="py-3 px-1 text-center font-bold font-mono text-emerald-400">{team.won}</td>
                          <td className="py-3 px-1 text-center font-bold font-mono text-amber-400">{team.drawn}</td>
                          <td className="py-3 px-1 text-center font-bold font-mono text-rose-400">{team.lost}</td>
                          <td className="py-3 px-1 text-center font-bold font-mono text-gray-300">
                            {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                          </td>
                          <td className="py-3 px-2 text-right font-black font-mono text-base text-emerald-400">
                            {team.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: TOP SCORERS */}
            {activeTab === 'scorers' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>PLAYER & CLUB</span>
                  <span className="font-bold text-amber-400">GOALS</span>
                </div>
                {topScorers.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-mono">No telemetry goals logged yet</p>
                ) : (
                  topScorers.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      onClick={() => onSelectPlayer?.(player, player.team)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-2.5 rounded-xl bg-[#080d14] border border-white/5 flex items-center justify-between hover:border-emerald-500/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-amber-400 w-4 text-center">#{idx + 1}</span>
                        <TeamLogo teamId={player.team.id} size={24} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-[10px] text-[#B7CEEC]/70 font-mono">{player.team.name} • #{player.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black font-mono text-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        <span>{player.goals}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: TOP ASSISTS */}
            {activeTab === 'assists' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>PLAYMAKER & CLUB</span>
                  <span className="font-bold text-cyan-400">ASSISTS</span>
                </div>
                {topAssists.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-mono">No telemetry assists logged yet</p>
                ) : (
                  topAssists.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      onClick={() => onSelectPlayer?.(player, player.team)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-2.5 rounded-xl bg-[#080d14] border border-white/5 flex items-center justify-between hover:border-cyan-500/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-cyan-400 w-4 text-center">#{idx + 1}</span>
                        <TeamLogo teamId={player.team.id} size={24} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-[10px] text-[#B7CEEC]/70 font-mono">{player.team.name} • #{player.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black font-mono text-xs">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{player.assists}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: MOTM AWARDS */}
            {activeTab === 'motm' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>STAR PLAYER & CLUB</span>
                  <span className="font-bold text-amber-400">MOTM AWARDS</span>
                </div>
                {topMotm.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-mono">No MOTM awards assigned yet</p>
                ) : (
                  topMotm.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      onClick={() => onSelectPlayer?.(player, player.team)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-2.5 rounded-xl bg-[#080d14] border border-white/5 flex items-center justify-between hover:border-amber-500/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-amber-400 w-4 text-center">#{idx + 1}</span>
                        <TeamLogo teamId={player.team.id} size={24} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-[10px] text-[#B7CEEC]/70 font-mono">{player.team.name} • #{player.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 font-black font-mono text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{player.motmAwards || 0}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 5: YELLOW CARDS */}
            {activeTab === 'yellows' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>DISCIPLINE & CLUB</span>
                  <span className="font-bold text-yellow-400">YELLOW CARDS</span>
                </div>
                {topYellows.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-mono">No yellow cards logged in this season</p>
                ) : (
                  topYellows.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      onClick={() => onSelectPlayer?.(player, player.team)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-2.5 rounded-xl bg-[#080d14] border border-white/5 flex items-center justify-between hover:border-yellow-500/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-yellow-400 w-4 text-center">#{idx + 1}</span>
                        <TeamLogo teamId={player.team.id} size={24} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-[10px] text-[#B7CEEC]/70 font-mono">{player.team.name} • #{player.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-black font-mono text-xs">
                        <span>🟨</span>
                        <span>{player.yellowCards || 0}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 6: RED CARDS */}
            {activeTab === 'reds' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>DISCIPLINE & CLUB</span>
                  <span className="font-bold text-rose-400">RED CARDS</span>
                </div>
                {topReds.length === 0 ? (
                  <p className="text-xs text-center text-gray-400 py-6 font-mono">No red cards logged in this season</p>
                ) : (
                  topReds.map((player, idx) => (
                    <motion.div
                      key={player.id}
                      onClick={() => onSelectPlayer?.(player, player.team)}
                      whileHover={{ scale: 1.01, x: 2 }}
                      className="p-2.5 rounded-xl bg-[#080d14] border border-white/5 flex items-center justify-between hover:border-rose-500/40 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-rose-400 w-4 text-center">#{idx + 1}</span>
                        <TeamLogo teamId={player.team.id} size={24} />
                        <div>
                          <p className="text-xs font-bold text-white leading-tight">{player.name}</p>
                          <p className="text-[10px] text-[#B7CEEC]/70 font-mono">{player.team.name} • #{player.number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black font-mono text-xs">
                        <span>🟥</span>
                        <span>{player.redCards || 0}</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}

            {/* TAB 7: SEASON HONOURS & AWARDS SUMMARY */}
            {activeTab === 'honours' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B7CEEC]/70 px-1 border-b border-white/10 pb-1">
                  <span>SEASON {selectedSeasonNumber} OFFICIAL HONOURS</span>
                  <span className="font-bold text-amber-300 uppercase">AWARDS & HIGHLIGHTS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* 1. LEAGUE CHAMPION */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-amber-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {leagueWinner ? (
                        <TeamLogo teamId={leagueWinner.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 text-sm">🏆</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-wider block">League Winner</span>
                        <p className="text-xs font-black text-white">{leagueWinner ? leagueWinner.name : 'In Progress (TBD)'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {leagueWinner ? `${leagueWinner.points} PTS • GD: ${leagueWinner.goalDifference > 0 ? '+' : ''}${leagueWinner.goalDifference}` : 'Regular season matches active'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${leagueWinner ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-gray-400'}`}>
                      {leagueWinner ? 'CHAMPION 🏆' : 'IN PROGRESS'}
                    </span>
                  </div>

                  {/* 2. LEAGUE CUP WINNER */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-emerald-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {leagueCupWinner ? (
                        <TeamLogo teamId={leagueCupWinner.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-300 text-sm">🥇</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-emerald-400 font-extrabold uppercase tracking-wider block">League Cup Winner</span>
                        <p className="text-xs font-black text-white">{leagueCupWinner ? leagueCupWinner.name : 'Cup Knockout Pending'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {leagueCupMatch && (leagueCupMatch.isFinished || leagueCupMatch.status === 'ended') ? `Final Result: ${leagueCupMatch.homeScore} - ${leagueCupMatch.awayScore}` : 'Week 4 Finals Fixture'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${leagueCupWinner ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-gray-400'}`}>
                      {leagueCupWinner ? 'WINNER 🏆' : 'TBD'}
                    </span>
                  </div>

                  {/* 3. SUPER CUP WINNER */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-cyan-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {superCupWinner ? (
                        <TeamLogo teamId={superCupWinner.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-sm">👑</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider block">Super Cup Winner</span>
                        <p className="text-xs font-black text-white">{superCupWinner ? superCupWinner.name : 'Super Cup Final Pending'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {superCupFinal && (superCupFinal.isFinished || superCupFinal.status === 'ended') ? `Final Result: ${superCupFinal.homeScore} - ${superCupFinal.awayScore}` : 'Super Cup Showdown'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${superCupWinner ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'bg-white/5 text-gray-400'}`}>
                      {superCupWinner ? 'WINNER 👑' : 'TBD'}
                    </span>
                  </div>

                  {/* 4. TOP GOALSCORER (GOLDEN BOOT) */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-amber-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {topGoalscorerWinner ? (
                        <TeamLogo teamId={topGoalscorerWinner.team.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 text-sm">👟</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-amber-400 font-extrabold uppercase tracking-wider block">Golden Boot (Goalscorer)</span>
                        <p className="text-xs font-black text-white">{topGoalscorerWinner ? topGoalscorerWinner.name : 'TBD'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {topGoalscorerWinner ? `${topGoalscorerWinner.team.name} • ${topGoalscorerWinner.goals} Goals` : 'No goals scored yet'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {topGoalscorerWinner ? `🔥 ${topGoalscorerWinner.goals} G` : 'LEADER'}
                    </span>
                  </div>

                  {/* 5. TOP PLAYMAKER (ASSIST AWARD) */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-cyan-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {topPlaymakerWinner ? (
                        <TeamLogo teamId={topPlaymakerWinner.team.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-sm">🪄</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-cyan-400 font-extrabold uppercase tracking-wider block">Playmaker Award (Assists)</span>
                        <p className="text-xs font-black text-white">{topPlaymakerWinner ? topPlaymakerWinner.name : 'TBD'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {topPlaymakerWinner ? `${topPlaymakerWinner.team.name} • ${topPlaymakerWinner.assists} Assists` : 'No assists logged yet'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {topPlaymakerWinner ? `⚡ ${topPlaymakerWinner.assists} A` : 'LEADER'}
                    </span>
                  </div>

                  {/* 6. FAIR PLAY AWARD (FAIREST TEAM) */}
                  <div className="p-3 rounded-2xl bg-[#080d14] border border-blue-500/30 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3">
                      {fairPlayWinner ? (
                        <TeamLogo teamId={fairPlayWinner.team.id} size={32} />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-300 text-sm">🕊️</div>
                      )}
                      <div>
                        <span className="text-[10px] font-mono text-blue-400 font-extrabold uppercase tracking-wider block">Fair Play Award (Discipline)</span>
                        <p className="text-xs font-black text-white">{fairPlayWinner ? fairPlayWinner.team.name : 'TBD'}</p>
                        <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                          {fairPlayWinner ? `Fewest Penalty Cards: 🟨 ${fairPlayWinner.yellowCount} • 🟥 ${fairPlayWinner.redCount}` : 'Discipline ranking'}
                        </p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {fairPlayWinner ? 'FAIREST CLUB 🕊️' : 'LEADER'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PHASE 2: CUP PHASE CONTENT */}
        {currentPhase === 'cup' && (() => {
          // Find cup matches
          const leagueCupMatch = matches.find(
            (m) => m.matchType === 'League Cup' || m.matchType === 'Finals' || m.id === 'FIX-007'
          );
          const superCupQualifier = matches.find(
            (m) => m.matchType === 'Super Cup Qualifier' || m.id === 'FIX-008' || m.id === 'FIX-SC-QUAL'
          );
          const superCupFinal = matches.find(
            (m) => m.matchType === 'Super Cup Final' || m.id === 'FIX-009' || m.id === 'FIX-SC-FINAL'
          );

          // Telemetry helper
          const getMatchTelemetry = (match?: Match | null) => {
            if (!match) return { isStarted: false, isLive: false, isFinished: false, badgeText: 'VS', homeScore: 0, awayScore: 0 };
            const isLive = match.isLive || ['in_progress', '1st_half', 'halftime', '2nd_half'].includes(match.status || '');
            const isFinished = match.isFinished || ['ended', 'full_time'].includes(match.status || '');
            const hasGoals = (match.homeScore || 0) > 0 || (match.awayScore || 0) > 0 || (match.events && match.events.length > 0);
            const isStarted = isLive || isFinished || hasGoals;

            let badgeText = 'VS';
            if (isLive) {
              const pStr = match.status === '1st_half' ? '1H' : match.status === '2nd_half' ? '2H' : match.status === 'halftime' ? 'HT' : 'LIVE';
              badgeText = `🔴 ${pStr} ${match.minute || 0}'`;
            } else if (isFinished) {
              badgeText = 'FT';
            }

            return { isStarted, isLive, isFinished, badgeText, homeScore: match.homeScore || 0, awayScore: match.awayScore || 0 };
          };

          const leagueCupData = getMatchTelemetry(leagueCupMatch);
          const qualifierData = getMatchTelemetry(superCupQualifier);
          const superCupFinalData = getMatchTelemetry(superCupFinal);

          // Winners calculation
          let leagueCupChampion: Team | null = null;
          if (leagueCupData.isFinished || (leagueCupData.isStarted && leagueCupData.homeScore !== leagueCupData.awayScore)) {
            leagueCupChampion = leagueCupData.homeScore > leagueCupData.awayScore ? rank1Team : rank2Team;
          }

          let qualifierWinnerTeam: Team | null = null;
          if (qualifierData.isFinished || (qualifierData.isStarted && qualifierData.homeScore !== qualifierData.awayScore)) {
            qualifierWinnerTeam = qualifierData.homeScore > qualifierData.awayScore ? rank2Team : rank3Team;
          }

          let superCupChampion: Team | null = null;
          if (superCupFinalData.isFinished || (superCupFinalData.isStarted && superCupFinalData.homeScore !== superCupFinalData.awayScore)) {
            const oppTeam = qualifierWinnerTeam || rank2Team;
            superCupChampion = superCupFinalData.homeScore > superCupFinalData.awayScore ? rank1Team : oppTeam;
          }

          return (
            <div className="space-y-4">
              {/* Cup Sub-Tabs */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[#080d15] border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setCupTab('league_cup')}
                  className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    cupTab === 'league_cup'
                      ? 'bg-[#4C787E] text-white shadow-lg border border-[#4C787E]/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>League Cup</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCupTab('super_cup')}
                  className={`py-2 rounded-xl font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    cupTab === 'super_cup'
                      ? 'bg-[#4C787E] text-white shadow-lg border border-[#4C787E]/50'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Super Cup</span>
                </button>
              </div>

              {/* LEAGUE CUP VISUAL BRACKET */}
              {cupTab === 'league_cup' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-amber-400 flex items-center justify-between">
                    <span>LEAGUE CUP GRAND FINAL BRACKET</span>
                    <span className="text-[10px] text-amber-300">1st vs 2nd</span>
                  </div>

                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#080d14]/90 border border-amber-500/30 shadow-xl space-y-2">
                    <TiltCard
                      onClick={() => leagueCupMatch && onOpenMatchModal?.(leagueCupMatch)}
                      className="p-3 rounded-xl bg-gradient-to-br from-[#080d14] via-[#0a1522] to-[#080d14] border border-amber-500/40 shadow-md cursor-pointer space-y-2"
                    >
                      {/* Kickoff Date & Time Header */}
                      <div className="flex items-center gap-1 text-[10px] font-mono text-amber-300 pb-1.5 border-b border-white/10 font-bold">
                        <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{leagueCupMatch?.startTime || 'Sun, Aug 30 • 9:00 AM'}</span>
                      </div>
                      {/* 1st Place */}
                      <div className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isLeagueComplete ? 'bg-[#05080c] border-amber-500/30' : 'bg-[#05080c]/60 border-white/10'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isLeagueComplete ? (
                            <TeamLogo teamId={rank1Team?.id || ''} size={24} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-[10px] shrink-0">
                              #1
                            </div>
                          )}
                          <span className="text-xs font-black text-white truncate">{displayLeagueTopperName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {leagueCupData.isStarted && (
                            <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              {leagueCupData.homeScore}
                            </span>
                          )}
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                            SEED #1
                          </span>
                        </div>
                      </div>

                      {/* Center Score badge */}
                      <div className="flex items-center justify-center">
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#05080c] border border-amber-500/40">
                          {leagueCupData.isLive ? (
                            <span className="text-[9px] font-black font-mono text-red-400 animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                              {leagueCupData.badgeText} ({leagueCupData.homeScore} - {leagueCupData.awayScore})
                            </span>
                          ) : leagueCupData.isFinished ? (
                            <span className="text-[9px] font-black font-mono text-amber-300">
                              FINAL SCORE: {leagueCupData.homeScore} - {leagueCupData.awayScore}
                            </span>
                          ) : (
                            <>
                              <Swords className="w-3 h-3 text-amber-400" />
                              <span className="text-[9px] font-black font-mono text-amber-300">FINAL SHOWDOWN</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* 2nd Place */}
                      <div className={`flex items-center justify-between p-2 rounded-lg border transition-all ${isLeagueComplete ? 'bg-[#05080c] border-[#B7CEEC]/30' : 'bg-[#05080c]/60 border-white/10'}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isLeagueComplete ? (
                            <TeamLogo teamId={rank2Team?.id || ''} size={24} />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-[#B7CEEC]/20 border border-[#B7CEEC]/40 flex items-center justify-center font-mono font-bold text-[#B7CEEC] text-[10px] shrink-0">
                              #2
                            </div>
                          )}
                          <span className="text-xs font-black text-white truncate">{displayRunnerUpName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {leagueCupData.isStarted && (
                            <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                              {leagueCupData.awayScore}
                            </span>
                          )}
                          <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#B7CEEC]/20 text-[#B7CEEC] border border-[#B7CEEC]/40 shrink-0">
                            SEED #2
                          </span>
                        </div>
                      </div>
                    </TiltCard>

                    {/* Vertical Bracket Connector Line Down to Trophy Box */}
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <div className="w-0.5 h-3 bg-gradient-to-b from-amber-500 to-amber-300" />
                      <div className="px-2 py-0.5 rounded-full bg-[#05080c] border border-amber-500/40 text-[8px] font-mono font-bold text-amber-300 my-0.5">
                        {leagueCupChampion ? `${leagueCupChampion.name.toUpperCase()} WINNER ⬇️` : 'CHAMPIONSHIP TROPHY ⬇️'}
                      </div>
                      <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-500 to-amber-300" />
                    </div>

                    {/* Centered Trophy Box brought down */}
                    <div className="mx-auto max-w-[190px] p-2 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-[#05080c] border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-center space-y-0.5">
                      <Trophy className="w-5 h-5 text-amber-400 mx-auto animate-pulse" />
                      {leagueCupChampion ? (
                        <>
                          <div className="flex items-center justify-center gap-1.5">
                            <TeamLogo teamId={leagueCupChampion.id} size={22} />
                            <p className="text-[11px] font-black font-mono text-amber-300 uppercase tracking-wider truncate">
                              {leagueCupChampion.name}
                            </p>
                          </div>
                          <p className="text-[9px] font-extrabold text-emerald-400 font-mono">
                            LEAGUE CUP CHAMPION 🏆
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black font-mono text-amber-300 uppercase tracking-wider leading-tight">
                            LEAGUE CUP CHAMPION
                          </p>
                          <p className="text-[8px] text-[#B7CEEC]/60 font-mono">Season 1</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SUPER CUP VISUAL BRACKET TREE */}
              {cupTab === 'super_cup' && (
                <div className="space-y-2">
                  <div className="text-[11px] font-mono font-bold text-cyan-400 flex items-center justify-between">
                    <span>SUPER CUP TOURNAMENT BRACKET</span>
                  </div>

                  {/* VISUAL BRACKET CONTAINER FOR SUPER CUP */}
                  <div className="p-2.5 sm:p-3 rounded-2xl bg-[#080d14]/90 border border-cyan-500/30 shadow-xl space-y-2">
                    {/* Bracket Tree Row (Qualifier -> Connector -> Final) */}
                    <div className="grid grid-cols-1 sm:grid-cols-11 gap-1.5 items-center">
                      
                      {/* ROUND 1: QUALIFIER MATCH BOX */}
                      <div className="sm:col-span-5 space-y-1">
                        <div className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-400" />
                          <span>QUALIFIER (2nd vs 3rd)</span>
                        </div>

                        <TiltCard
                          onClick={() => superCupQualifier && onOpenMatchModal?.(superCupQualifier)}
                          className="p-2 rounded-xl bg-[#05080c] border border-cyan-500/40 shadow-md hover:border-cyan-300 transition-all cursor-pointer space-y-1"
                        >
                          {/* Kickoff Date & Time Header */}
                          <div className="flex items-center gap-1 text-[8px] font-mono text-cyan-300 pb-1 border-b border-white/10 font-bold">
                            <Clock className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                            <span>{superCupQualifier?.startTime || 'Sun, Sep 6 • 8:45 AM'}</span>
                          </div>

                          {/* Slot 1: 2nd Place */}
                          <div className="flex items-center justify-between p-1 rounded-lg bg-[#080d14] border border-white/5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isLeagueComplete ? (
                                <TeamLogo teamId={rank2Team?.id || ''} size={18} />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                                  #2
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-white truncate">{displayRunnerUpName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {qualifierData.isStarted && (
                                <span className="font-mono text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/30">
                                  {qualifierData.homeScore}
                                </span>
                              )}
                              <span className="text-[7px] font-mono font-bold text-cyan-400 px-1 py-0.2 rounded bg-cyan-500/10 shrink-0">
                                #2
                              </span>
                            </div>
                          </div>

                          <div className="text-center text-[8px] font-mono text-cyan-400 font-bold">
                            {qualifierData.isLive ? (
                              <span className="text-red-400 font-extrabold animate-pulse">
                                🔴 LIVE {qualifierData.badgeText} ({qualifierData.homeScore}-{qualifierData.awayScore})
                              </span>
                            ) : qualifierData.isFinished ? (
                              <span className="text-cyan-300 font-extrabold">FT ({qualifierData.homeScore} - {qualifierData.awayScore})</span>
                            ) : (
                              'VS'
                            )}
                          </div>

                          {/* Slot 2: 3rd Place */}
                          <div className="flex items-center justify-between p-1 rounded-lg bg-[#080d14] border border-white/5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isLeagueComplete ? (
                                <TeamLogo teamId={rank3Team?.id || ''} size={18} />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                                  #3
                                </div>
                              )}
                              <span className="text-[10px] font-bold text-white truncate">{display3rdPlaceName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {qualifierData.isStarted && (
                                <span className="font-mono text-[10px] font-black text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/30">
                                  {qualifierData.awayScore}
                                </span>
                              )}
                              <span className="text-[7px] font-mono font-bold text-amber-400 px-1 py-0.2 rounded bg-amber-500/10 shrink-0">
                                #3
                              </span>
                            </div>
                          </div>
                        </TiltCard>
                      </div>

                      {/* BRACKET CONNECTOR LINE (Qualifier Winner Output) */}
                      <div className="sm:col-span-1 flex sm:flex-col items-center justify-center text-center my-0.5 sm:my-0">
                        <div className="hidden sm:block w-full h-0.5 bg-gradient-to-r from-cyan-500 to-amber-500" />
                        <div className="px-1 py-0.2 rounded bg-[#05080c] border border-cyan-500/40 text-[7px] font-mono font-bold text-cyan-300 uppercase">
                          {qualifierWinnerTeam ? `${qualifierWinnerTeam.shortName || qualifierWinnerTeam.name} ──►` : 'WINNER ──►'}
                        </div>
                        <div className="hidden sm:block w-full h-0.5 bg-gradient-to-r from-cyan-500 to-amber-500" />
                      </div>

                      {/* ROUND 2: SUPER CUP FINAL MATCH BOX */}
                      <div className="sm:col-span-5 space-y-1">
                        <div className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          <span>SUPER CUP FINAL</span>
                        </div>

                        <TiltCard
                          onClick={() => superCupFinal && onOpenMatchModal?.(superCupFinal)}
                          className="p-2 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#05080c] border border-amber-500/50 shadow-lg hover:border-amber-300 transition-all cursor-pointer space-y-1"
                        >
                          {/* Kickoff Date & Time Header */}
                          <div className="flex items-center gap-1 text-[8px] font-mono text-amber-300 pb-1 border-b border-white/10 font-bold">
                            <Clock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                            <span>{superCupFinal?.startTime || 'Sun, Sep 6 • 10:00 AM'}</span>
                          </div>
                          {/* Slot 1: 1st Place (Bye to Final) */}
                          <div className="flex items-center justify-between p-1 rounded-lg bg-amber-500/15 border border-amber-500/30">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {isLeagueComplete ? (
                                <TeamLogo teamId={rank1Team?.id || ''} size={18} />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                                  #1
                                </div>
                              )}
                              <span className="text-[10px] font-black text-white truncate">{displayLeagueTopperName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {superCupFinalData.isStarted && (
                                <span className="font-mono text-[10px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/40">
                                  {superCupFinalData.homeScore}
                                </span>
                              )}
                              <span className="text-[7px] font-mono font-bold text-amber-300 px-1 py-0.2 rounded bg-amber-500/20 shrink-0">
                                BYE
                              </span>
                            </div>
                          </div>

                          <div className="text-center text-[8px] font-mono text-amber-400 font-bold">
                            {superCupFinalData.isLive ? (
                              <span className="text-red-400 font-extrabold animate-pulse">
                                🔴 LIVE {superCupFinalData.badgeText} ({superCupFinalData.homeScore}-{superCupFinalData.awayScore})
                              </span>
                            ) : superCupFinalData.isFinished ? (
                              <span className="text-amber-300 font-extrabold">FT ({superCupFinalData.homeScore} - {superCupFinalData.awayScore})</span>
                            ) : (
                              'VS'
                            )}
                          </div>

                          {/* Slot 2: Qualifier Winner Slot */}
                          <div className="flex items-center justify-between p-1 rounded-lg bg-[#080d14] border border-cyan-500/30 border-dashed">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {qualifierWinnerTeam ? (
                                <>
                                  <TeamLogo teamId={qualifierWinnerTeam.id} size={18} />
                                  <span className="text-[10px] font-bold text-white truncate">{qualifierWinnerTeam.name}</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[9px] flex items-center justify-center shrink-0">
                                    ?
                                  </div>
                                  <span className="text-[9px] font-bold text-cyan-300 truncate">Winner (2nd vs 3rd)</span>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {superCupFinalData.isStarted && (
                                <span className="font-mono text-[10px] font-black text-amber-300 bg-amber-500/20 px-1 py-0.2 rounded border border-amber-500/40">
                                  {superCupFinalData.awayScore}
                                </span>
                              )}
                              <span className="text-[7px] font-mono font-bold text-cyan-400 px-1 py-0.2 rounded bg-cyan-500/10 shrink-0">
                                {qualifierWinnerTeam ? 'QUALIFIED' : 'QUALIFIER'}
                              </span>
                            </div>
                          </div>
                        </TiltCard>
                      </div>
                    </div>

                    {/* Vertical Bracket Connector Line Down to Trophy Box */}
                    <div className="flex flex-col items-center justify-center py-0.5">
                      <div className="w-0.5 h-3 bg-gradient-to-b from-amber-500 to-amber-300" />
                      <div className="px-2 py-0.5 rounded-full bg-[#05080c] border border-amber-500/40 text-[8px] font-mono font-bold text-amber-300 my-0.5">
                        {superCupChampion ? `${superCupChampion.name.toUpperCase()} WINNER ⬇️` : 'CHAMPIONSHIP TROPHY ⬇️'}
                      </div>
                      <div className="w-0.5 h-2.5 bg-gradient-to-b from-amber-500 to-amber-300" />
                    </div>

                    {/* Centered Trophy Box brought down */}
                    <div className="mx-auto max-w-[190px] p-2 rounded-xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-[#05080c] border border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-center space-y-0.5">
                      <Trophy className="w-5 h-5 text-amber-400 mx-auto animate-pulse" />
                      {superCupChampion ? (
                        <>
                          <div className="flex items-center justify-center gap-1.5">
                            <TeamLogo teamId={superCupChampion.id} size={22} />
                            <p className="text-[11px] font-black font-mono text-amber-300 uppercase tracking-wider truncate">
                              {superCupChampion.name}
                            </p>
                          </div>
                          <p className="text-[9px] font-extrabold text-emerald-400 font-mono">
                            SUPER CUP CHAMPION 🏆
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-[10px] font-black font-mono text-amber-300 uppercase tracking-wider leading-tight">
                            SUPER CUP CHAMPION
                          </p>
                          <p className="text-[8px] text-[#B7CEEC]/60 font-mono">Season 1</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Card Footer Banner */}
        <div className="mt-4 pt-3 border-t border-[#B7CEEC]/20 flex flex-col items-center justify-center gap-2 text-[11px]">
          {activeTab === 'standings' ? (
            currentPhase === 'league' ? (
              <>
                {/* Div 1: League Cup Qualification (Cyan Blue - First) */}
                <div className="flex items-center gap-2 bg-[#080d14] px-3 py-1 rounded-lg border border-cyan-500/30">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)] shrink-0" />
                  <span className="text-cyan-300 font-extrabold f1-sub-header text-[8.5px] sm:text-[9px] uppercase tracking-wide">
                    TOP 2 CLUBS ADVANCE TO LEAGUE CUP FINAL
                  </span>
                </div>

                {/* Div 2: Super Cup Qualification (Emerald Green - Second) */}
                <div className="flex items-center gap-2 bg-[#080d14] px-3 py-1 rounded-lg border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                  <span className="text-emerald-300 font-extrabold f1-sub-header text-[8.5px] sm:text-[9px] uppercase tracking-wide">
                    LEAGUE CHAMPION AUTOMATICALLY QUALIFIES FOR SUPER CUP FINAL
                  </span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 bg-[#080d14] px-3.5 py-1.5 rounded-lg border border-emerald-500/30">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
                <span className="text-emerald-300 font-extrabold f1-sub-header text-[10px] uppercase tracking-wide">
                  All fixtures are based on league standings
                </span>
              </div>
            )
          ) : (
            <div className="flex items-center gap-2 bg-[#080d14] px-3.5 py-1.5 rounded-lg border border-amber-400/30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" />
              <span className="text-amber-300 font-extrabold f1-sub-header text-[10px] uppercase tracking-wide">
                Season {selectedSeasonNumber} Official Telemetry
              </span>
            </div>
          )}
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
          SCROLL TO LIVE ACTION & FIXTURES
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
