import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Shield, ChevronUp, Sparkles, Award, ArrowRight, Swords, Flame, CheckCircle2, Lock, Unlock, Zap, ChevronDown, Clock } from 'lucide-react';
import { Team, Match } from '../types';
import { TeamLogo } from './TeamLogos';
import { TiltCard } from './TiltCard';

interface State6CupBracketsProps {
  teams: Team[];
  matches: Match[];
  onNext: () => void;
  onOpenMatchModal?: (match: Match) => void;
}

export const State6CupBrackets: React.FC<State6CupBracketsProps> = ({
  teams,
  matches,
  onNext,
  onOpenMatchModal,
}) => {
  const [activeTab, setActiveTab] = useState<'league_cup' | 'super_cup'>('league_cup');

  // Dynamically sort teams by standings: Points > Goal Difference > Goals For > Won
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return (a.rank || 99) - (b.rank || 99);
  });

  const regularMatches = matches.filter(
    (m) =>
      (m.matchType === 'Regular' || !m.matchType || m.matchType === 'Regular Season') &&
      m.id !== 'FIX-007' &&
      m.id !== 'FIX-008' &&
      m.id !== 'FIX-009'
  );

  const isLeagueComplete =
    regularMatches.length > 0
      ? regularMatches.every((m) => m.isFinished === true || m.status === 'ended')
      : teams.length > 0 && teams.every((t) => (t.played || 0) >= 4);

  // Teams resolved dynamically or TBD depending on 4-game completion rule
  const rank1Team = sortedTeams[0] || teams[0];
  const rank2Team = sortedTeams[1] || teams[1] || teams[0];
  const rank3Team = sortedTeams[2] || teams[2] || teams[0];

  // Display names (Real Team Name if 4 games played by all teams, else "1st Place (TBD)", "2nd Place (TBD)", "3rd Place (TBD)")
  const displayLeagueTopperName = isLeagueComplete ? (rank1Team?.name || '1st Place') : '1st Place (TBD)';
  const displayRunnerUpName = isLeagueComplete ? (rank2Team?.name || '2nd Place') : '2nd Place (TBD)';
  const display3rdPlaceName = isLeagueComplete ? (rank3Team?.name || '3rd Place') : '3rd Place (TBD)';

  // Find corresponding match fixtures in schedule if any exist
  const leagueCupMatch = matches.find(
    (m) => m.matchType === 'League Cup' || m.matchType === 'Finals' || m.id === 'FIX-007'
  );
  const superCupQualifier = matches.find(
    (m) => m.matchType === 'Super Cup Qualifier' || m.id === 'FIX-008' || m.id === 'FIX-SC-QUAL'
  );
  const superCupFinal = matches.find(
    (m) => m.matchType === 'Super Cup Final' || m.id === 'FIX-009' || m.id === 'FIX-SC-FINAL'
  );

  // Helper to extract live telemetry & score details from match engine
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

    return {
      isStarted,
      isLive,
      isFinished,
      badgeText,
      homeScore: match.homeScore || 0,
      awayScore: match.awayScore || 0,
    };
  };

  // Telemetry state calculations
  const leagueCupData = getMatchTelemetry(leagueCupMatch);
  const qualifierData = getMatchTelemetry(superCupQualifier);
  const superCupFinalData = getMatchTelemetry(superCupFinal);

  // Winner Resolution for Brackets & Trophy Boxes
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
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-3 sm:px-6 py-6 sm:py-8 relative z-10 select-none max-w-4xl mx-auto w-full">
      {/* Top Header Pill */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-1 flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-xl text-[11px] font-bold text-[#B7CEEC] shadow-xl font-mono uppercase tracking-wider"
      >
        <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>OFFICIAL LEAGUE & CUP KNOCKOUT BRACKETS</span>
      </motion.div>

      {/* Main Mobile-Friendly Glass Dashboard Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full bg-[#05080c]/95 border border-[#B7CEEC]/25 backdrop-blur-2xl rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden relative"
      >
        {/* Subtle Ambient Glow Effect */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#4C787E]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Title & Phase Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#B7CEEC]/15">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-white f1-header tracking-wider">
                SUNDAY CUPS FIXTURES AND RESULTS
              </h2>
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black font-mono bg-[#4C787E]/20 text-[#B7CEEC] border border-[#4C787E]/40 uppercase tracking-widest">
                CUP PHASE
              </span>
            </div>
            <p className="text-xs text-[#B7CEEC]/80 font-medium mt-0.5">
              3 Teams • Live Season Knockout Path & Finals
            </p>
          </div>
        </div>

        {/* Navigation Tabs (Mobile Compact layout) */}
        <div className="grid grid-cols-2 gap-1.5 p-1.5 my-4 rounded-xl bg-[#080d14] border border-[#B7CEEC]/15">
          <button
            onClick={() => setActiveTab('league_cup')}
            className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'league_cup'
                ? 'bg-[#4C787E] text-white shadow-md shadow-[#4C787E]/30'
                : 'text-[#B7CEEC]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="truncate">League Cup</span>
          </button>
          <button
            onClick={() => setActiveTab('super_cup')}
            className={`py-2 px-2 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'super_cup'
                ? 'bg-[#4C787E] text-white shadow-md shadow-[#4C787E]/30'
                : 'text-[#B7CEEC]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span className="truncate">Super Cup</span>
          </button>
        </div>

        {/* TAB 1: LEAGUE CUP VISUAL BRACKET */}
        {activeTab === 'league_cup' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Header info banner */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs sm:text-sm font-extrabold text-white f1-header tracking-wide">
                  LEAGUE CUP GRAND FINAL BRACKET
                </h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                1st vs 2nd
              </span>
            </div>

            {/* Visual Bracket Container for League Cup */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#080d14]/90 border border-amber-500/30 shadow-xl space-y-3">
              <TiltCard
                onClick={() => leagueCupMatch && onOpenMatchModal?.(leagueCupMatch)}
                className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-br from-[#080d14] via-[#0a1522] to-[#080d14] border border-amber-500/40 shadow-lg cursor-pointer space-y-2.5"
              >
                {/* Kickoff Date & Time Header */}
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-300 pb-2 border-b border-white/10 font-bold">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{leagueCupMatch?.startTime || 'Sun, Aug 30 • 9:00 AM'}</span>
                </div>
                {/* 1st Place (League Topper) */}
                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isLeagueComplete ? 'bg-[#05080c] border-amber-500/30' : 'bg-[#05080c]/60 border-white/10'}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isLeagueComplete ? (
                      <TeamLogo teamId={rank1Team?.id || ''} size={30} />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono font-bold text-amber-400 text-xs shrink-0">
                        #1
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{displayLeagueTopperName}</p>
                      <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                        {isLeagueComplete ? `${rank1Team?.points || 0} pts • GD ${rank1Team?.goalDifference > 0 ? `+${rank1Team.goalDifference}` : rank1Team?.goalDifference || 0}` : 'League Topper (Pending 4 games)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {leagueCupData.isStarted && (
                      <span className="font-mono text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                        {leagueCupData.homeScore}
                      </span>
                    )}
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
                      SEED #1
                    </span>
                  </div>
                </div>

                {/* Scoreline / Live telemetry center badge */}
                <div className="flex items-center justify-center">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#05080c] border border-amber-500/40">
                    {leagueCupData.isLive ? (
                      <span className="text-[10px] font-black font-mono text-red-400 animate-pulse flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        {leagueCupData.badgeText} ({leagueCupData.homeScore} - {leagueCupData.awayScore})
                      </span>
                    ) : leagueCupData.isFinished ? (
                      <span className="text-[10px] font-black font-mono text-amber-300">
                        FINAL SCORE: {leagueCupData.homeScore} - {leagueCupData.awayScore}
                      </span>
                    ) : (
                      <>
                        <Swords className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-[10px] font-black font-mono text-amber-300">FINAL SHOWDOWN</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 2nd Place (Runner-up) */}
                <div className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${isLeagueComplete ? 'bg-[#05080c] border-[#B7CEEC]/30' : 'bg-[#05080c]/60 border-white/10'}`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {isLeagueComplete ? (
                      <TeamLogo teamId={rank2Team?.id || ''} size={30} />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#B7CEEC]/20 border border-[#B7CEEC]/40 flex items-center justify-center font-mono font-bold text-[#B7CEEC] text-xs shrink-0">
                        #2
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-black text-white truncate">{displayRunnerUpName}</p>
                      <p className="text-[10px] text-[#B7CEEC]/70 font-mono">
                        {isLeagueComplete ? `${rank2Team?.points || 0} pts • GD ${rank2Team?.goalDifference > 0 ? `+${rank2Team.goalDifference}` : rank2Team?.goalDifference || 0}` : 'Runner-Up (Pending 4 games)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {leagueCupData.isStarted && (
                      <span className="font-mono text-sm font-black text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                        {leagueCupData.awayScore}
                      </span>
                    )}
                    <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-[#B7CEEC]/20 text-[#B7CEEC] border border-[#B7CEEC]/40 shrink-0">
                      SEED #2
                    </span>
                  </div>
                </div>
              </TiltCard>

              {/* Vertical Bracket Connector Line Down to Trophy Box */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500 to-amber-300" />
                <div className="px-2 py-0.5 rounded-full bg-[#05080c] border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 my-0.5">
                  {leagueCupChampion ? `${leagueCupChampion.name.toUpperCase()} WINNER ⬇️` : 'CHAMPIONSHIP TROPHY ⬇️'}
                </div>
                <div className="w-0.5 h-3 bg-gradient-to-b from-amber-500 to-amber-300" />
              </div>

              {/* Centered Trophy Box brought down */}
              <div className="mx-auto max-w-[220px] p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-[#05080c] border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-center space-y-1">
                <Trophy className="w-7 h-7 text-amber-400 mx-auto animate-pulse" />
                {leagueCupChampion ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <TeamLogo teamId={leagueCupChampion.id} size={28} />
                      <p className="text-xs font-black font-mono text-amber-300 uppercase tracking-wider">
                        {leagueCupChampion.name}
                      </p>
                    </div>
                    <p className="text-[10px] font-extrabold text-emerald-400 font-mono">
                      LEAGUE CUP CHAMPION 2026 🏆
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-black font-mono text-amber-300 uppercase tracking-wider leading-tight">
                      LEAGUE CUP CHAMPION
                    </p>
                    <p className="text-[9px] text-[#B7CEEC]/60 font-mono">Season 2026</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* TAB 2: SUPER CUP VISUAL BRACKET TREE */}
        {activeTab === 'super_cup' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            {/* Header info banner */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs sm:text-sm font-extrabold text-white f1-header tracking-wide">
                  SUPER CUP TOURNAMENT BRACKET
                </h3>
              </div>
            </div>

            {/* VISUAL BRACKET CONTAINER FOR SUPER CUP */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#080d14]/90 border border-cyan-500/30 shadow-xl space-y-3">
              {/* Bracket Tree Row (Qualifier -> Connector -> Final) */}
              <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
                
                {/* ROUND 1: QUALIFIER MATCH BOX */}
                <div className="sm:col-span-5 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span>QUALIFIER (2nd vs 3rd)</span>
                  </div>

                  <TiltCard
                    onClick={() => superCupQualifier && onOpenMatchModal?.(superCupQualifier)}
                    className="p-2.5 rounded-xl bg-[#05080c] border border-cyan-500/40 shadow-md hover:border-cyan-300 transition-all cursor-pointer space-y-1.5"
                  >
                    {/* Kickoff Date & Time Header */}
                    <div className="flex items-center gap-1 text-[9px] font-mono text-cyan-300 pb-1.5 border-b border-white/10 font-bold">
                      <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span>{superCupQualifier?.startTime || 'Sun, Sep 6 • 8:45 AM'}</span>
                    </div>

                    {/* Slot 1: 2nd Place */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#080d14] border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        {isLeagueComplete ? (
                          <TeamLogo teamId={rank2Team?.id || ''} size={22} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #2
                          </div>
                        )}
                        <span className="text-xs font-bold text-white truncate">{displayRunnerUpName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {qualifierData.isStarted && (
                          <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {qualifierData.homeScore}
                          </span>
                        )}
                        <span className="text-[8px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 shrink-0">
                          SEED #2
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-[9px] font-mono text-cyan-400 font-bold">
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
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#080d14] border border-white/5">
                      <div className="flex items-center gap-2 min-w-0">
                        {isLeagueComplete ? (
                          <TeamLogo teamId={rank3Team?.id || ''} size={22} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #3
                          </div>
                        )}
                        <span className="text-xs font-bold text-white truncate">{display3rdPlaceName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {qualifierData.isStarted && (
                          <span className="font-mono text-xs font-black text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/30">
                            {qualifierData.awayScore}
                          </span>
                        )}
                        <span className="text-[8px] font-mono font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 shrink-0">
                          SEED #3
                        </span>
                      </div>
                    </div>
                  </TiltCard>
                </div>

                {/* BRACKET CONNECTOR LINE (Qualifier Winner Output) */}
                <div className="sm:col-span-1 flex sm:flex-col items-center justify-center text-center my-1 sm:my-0">
                  <div className="hidden sm:block w-full h-0.5 bg-gradient-to-r from-cyan-500 to-amber-500" />
                  <div className="px-1.5 py-0.5 rounded bg-[#05080c] border border-cyan-500/40 text-[8px] font-mono font-bold text-cyan-300 uppercase">
                    {qualifierWinnerTeam ? `${qualifierWinnerTeam.shortName || qualifierWinnerTeam.name} ──►` : 'WINNER ──►'}
                  </div>
                  <div className="hidden sm:block w-full h-0.5 bg-gradient-to-r from-cyan-500 to-amber-500" />
                </div>

                {/* ROUND 2: SUPER CUP FINAL MATCH BOX */}
                <div className="sm:col-span-5 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>SUPER CUP FINAL</span>
                  </div>

                  <TiltCard
                    onClick={() => superCupFinal && onOpenMatchModal?.(superCupFinal)}
                    className="p-2.5 rounded-xl bg-gradient-to-br from-[#0a1628] to-[#05080c] border border-amber-500/50 shadow-lg hover:border-amber-300 transition-all cursor-pointer space-y-1.5"
                  >
                    {/* Kickoff Date & Time Header */}
                    <div className="flex items-center gap-1 text-[9px] font-mono text-amber-300 pb-1.5 border-b border-white/10 font-bold">
                      <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{superCupFinal?.startTime || 'Sun, Sep 6 • 10:00 AM'}</span>
                    </div>
                    {/* Slot 1: 1st Place (Bye to Final) */}
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30">
                      <div className="flex items-center gap-2 min-w-0">
                        {isLeagueComplete ? (
                          <TeamLogo teamId={rank1Team?.id || ''} size={22} />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-amber-500/30 text-amber-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                            #1
                          </div>
                        )}
                        <span className="text-xs font-black text-white truncate">{displayLeagueTopperName}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {superCupFinalData.isStarted && (
                          <span className="font-mono text-xs font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                            {superCupFinalData.homeScore}
                          </span>
                        )}
                        <span className="text-[8px] font-mono font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 shrink-0">
                          BYE
                        </span>
                      </div>
                    </div>

                    <div className="text-center text-[9px] font-mono text-amber-400 font-bold">
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
                    <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#080d14] border border-cyan-500/30 border-dashed">
                      <div className="flex items-center gap-2 min-w-0">
                        {qualifierWinnerTeam ? (
                          <>
                            <TeamLogo teamId={qualifierWinnerTeam.id} size={22} />
                            <span className="text-xs font-bold text-white truncate">{qualifierWinnerTeam.name}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              ?
                            </div>
                            <span className="text-xs font-bold text-cyan-300 truncate">Winner (2nd vs 3rd)</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {superCupFinalData.isStarted && (
                          <span className="font-mono text-xs font-black text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                            {superCupFinalData.awayScore}
                          </span>
                        )}
                        <span className="text-[8px] font-mono font-bold text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/10 shrink-0">
                          {qualifierWinnerTeam ? 'QUALIFIED' : 'QUALIFIER'}
                        </span>
                      </div>
                    </div>
                  </TiltCard>
                </div>
              </div>

              {/* Vertical Bracket Connector Line Down to Trophy Box */}
              <div className="flex flex-col items-center justify-center py-1">
                <div className="w-0.5 h-4 bg-gradient-to-b from-amber-500 to-amber-300" />
                <div className="px-2 py-0.5 rounded-full bg-[#05080c] border border-amber-500/40 text-[9px] font-mono font-bold text-amber-300 my-0.5">
                  {superCupChampion ? `${superCupChampion.name.toUpperCase()} WINNER ⬇️` : 'CHAMPIONSHIP TROPHY ⬇️'}
                </div>
                <div className="w-0.5 h-3 bg-gradient-to-b from-amber-500 to-amber-300" />
              </div>

              {/* Centered Trophy Box brought down */}
              <div className="mx-auto max-w-[220px] p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/10 to-[#05080c] border border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.3)] text-center space-y-1">
                <Trophy className="w-7 h-7 text-amber-400 mx-auto animate-pulse" />
                {superCupChampion ? (
                  <>
                    <div className="flex items-center justify-center gap-2">
                      <TeamLogo teamId={superCupChampion.id} size={28} />
                      <p className="text-xs font-black font-mono text-amber-300 uppercase tracking-wider">
                        {superCupChampion.name}
                      </p>
                    </div>
                    <p className="text-[10px] font-extrabold text-emerald-400 font-mono">
                      SUPER CUP CHAMPION 2026 🏆
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xs font-black font-mono text-amber-300 uppercase tracking-wider leading-tight">
                      SUPER CUP CHAMPION
                    </p>
                    <p className="text-[9px] text-[#B7CEEC]/60 font-mono">Season 2026</p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Info Pill Banner */}
        <div className="mt-5 pt-3 border-t border-[#B7CEEC]/15 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 text-[#B7CEEC]/80">
            <Sparkles className="w-3.5 h-3.5 text-[#4C787E]" />
            <span>Tap match cards to inspect fixture details</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4C787E]/15 border border-[#4C787E]/30 text-[#B7CEEC] font-bold text-[10px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>ALL FIXTURES ARE BASED ON LEAGUE STANDINGS</span>
          </div>
        </div>
      </motion.div>

      {/* Scroll to Live Action & Fixtures Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-2 cursor-pointer group flex flex-col items-center gap-1.5"
        onClick={onNext}
      >
        <p className="text-[10px] f1-header tracking-[0.22em] text-[#B7CEEC] group-hover:text-white transition-colors">
          SCROLL TO LIVE ACTION & FIXTURES
        </p>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-2 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/80 text-[#B7CEEC] backdrop-blur-md group-hover:border-[#4C787E] group-hover:text-[#4C787E] transition-all"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </motion.div>
    </div>
  );
};
