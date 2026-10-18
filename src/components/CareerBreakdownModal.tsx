import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Trophy,
  Star,
  Award,
  Calendar,
  Flame,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Player, Team, Match, SpecialTournament } from '../types';
import { TeamLogo } from './TeamLogos';

interface CareerBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  team: Team | null;
  teams?: Team[];
  matches?: Match[];
  specialTournaments?: SpecialTournament[];
}

export interface CompetitionStat {
  id: string;
  name: string;
  seasonOrYear: string;
  teamCode: string;
  teamName: string;
  teamId: string;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
  motm: number;
  matchesPlayed: number;
  isSpecial: boolean;
  isCompleted: boolean;
  headline: string;
}

export function cleanTeamAbbreviation(teamId: string, teams: Team[] = []): string {
  const cleanId = (teamId || '').toLowerCase().trim();
  if (cleanId === 'no-stamina' || cleanId === 'no-stamina-hustlers') return 'NSH';
  if (cleanId === 'momo-strikers') return 'MoMo';
  if (cleanId === 'jhyap-warriors') return 'JHYAP';

  const found = teams.find((t) => t.id === teamId || t.id.toLowerCase() === cleanId);
  if (found) {
    if (found.shortName && found.shortName.length <= 6) {
      // Remove trailing numbers if any (e.g. NSH35 -> NSH)
      return found.shortName.replace(/\d+$/, '');
    }
    return found.name.split(' ')[0].toUpperCase();
  }
  return teamId ? teamId.toUpperCase().slice(0, 4) : 'SL';
}

export function computePlayerCareerBreakdown(
  player: Player | null,
  matches: Match[] = [],
  teams: Team[] = [],
  specialTournaments: SpecialTournament[] = [],
  fallbackTeam: Team | null = null
): { competitions: CompetitionStat[]; totalCareer: { goals: number; assists: number; motm: number; yellows: number; reds: number; matches: number } } {
  if (!player) {
    return {
      competitions: [],
      totalCareer: { goals: 0, assists: 0, motm: 0, yellows: 0, reds: 0, matches: 0 },
    };
  }

  const pName = (player.name || '').toLowerCase().trim();
  const pId = player.id;

  const isPlayerGoal = (e: any) =>
    e.type === 'goal' &&
    !e.isOwnGoal &&
    ((e.player && e.player.toLowerCase().trim() === pName) || e.player === pId);

  const isPlayerAssist = (e: any) =>
    e.type === 'goal' &&
    ((e.assistPlayer && e.assistPlayer.toLowerCase().trim() === pName) || e.assistPlayer === pId);

  const isPlayerYellow = (e: any) =>
    e.type === 'yellow_card' &&
    ((e.player && e.player.toLowerCase().trim() === pName) || e.player === pId);

  const isPlayerRed = (e: any) =>
    e.type === 'red_card' &&
    ((e.player && e.player.toLowerCase().trim() === pName) || e.player === pId);

  const isPlayerMotm = (m: Match) =>
    m.motmPlayerId === pId ||
    (m.motmPlayerName && m.motmPlayerName.toLowerCase().trim() === pName);

  // Group matches into competitions
  const compDefs: {
    id: string;
    name: string;
    seasonOrYear: string;
    isSpecial: boolean;
    tournament?: SpecialTournament;
    matches: Match[];
  }[] = [];

  // 1. Regular League Seasons
  const leagueMatches = matches.filter(
    (m) => !m.tournamentId && m.matchType !== 'Special Event'
  );
  const seasonNumbers = Array.from(
    new Set(leagueMatches.map((m) => m.seasonNumber || 1))
  ).sort((a, b) => a - b);

  seasonNumbers.forEach((sNum) => {
    compDefs.push({
      id: `season-${sNum}`,
      name: `Season ${sNum}`,
      seasonOrYear: `Season ${sNum}`,
      isSpecial: false,
      matches: leagueMatches.filter((m) => (m.seasonNumber || 1) === sNum),
    });
  });

  // 2. Special Tournaments (e.g. Dashain Cup 2026)
  specialTournaments.forEach((st) => {
    compDefs.push({
      id: st.id,
      name: st.name,
      seasonOrYear: '2026',
      isSpecial: true,
      tournament: st,
      matches: matches.filter(
        (m) =>
          m.tournamentId === st.id ||
          (m.matchType === 'Special Event' && m.venue && m.venue.includes(st.name))
      ),
    });
  });

  // Calculate stats for each competition
  let totalGoals = 0;
  let totalAssists = 0;
  let totalMotm = 0;
  let totalYellows = 0;
  let totalReds = 0;
  let totalMatches = 0;

  const competitions: CompetitionStat[] = compDefs.map((comp) => {
    let cGoals = 0;
    let cAssists = 0;
    let cYellows = 0;
    let cReds = 0;
    let cMotm = 0;
    let cMatches = 0;
    let detectedTeamId: string | null = null;

    comp.matches.forEach((m) => {
      // Check events to tally & detect player team
      (m.events || []).forEach((e) => {
        if (isPlayerGoal(e)) {
          cGoals += 1;
          if (e.teamId && !detectedTeamId) detectedTeamId = e.teamId;
        }
        if (isPlayerAssist(e)) {
          cAssists += 1;
          if (e.teamId && !detectedTeamId) detectedTeamId = e.teamId;
        }
        if (isPlayerYellow(e)) {
          cYellows += 1;
          if (e.teamId && !detectedTeamId) detectedTeamId = e.teamId;
        }
        if (isPlayerRed(e)) {
          cReds += 1;
          if (e.teamId && !detectedTeamId) detectedTeamId = e.teamId;
        }
      });

      if (isPlayerMotm(m)) {
        cMotm += 1;
      }

      // Check appearances
      const isHome = m.homeTeamId === detectedTeamId || (fallbackTeam && m.homeTeamId === fallbackTeam.id);
      const isAway = m.awayTeamId === detectedTeamId || (fallbackTeam && m.awayTeamId === fallbackTeam.id);
      const matchStarted = m.isFinished || m.status === 'ended' || m.homeScore > 0 || m.awayScore > 0;

      if ((isHome || isAway) && matchStarted) {
        const lineup = isHome ? m.homeStartingPlayerIds : m.awayStartingPlayerIds;
        const subs = isHome ? m.homeSubstitutePlayerIds : m.awaySubstitutePlayerIds;
        if (!lineup || lineup.length === 0 || lineup.includes(pId) || (subs && subs.includes(pId))) {
          cMatches += 1;
        }
      }
    });

    // Detect team from tournament roster if not found in events
    if (!detectedTeamId && comp.tournament) {
      const tourneyTeam = (comp.tournament.teams || []).find((t) =>
        (t.roster || []).some(
          (p) => p.id === pId || p.name.toLowerCase().trim() === pName
        )
      );
      if (tourneyTeam) {
        detectedTeamId = tourneyTeam.id;
      }
    }

    // Fallback to active player team
    if (!detectedTeamId) {
      detectedTeamId = fallbackTeam?.id || player.teamId || teams[0]?.id || 'no-stamina';
    }

    const resolvedTeamObj = teams.find((t) => t.id === detectedTeamId);
    const teamCode = cleanTeamAbbreviation(detectedTeamId, teams);
    const teamName = resolvedTeamObj?.name || detectedTeamId;

    // Check completion status
    const isCompleted =
      comp.isSpecial
        ? Boolean(comp.tournament?.isCompleted || (comp.matches.length > 0 && comp.matches.every((m) => m.isFinished || m.status === 'ended')))
        : comp.matches.length > 0 && comp.matches.every((m) => m.isFinished || m.status === 'ended');

    // Build user requested headline format:
    // e.g.: "season 1(NSH) 5 goals, 3 Assists" or "Dashain cup 2026 5 goals"
    const parts: string[] = [];
    if (cGoals > 0) parts.push(`${cGoals} ${cGoals === 1 ? 'goal' : 'goals'}`);
    if (cAssists > 0) parts.push(`${cAssists} ${cAssists === 1 ? 'Assist' : 'Assists'}`);
    const statSummary = parts.length > 0 ? parts.join(', ') : '0 goals, 0 Assists';
    const headline = `${comp.name} (${teamCode}) ${statSummary}`.trim();

    totalGoals += cGoals;
    totalAssists += cAssists;
    totalMotm += cMotm;
    totalYellows += cYellows;
    totalReds += cReds;
    totalMatches += cMatches;

    return {
      id: comp.id,
      name: comp.name,
      seasonOrYear: comp.seasonOrYear,
      teamCode,
      teamName,
      teamId: detectedTeamId,
      goals: cGoals,
      assists: cAssists,
      yellows: cYellows,
      reds: cReds,
      motm: cMotm,
      matchesPlayed: cMatches,
      isSpecial: comp.isSpecial,
      isCompleted,
      headline,
    };
  });

  return {
    competitions,
    totalCareer: {
      goals: totalGoals,
      assists: totalAssists,
      motm: totalMotm,
      yellows: totalYellows,
      reds: totalReds,
      matches: totalMatches,
    },
  };
}

export const CareerBreakdownModal: React.FC<CareerBreakdownModalProps> = ({
  isOpen,
  onClose,
  player,
  team,
  teams = [],
  matches = [],
  specialTournaments = [],
}) => {
  if (!isOpen || !player) return null;

  const { competitions, totalCareer } = computePlayerCareerBreakdown(
    player,
    matches,
    teams,
    specialTournaments,
    team
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 25 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-[#0c1924] border border-amber-400/30 text-white rounded-[2.2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-[#122536] via-[#102231] to-[#0c1924] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-white/10 border border-white/20 shadow-sm shrink-0">
                <TeamLogo teamId={team?.id || player.teamId || ''} size={36} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight">
                    {player.name}
                  </h3>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    #{player.number}
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#B7CEEC] flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>All-Time Career Breakdown</span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border border-white/15"
              title="Close Breakdown"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Aggregate Totals Banner */}
          <div className="p-4 bg-[#142637]/70 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-extrabold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" /> Lifetime Records
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 font-mono font-bold">
                {competitions.length} Competitions
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">Goals</span>
                <span className="text-base sm:text-lg font-black text-amber-300">
                  {totalCareer.goals}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">Assists</span>
                <span className="text-base sm:text-lg font-black text-teal-300">
                  {totalCareer.assists}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">MOTM</span>
                <span className="text-base sm:text-lg font-black text-yellow-300">
                  {totalCareer.motm}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">Matches</span>
                <span className="text-base sm:text-lg font-black text-white">
                  {totalCareer.matches}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">Yellows</span>
                <span className="text-base sm:text-lg font-black text-amber-400">
                  {totalCareer.yellows}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/40 border border-white/10">
                <span className="block text-[9px] uppercase font-bold text-[#B7CEEC]/80">Reds</span>
                <span className="text-base sm:text-lg font-black text-rose-400">
                  {totalCareer.reds}
                </span>
              </div>
            </div>
          </div>

          {/* Scrollable Competition Cards List */}
          <div className="p-4 overflow-y-auto space-y-3 flex-1">
            <p className="text-[10px] uppercase font-mono tracking-wider text-[#B7CEEC]/70 px-1">
              Stats by Season & Tournament
            </p>

            {competitions.map((comp) => (
              <div
                key={comp.id}
                className="p-3.5 rounded-2xl bg-gradient-to-b from-[#152a3a] to-[#0f1f2c] border border-white/15 hover:border-amber-400/40 transition-all shadow-md group"
              >
                {/* User Requested Format Headline */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="text-sm font-black text-white tracking-wide group-hover:text-amber-300 transition-colors">
                      {comp.name}
                      <span className="ml-1.5 px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[11px] font-black border border-amber-400/30">
                        {comp.teamCode}
                      </span>
                    </h4>
                    <p className="text-xs font-extrabold text-amber-300 mt-0.5">
                      {comp.goals > 0 || comp.assists > 0 ? (
                        <span>
                          {comp.goals > 0 && (
                            <span>{comp.goals} {comp.goals === 1 ? 'goal' : 'goals'}</span>
                          )}
                          {comp.goals > 0 && comp.assists > 0 && <span>, </span>}
                          {comp.assists > 0 && (
                            <span className="text-teal-300">{comp.assists} {comp.assists === 1 ? 'Assist' : 'Assists'}</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#B7CEEC]/60 italic font-mono text-[11px]">0 goals, 0 Assists</span>
                      )}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        comp.isCompleted
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      {comp.isCompleted ? '✓ Completed' : 'Active / Scheduled'}
                    </span>
                    <p className="text-[9px] font-bold text-[#B7CEEC]/60 mt-1">
                      {comp.teamName}
                    </p>
                  </div>
                </div>

                {/* Micro-Telemetry Badges */}
                <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-white/10 text-center">
                  <div className="py-1 px-1.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="block text-[8px] text-[#B7CEEC]/70 font-bold">Goals</span>
                    <span className="text-xs font-black text-white">⚽ {comp.goals}</span>
                  </div>
                  <div className="py-1 px-1.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="block text-[8px] text-[#B7CEEC]/70 font-bold">Assists</span>
                    <span className="text-xs font-black text-white">👟 {comp.assists}</span>
                  </div>
                  <div className="py-1 px-1.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="block text-[8px] text-[#B7CEEC]/70 font-bold">MOTM</span>
                    <span className="text-xs font-black text-amber-300">⭐ {comp.motm}</span>
                  </div>
                  <div className="py-1 px-1.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="block text-[8px] text-[#B7CEEC]/70 font-bold">Matches</span>
                    <span className="text-xs font-black text-white">{comp.matchesPlayed}</span>
                  </div>
                  <div className="py-1 px-1.5 rounded-lg bg-black/30 border border-white/5">
                    <span className="block text-[8px] text-[#B7CEEC]/70 font-bold">Cards</span>
                    <span className="text-xs font-black text-yellow-300">
                      {comp.yellows > 0 || comp.reds > 0 ? `🟨${comp.yellows} 🟥${comp.reds}` : '0'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info & Close Button */}
          <div className="p-3.5 border-t border-white/10 bg-[#08121a] flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] text-[#B7CEEC]/70 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Match Telemetry</span>
            </div>
            <button
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
