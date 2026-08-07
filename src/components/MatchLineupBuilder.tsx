import React, { useState, useEffect } from 'react';
import { Users, ShieldCheck, CheckCircle2, Sparkles, UserCheck, RefreshCw, Zap, Shield, Lock, Unlock, Clock, Eye, Maximize2, Layers, SlidersHorizontal, ChevronDown, Award } from 'lucide-react';
import { Match, Team, AdminUser, Player } from '../types';
import { TeamLogo } from './TeamLogos';

interface MatchLineupBuilderProps {
  match: Match;
  teams: Team[];
  currentAdmin: AdminUser | null;
  onUpdateFullMatch?: (matchId: string, updatedMatch: Partial<Match>) => void;
}

export interface FormationPos {
  num: number;
  top: string;
  left: string;
  role: string;
  label: string;
}

export interface FormationPreset {
  id: string;
  name: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  description: string;
  tactics: string;
  positions: FormationPos[];
}

export const FORMATIONS_8V8: Record<string, FormationPreset> = {
  '3-3-1': {
    id: '3-3-1',
    name: '3-3-1 (Balanced)',
    badge: 'BALANCED',
    badgeBg: 'bg-teal-500/20 border-teal-500/40',
    badgeText: 'text-teal-300',
    description: 'Standard 8v8 balance with a solid defensive back 3 and active midfield width.',
    tactics: 'Maintains solid central defensive cover while wingers track back to aid fullbacks.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '70%', left: '20%', role: 'LB', label: 'Left Back' },
      { num: 4, top: '74%', left: '48%', role: 'CB', label: 'Center Back' },
      { num: 2, top: '70%', left: '76%', role: 'RB', label: 'Right Back' },
      { num: 8, top: '48%', left: '24%', role: 'LM', label: 'Left Mid' },
      { num: 6, top: '52%', left: '48%', role: 'CM', label: 'Center Mid' },
      { num: 7, top: '48%', left: '72%', role: 'RM', label: 'Right Mid' },
      { num: 9, top: '24%', left: '48%', role: 'ST', label: 'Striker' },
    ],
  },
  '3-2-2': {
    id: '3-2-2',
    name: '3-2-2 (Dual Striker)',
    badge: 'TWIN ATTACK',
    badgeBg: 'bg-amber-500/20 border-amber-500/40',
    badgeText: 'text-amber-300',
    description: 'Aggressive twin-striker partnership designed to pin down opposition center-backs.',
    tactics: 'Dual forwards overlap channels while two central midfielders hold midfield structure.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '70%', left: '20%', role: 'LB', label: 'Left Back' },
      { num: 4, top: '74%', left: '48%', role: 'CB', label: 'Center Back' },
      { num: 2, top: '70%', left: '76%', role: 'RB', label: 'Right Back' },
      { num: 8, top: '50%', left: '36%', role: 'LCM', label: 'Left Mid' },
      { num: 6, top: '50%', left: '60%', role: 'RCM', label: 'Right Mid' },
      { num: 9, top: '26%', left: '36%', role: 'LS', label: 'Left Striker' },
      { num: 10, top: '26%', left: '60%', role: 'RS', label: 'Right Striker' },
    ],
  },
  '2-3-2': {
    id: '2-3-2',
    name: '2-3-2 (Attacking Wings)',
    badge: 'WING OVERLOAD',
    badgeBg: 'bg-rose-500/20 border-rose-500/40',
    badgeText: 'text-rose-300',
    description: 'High-octane offensive layout pushing wide wingers forward for early crosses.',
    tactics: 'Sacrifices a third defender for extra width. High risk, high goal reward style.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '72%', left: '32%', role: 'LCB', label: 'Left CB' },
      { num: 5, top: '72%', left: '64%', role: 'RCB', label: 'Right CB' },
      { num: 8, top: '48%', left: '20%', role: 'LM', label: 'Left Wing' },
      { num: 6, top: '52%', left: '48%', role: 'CM', label: 'Central Engine' },
      { num: 7, top: '48%', left: '80%', role: 'RM', label: 'Right Wing' },
      { num: 9, top: '26%', left: '36%', role: 'LS', label: 'Left Striker' },
      { num: 10, top: '26%', left: '60%', role: 'RS', label: 'Right Striker' },
    ],
  },
  '2-4-1': {
    id: '2-4-1',
    name: '2-4-1 (Midfield Overload)',
    badge: 'POSSESSION',
    badgeBg: 'bg-indigo-500/20 border-indigo-500/40',
    badgeText: 'text-indigo-300',
    description: 'Dominate possession with a 4-man midfield box that controls game tempo.',
    tactics: 'Overwhelms opposition in central pitch with numerical superiority and quick passing.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '72%', left: '34%', role: 'LCB', label: 'Left CB' },
      { num: 5, top: '72%', left: '62%', role: 'RCB', label: 'Right CB' },
      { num: 11, top: '48%', left: '16%', role: 'LM', label: 'Left Mid' },
      { num: 8, top: '52%', left: '38%', role: 'LCM', label: 'Central Mid' },
      { num: 6, top: '52%', left: '58%', role: 'RCM', label: 'Central Mid' },
      { num: 7, top: '48%', left: '84%', role: 'RM', label: 'Right Mid' },
      { num: 9, top: '24%', left: '48%', role: 'ST', label: 'Lone Striker' },
    ],
  },
  '3-1-3': {
    id: '3-1-3',
    name: '3-1-3 (All-Out Attack)',
    badge: 'HIGH PRESS',
    badgeBg: 'bg-orange-500/20 border-orange-500/40',
    badgeText: 'text-orange-300',
    description: 'Heavy 3-man forward press designed to force defensive turnovers near opponent goal.',
    tactics: 'Single defensive midfielder holds the line while 3 forwards suffocate build-up play.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '72%', left: '22%', role: 'LB', label: 'Left Back' },
      { num: 4, top: '75%', left: '48%', role: 'CB', label: 'Center Back' },
      { num: 2, top: '72%', left: '74%', role: 'RB', label: 'Right Back' },
      { num: 6, top: '53%', left: '48%', role: 'CDM', label: 'Holding Mid' },
      { num: 11, top: '26%', left: '20%', role: 'LW', label: 'Left Winger' },
      { num: 9, top: '23%', left: '48%', role: 'ST', label: 'Target Striker' },
      { num: 7, top: '26%', left: '76%', role: 'RW', label: 'Right Winger' },
    ],
  },
  '4-2-1': {
    id: '4-2-1',
    name: '4-2-1 (Fortress Shield)',
    badge: 'DEFENSIVE SHIELD',
    badgeBg: 'bg-emerald-500/20 border-emerald-500/40',
    badgeText: 'text-emerald-300',
    description: 'Solid 4-man backline with double-pivot protection for defending leads or counter-attacks.',
    tactics: 'Impenetrable back four shuts down wide attacks while lone striker exploits fast breaks.',
    positions: [
      { num: 1, top: '86%', left: '48%', role: 'GK', label: 'Goalkeeper' },
      { num: 3, top: '72%', left: '18%', role: 'LB', label: 'Left Back' },
      { num: 4, top: '74%', left: '38%', role: 'LCB', label: 'Left CB' },
      { num: 5, top: '74%', left: '58%', role: 'RCB', label: 'Right CB' },
      { num: 2, top: '72%', left: '82%', role: 'RB', label: 'Right Back' },
      { num: 8, top: '52%', left: '36%', role: 'DM', label: 'Defensive Mid' },
      { num: 6, top: '52%', left: '60%', role: 'DM', label: 'Defensive Mid' },
      { num: 9, top: '26%', left: '48%', role: 'ST', label: 'Counter Forward' },
    ],
  },
};

export const MatchLineupBuilder: React.FC<MatchLineupBuilderProps> = ({
  match,
  teams,
  currentAdmin,
  onUpdateFullMatch,
}) => {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId);
  const awayTeam = teams.find((t) => t.id === match.awayTeamId);

  const isCommish = currentAdmin?.role === 'league_commish';
  const isTeamAdmin = Boolean(currentAdmin && !isCommish && currentAdmin.teamId && currentAdmin.teamId !== 'all');
  const assignedTeamId = currentAdmin?.teamId;
  const isAssignedTeamInMatch = assignedTeamId
    ? assignedTeamId === match.homeTeamId || assignedTeamId === match.awayTeamId
    : true;

  // Determine active team being managed (force assigned team for team admins)
  const initialTeamId = isTeamAdmin && assignedTeamId && isAssignedTeamInMatch
    ? assignedTeamId
    : match.homeTeamId;

  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId);
  const activeTeam = teams.find((t) => t.id === selectedTeamId) || homeTeam;
  const isHome = selectedTeamId === match.homeTeamId;

  // Force lock team admins to their assigned team only
  useEffect(() => {
    if (isTeamAdmin && assignedTeamId && isAssignedTeamInMatch && selectedTeamId !== assignedTeamId) {
      setSelectedTeamId(assignedTeamId);
    }
  }, [isTeamAdmin, assignedTeamId, isAssignedTeamInMatch, selectedTeamId]);

  // Local state for selected player IDs and Formation
  const [startingIds, setStartingIds] = useState<string[]>([]);
  const [subIds, setSubIds] = useState<string[]>([]);
  const [selectedFormation, setSelectedFormation] = useState<string>('3-3-1');
  const [pitchView3D, setPitchView3D] = useState<boolean>(true);
  const [pitchZoom, setPitchZoom] = useState<boolean>(false);
  const [highlightedPlayerId, setHighlightedPlayerId] = useState<string | null>(null);

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isForceUnlocked, setIsForceUnlocked] = useState<boolean>(false);
  const [nowTime, setNowTime] = useState<number>(Date.now());
  const [wasAutoLockedBy8HourRule, setWasAutoLockedBy8HourRule] = useState<boolean>(false);

  // Interval timer to keep clock accurate
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper function to extract or parse Kickoff Date from Match
  const getMatchKickoffDate = (m: Match): Date | null => {
    if (m.kickoffTime) {
      const d = new Date(m.kickoffTime);
      if (!isNaN(d.getTime())) return d;
    }
    if (!m.startTime) return null;
    const directDate = new Date(m.startTime);
    if (!isNaN(directDate.getTime())) return directDate;

    const timeMatch = m.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const targetDate = new Date();
      const monthMatch = m.startTime.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
      if (monthMatch) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
        const day = parseInt(monthMatch[2], 10);
        if (monthIndex !== -1) {
          targetDate.setMonth(monthIndex, day);
        }
      }
      targetDate.setHours(hours, minutes, 0, 0);
      return targetDate;
    }
    return null;
  };

  const kickoffDate = getMatchKickoffDate(match);
  // Deadline is exactly 8 hours BEFORE scheduled kickoff time
  const deadlineDate = kickoffDate ? new Date(kickoffDate.getTime() - 8 * 3600 * 1000) : null;
  const msUntilDeadline = deadlineDate ? deadlineDate.getTime() - nowTime : 0;

  // 8 hours pre-game review threshold (passed when current time reaches or passes deadline)
  const is8HourReviewDeadlinePassed = deadlineDate ? msUntilDeadline <= 0 : false;
  const isScreenLocked = is8HourReviewDeadlinePassed && !isForceUnlocked;

  // 8-Hour Auto Selection Execution Effect
  useEffect(() => {
    if (!homeTeam || !awayTeam || !onUpdateFullMatch) return;

    if (is8HourReviewDeadlinePassed) {
      let updated = false;
      const updatePayload: Partial<Match> = {};

      const currentHomeStart = match.homeStartingPlayerIds;
      if (!currentHomeStart || currentHomeStart.length < 8) {
        const sortedHome = [...(homeTeam?.roster || [])].sort(
          (a, b) => (b.overallRating || 80) - (a.overallRating || 80)
        );
        const autoHomeStarting = sortedHome.slice(0, 8).map((p) => p.id);
        const autoHomeSubs = sortedHome.slice(8).map((p) => p.id);
        updatePayload.homeStartingPlayerIds = autoHomeStarting;
        updatePayload.homeSubstitutePlayerIds = autoHomeSubs;
        if (!match.homeFormation) updatePayload.homeFormation = '3-3-1';
        updated = true;
      }

      const currentAwayStart = match.awayStartingPlayerIds;
      if (!currentAwayStart || currentAwayStart.length < 8) {
        const sortedAway = [...(awayTeam?.roster || [])].sort(
          (a, b) => (b.overallRating || 80) - (a.overallRating || 80)
        );
        const autoAwayStarting = sortedAway.slice(0, 8).map((p) => p.id);
        const autoAwaySubs = sortedAway.slice(8).map((p) => p.id);
        updatePayload.awayStartingPlayerIds = autoAwayStarting;
        updatePayload.awaySubstitutePlayerIds = autoAwaySubs;
        if (!match.awayFormation) updatePayload.awayFormation = '3-3-1';
        updated = true;
      }

      if (updated) {
        onUpdateFullMatch(match.id, updatePayload);
        setWasAutoLockedBy8HourRule(true);
      }
    }
  }, [is8HourReviewDeadlinePassed, match.id, homeTeam, awayTeam, match.homeStartingPlayerIds, match.awayStartingPlayerIds, match.homeFormation, match.awayFormation, onUpdateFullMatch]);

  // Sync state whenever match or selectedTeamId changes
  useEffect(() => {
    if (!activeTeam) return;

    const savedStarting = isHome ? match.homeStartingPlayerIds : match.awayStartingPlayerIds;
    const savedSubs = isHome ? match.homeSubstitutePlayerIds : match.awaySubstitutePlayerIds;
    const savedFormation = isHome ? match.homeFormation : match.awayFormation;

    if (savedFormation && FORMATIONS_8V8[savedFormation]) {
      setSelectedFormation(savedFormation);
    } else {
      setSelectedFormation('3-3-1');
    }

    if (savedStarting && savedStarting.length > 0) {
      setStartingIds(savedStarting);
    } else {
      const sorted = [...(activeTeam?.roster || [])].sort(
        (a, b) => (b.overallRating || 80) - (a.overallRating || 80)
      );
      setStartingIds(sorted.slice(0, 8).map((p) => p.id));
    }

    if (savedSubs && savedSubs.length > 0) {
      setSubIds(savedSubs);
    } else {
      const sorted = [...(activeTeam?.roster || [])].sort(
        (a, b) => (b.overallRating || 80) - (a.overallRating || 80)
      );
      const defaultStart = sorted.slice(0, 8).map((p) => p.id);
      setSubIds(sorted.filter((p) => !defaultStart.includes(p.id)).map((p) => p.id));
    }
  }, [match, selectedTeamId, activeTeam, isHome]);

  const formatCountdownStr = (ms: number) => {
    if (ms <= 0) return '00h 00m 00s';
    const totalSecs = Math.floor(ms / 1000);
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  // Persist starting lineup, bench, and formation to parent state & Firestore
  const handlePersist = (newStarting: string[], newSubs: string[], formationChoice?: string) => {
    if (isScreenLocked) return;
    if (!onUpdateFullMatch) return;

    const currentFormation = formationChoice || selectedFormation;

    const updatePayload = isHome
      ? {
        homeStartingPlayerIds: newStarting,
        homeSubstitutePlayerIds: newSubs,
        homeFormation: currentFormation,
      }
      : {
        awayStartingPlayerIds: newStarting,
        awaySubstitutePlayerIds: newSubs,
        awayFormation: currentFormation,
      };

    onUpdateFullMatch(match.id, updatePayload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const isLineupSubmitted = isHome ? Boolean(match.homeLineupSubmitted) : Boolean(match.awayLineupSubmitted);

  const handleSubmitOfficialLineup = () => {
    if (!onUpdateFullMatch || isScreenLocked) return;
    if (startingIds.length < 8) {
      alert(`Starting 8 Required: You currently have ${startingIds.length}/8 players selected. Please select 8 starting players before submitting.`);
      return;
    }

    const updatePayload: Partial<Match> = isHome
      ? {
          homeStartingPlayerIds: startingIds,
          homeSubstitutePlayerIds: subIds,
          homeFormation: selectedFormation,
          homeLineupSubmitted: true,
        }
      : {
          awayStartingPlayerIds: startingIds,
          awaySubstitutePlayerIds: subIds,
          awayFormation: selectedFormation,
          awayLineupSubmitted: true,
        };

    onUpdateFullMatch(match.id, updatePayload);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleFormationSelect = (formationId: string) => {
    if (isScreenLocked) return;
    setSelectedFormation(formationId);
    handlePersist(startingIds, subIds, formationId);
  };

  const handleSetStarting = (playerId: string) => {
    if (isScreenLocked) return;
    if (startingIds.includes(playerId)) return;
    if (startingIds.length >= 8) {
      alert('8v8 Format restricts Starting 8 to exactly 8 players. Move a starting player to bench first.');
      return;
    }
    const newStarting = [...startingIds, playerId];
    const newSubs = subIds.filter((id) => id !== playerId);
    setStartingIds(newStarting);
    setSubIds(newSubs);
    handlePersist(newStarting, newSubs);
  };

  const handleSetSubstitute = (playerId: string) => {
    if (isScreenLocked) return;
    if (subIds.includes(playerId)) return;
    const newStarting = startingIds.filter((id) => id !== playerId);
    const newSubs = [...subIds, playerId];
    setStartingIds(newStarting);
    setSubIds(newSubs);
    handlePersist(newStarting, newSubs);
  };

  const handleUnassign = (playerId: string) => {
    if (isScreenLocked) return;
    const newStarting = startingIds.filter((id) => id !== playerId);
    const newSubs = subIds.filter((id) => id !== playerId);
    setStartingIds(newStarting);
    setSubIds(newSubs);
    handlePersist(newStarting, newSubs);
  };

  const handleAutoPickTop8 = () => {
    if (isScreenLocked) return;
    if (!activeTeam) return;
    const sortedRoster = [...(activeTeam?.roster || [])].sort(
      (a, b) => (b.overallRating || 80) - (a.overallRating || 80)
    );
    const newStarting = sortedRoster.slice(0, 8).map((p) => p.id);
    const newSubs = sortedRoster.slice(8).map((p) => p.id);
    setStartingIds(newStarting);
    setSubIds(newSubs);
    handlePersist(newStarting, newSubs);
  };

  // Active tactical formation info
  const activeFormationPreset = FORMATIONS_8V8[selectedFormation] || FORMATIONS_8V8['3-3-1'];

  // Map starting 8 player objects
  const startingPlayersList: Player[] = startingIds
    .map((id) => (activeTeam?.roster || []).find((p) => p.id === id))
    .filter(Boolean) as Player[];

  // Block access if a Team Admin attempts to access a match where their assigned team is not playing
  if (isTeamAdmin && !isAssignedTeamInMatch) {
    const assignedTeamObj = teams.find((t) => t.id === assignedTeamId);
    return (
      <div className="p-6 rounded-2xl bg-[#12080c]/90 border-2 border-rose-500/50 text-center space-y-4 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(244,63,94,0.3)]">
          <Lock className="w-7 h-7 text-rose-400 animate-pulse" />
        </div>
        <div className="space-y-1.5">
          <h4 className="text-base font-black text-white uppercase tracking-widest f1-header">
            ⛔ ACCESS BLOCKED: OTHER TEAM LINEUP RESTRICTED
          </h4>
          <p className="text-xs text-rose-200/90 max-w-md mx-auto font-medium leading-relaxed">
            As an admin for <strong>{assignedTeamObj?.name || currentAdmin?.teamName || 'your assigned team'}</strong>, you are strictly restricted to managing your own team's starting lineup and formation only. Access to other team lineups ({homeTeam?.name} vs {awayTeam?.name}) is blocked.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#090305] border border-rose-500/40 text-rose-300 text-xs font-bold shadow-inner">
          <Shield className="w-4 h-4 text-rose-400" />
          <span>Lineup & Formation Locked to {assignedTeamObj?.name || 'Assigned Team'} Only</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#0d1a28] border border-[#4C787E]/40 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#4C787E]/30 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-teal-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shadow-md">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Official Match Lineup & Squad Selection</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/30 font-bold">
                8v8 Tactical Mode
              </span>
            </h4>
            <p className="text-[11px] text-[#B7CEEC]/80 font-medium">
              Pick formation, Starting 8, and Substitutes for {activeTeam?.name}. Formation & tactics sync live with Match Center.
            </p>
          </div>
        </div>

        {/* Saved Success Notification Pill */}
        {savedSuccess && (
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Lineup Submitted & Synced!
          </span>
        )}
      </div>

      {/* 8-HOUR PRE-GAME LINEUP AUTO-REVIEW & SCREEN LOCK STATUS BANNER */}
      <div className={`p-4 rounded-2xl border transition-all ${isScreenLocked
          ? 'bg-[#12080c]/90 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
          : is8HourReviewDeadlinePassed
            ? 'bg-[#091522] border-teal-500/40 text-teal-200'
            : 'bg-[#0b1724] border-amber-500/40 text-amber-200'
        }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-xl shrink-0 ${isScreenLocked ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
              }`}>
              {isScreenLocked ? <Lock className="w-5 h-5 text-rose-400 animate-pulse" /> : <ShieldCheck className="w-5 h-5 text-teal-400" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-white f1-sub-header">
                  {isScreenLocked
                    ? '🔒 8-HOUR PRE-GAME DEADLINE PASSED & SQUAD SELECTION LOCKED'
                    : '⏱️ 8-HOUR PRE-GAME SQUAD SELECTION DEADLINE'}
                </span>
                {wasAutoLockedBy8HourRule && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 text-[9px] font-black uppercase tracking-wider border border-rose-500/40">
                    Auto-Selected Top 8
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#B7CEEC]/90 font-medium leading-relaxed">
                {isScreenLocked
                  ? 'As required by 8-hour pre-game rules, squad selection and formation are locked. Unchosen lineups were automatically set to top 8 OVR players.'
                  : `Squad selection & formation must be submitted 8 hours before fixture kickoff (${match.startTime}). When countdown finishes, top 8 OVR players will be auto-picked and squad selection locked.`}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto justify-end">
            {!is8HourReviewDeadlinePassed && msUntilDeadline > 0 && (
              <div className="px-3.5 py-1.5 rounded-xl bg-[#040912] border border-amber-500/50 text-amber-300 font-mono text-xs font-bold flex items-center gap-2 shadow-inner">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse shrink-0" />
                <span>Select Squad Within (<strong className="text-white font-extrabold">{formatCountdownStr(msUntilDeadline)}</strong>)</span>
              </div>
            )}

            {isScreenLocked ? (
              isCommish && (
                <button
                  type="button"
                  onClick={() => setIsForceUnlocked(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                >
                  <Unlock className="w-3.5 h-3.5 text-rose-300" />
                  <span>Commissioner Override Unlock</span>
                </button>
              )
            ) : isForceUnlocked ? (
              <button
                type="button"
                onClick={() => setIsForceUnlocked(false)}
                className="px-3.5 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <Lock className="w-3.5 h-3.5 text-teal-300" />
                <span>Re-Lock Selection</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Team Selection Toggle (If Commissioner or match home/away) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#09131e] border border-[#4C787E]/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase">Managing Team:</span>
          {isCommish ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedTeamId(match.homeTeamId)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${selectedTeamId === match.homeTeamId
                    ? 'bg-[#18324a] text-white border border-[#B7CEEC]/50 shadow'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <TeamLogo teamId={match.homeTeamId} size={18} />
                <span>{homeTeam?.name} (Home)</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTeamId(match.awayTeamId)}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 transition-all cursor-pointer ${selectedTeamId === match.awayTeamId
                    ? 'bg-[#18324a] text-white border border-[#B7CEEC]/50 shadow'
                    : 'text-gray-400 hover:text-white'
                  }`}
              >
                <TeamLogo teamId={match.awayTeamId} size={18} />
                <span>{awayTeam?.name} (Away)</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#122336] border border-teal-500/40 shadow-sm">
              <TeamLogo teamId={selectedTeamId} size={20} />
              <span className="font-extrabold text-white">{activeTeam?.name}</span>
              <span className="px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-bold border border-teal-500/30 flex items-center gap-1">
                <Lock className="w-3 h-3 text-teal-400" />
                Locked to My Team Lineup
              </span>
            </div>
          )}
        </div>

        {/* Auto Pick Action */}
        <button
          type="button"
          onClick={handleAutoPickTop8}
          disabled={isScreenLocked}
          className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${isScreenLocked
              ? 'bg-slate-800 text-gray-500 border-slate-700 cursor-not-allowed opacity-50'
              : 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 hover:bg-amber-500/30 border-amber-500/40 cursor-pointer'
            }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Auto-Pick Top 8 OVR</span>
        </button>
      </div>

      {/* TACTICAL FORMATION SELECTION & PRESET CAROUSEL / GRID */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#091522] to-[#0d1e30] border border-teal-500/30 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#4C787E]/25 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-teal-400" />
            <h5 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
              <span>Select Manager Tactical Formation</span>
              <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${activeFormationPreset.badgeBg} ${activeFormationPreset.badgeText}`}>
                {activeFormationPreset.badge}
              </span>
            </h5>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#B7CEEC]/80 font-medium">
            <span>Current: </span>
            <span className="font-extrabold text-white bg-[#13283b] px-2.5 py-1 rounded-lg border border-teal-400/30">
              {activeFormationPreset.name}
            </span>
          </div>
        </div>

        {/* Formation Buttons Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {Object.values(FORMATIONS_8V8).map((preset) => {
            const isSelected = selectedFormation === preset.id;
            return (
              <button
                key={`form-btn-${preset.id}`}
                type="button"
                onClick={() => handleFormationSelect(preset.id)}
                disabled={isScreenLocked}
                className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${isScreenLocked
                    ? isSelected
                      ? 'bg-teal-950/60 border-teal-500/50 text-white cursor-not-allowed'
                      : 'bg-[#08111a] border-[#4C787E]/20 text-gray-500 cursor-not-allowed opacity-50'
                    : isSelected
                      ? 'bg-gradient-to-br from-teal-900/60 to-emerald-950/80 border-teal-400 text-white shadow-lg ring-1 ring-teal-400/50 cursor-pointer scale-[1.02]'
                      : 'bg-[#08121d] hover:bg-[#102336] border-[#4C787E]/30 text-gray-300 cursor-pointer'
                  }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-white">{preset.id}</span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-300 font-semibold block line-clamp-1">
                    {preset.name.split('(')[1]?.replace(')', '') || preset.badge}
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider mt-2 px-1.5 py-0.5 rounded border inline-block w-fit ${preset.badgeBg} ${preset.badgeText}`}>
                  {preset.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tactical Guidance Note */}
        <div className="p-2.5 rounded-xl bg-[#060e17] border border-teal-500/20 text-[11px] text-[#B7CEEC]/90 flex items-start gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white font-bold">{activeFormationPreset.name} Strategy: </strong>
            <span>{activeFormationPreset.description} {activeFormationPreset.tactics}</span>
          </div>
        </div>
      </div>

      {/* 3D / TACTICAL PITCH BOARD PREVIEW (DISPLAYING STARTING 8 ON THE PITCH) */}
      <div className="relative w-full h-[420px] rounded-[2.2rem] bg-gradient-to-b from-[#0b1c28] to-[#07131d] border border-[#4C787E]/40 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
        {/* Top Control Bar Over Field */}
        <div className="relative z-20 flex items-center justify-between gap-2 pointer-events-auto">
          {/* Active Formation Pill */}
          <div className="px-3.5 py-2 rounded-2xl bg-[#13283b]/90 border border-white/15 backdrop-blur-md shadow-lg flex items-center gap-2">
            <TeamLogo teamId={activeTeam?.id || ''} size={20} />
            <div>
              <span className="block text-[10px] text-teal-300 font-bold uppercase tracking-wider leading-none mb-0.5">
                Tactical Pitch ({selectedFormation})
              </span>
              <span className="text-xs font-black text-white tracking-wider uppercase">
                {activeTeam?.name} • {startingIds.length}/8 Starting Players
              </span>
            </div>
          </div>

          {/* View Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPitchView3D((prev) => !prev)}
              className="px-3 py-1.5 rounded-xl bg-[#13283b]/90 hover:bg-[#1d3a54] border border-white/15 text-white backdrop-blur-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="Toggle 3D Isometric Pitch / 2D Tactical View"
            >
              <Layers className="w-3.5 h-3.5 text-teal-400" />
              <span>{pitchView3D ? '3D Isometric' : '2D Tactical'}</span>
            </button>

            <button
              type="button"
              onClick={() => setPitchZoom((prev) => !prev)}
              className="p-2 rounded-xl bg-[#13283b]/90 hover:bg-[#1d3a54] border border-white/15 text-white backdrop-blur-md transition-all shadow-md cursor-pointer"
              title="Zoom In/Out Pitch"
            >
              <Maximize2 className="w-4 h-4 text-teal-300" />
            </button>
          </div>
        </div>

        {/* Pitch Surface Container */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="w-[320px] h-[370px] relative rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.85)] border-2 border-emerald-300/40 transition-transform duration-500"
            style={{
              transform: pitchView3D
                ? pitchZoom
                  ? 'perspective(900px) rotateX(42deg) rotateZ(-6deg) scale(1.1)'
                  : 'perspective(900px) rotateX(55deg) rotateZ(-14deg) scale(0.92)'
                : pitchZoom
                  ? 'scale(1.05)'
                  : 'scale(0.9)',
              background:
                'repeating-linear-gradient(0deg, #1c502d 0px, #1c502d 24px, #236137 24px, #236137 48px)',
            }}
          >
            {/* Field White Markings */}
            <div className="absolute inset-2 border-2 border-white/50 rounded-lg pointer-events-none" />
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50 pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/50 rounded-full pointer-events-none" />

            {/* Top Penalty Box & Goal */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-36 h-16 border-2 border-t-0 border-white/50 pointer-events-none" />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-6 border border-t-0 border-white/40 pointer-events-none" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-4 border-2 border-white bg-white/20 rounded-t-sm pointer-events-none" />

            {/* Bottom Penalty Box & Goal */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-36 h-16 border-2 border-b-0 border-white/50 pointer-events-none" />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-16 h-6 border border-b-0 border-white/40 pointer-events-none" />
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-20 h-4 border-2 border-white bg-white/20 rounded-b-sm pointer-events-none" />

            {/* FORMATION PLAYER NODES ON PITCH */}
            {activeFormationPreset.positions.map((pos, idx) => {
              const playerInSlot = startingPlayersList[idx];
              const isHighlighted = playerInSlot && highlightedPlayerId === playerInSlot.id;

              return (
                <div
                  key={`pitch-slot-${selectedFormation}-${idx}`}
                  onMouseEnter={() => playerInSlot && setHighlightedPlayerId(playerInSlot.id)}
                  onMouseLeave={() => setHighlightedPlayerId(null)}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10 transition-all duration-300 cursor-pointer group"
                  style={{ top: pos.top, left: pos.left }}
                >
                  {/* Base Pitch Ring */}
                  <div
                    className={`w-8 h-8 rounded-full border shadow-lg transition-all ${playerInSlot
                        ? isHighlighted
                          ? 'bg-amber-400/40 border-amber-300 shadow-[#F59E0B] scale-125'
                          : 'bg-[#4B7CEC]/40 border-[#4B7CEC] shadow-[#4B7CEC] animate-pulse'
                        : 'bg-slate-800/80 border-dashed border-gray-400/60 shadow-inner'
                      }`}
                  />

                  {/* 3D / Standing Jersey Overlay */}
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center group-hover:scale-125 transition-transform"
                    style={{
                      transform: pitchView3D ? 'rotateZ(14deg) rotateX(-55deg)' : 'none',
                    }}
                  >
                    {playerInSlot ? (
                      <>
                        <div
                          className={`w-9 h-10 border border-white/70 rounded-t-xl rounded-b-md shadow-2xl flex items-center justify-center relative overflow-hidden bg-gradient-to-b ${isHome
                              ? 'from-[#4B7CEC] to-[#2B54B8]'
                              : 'from-[#EF4444] to-[#991B1B]'
                            }`}
                        >
                          <div className="absolute top-0 w-4 h-1.5 bg-white/80 rounded-b-full" />
                          <span className="text-white font-black text-xs tracking-tight drop-shadow-md mt-1">
                            {playerInSlot.number}
                          </span>
                          {playerInSlot.isCaptain && (
                            <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-amber-400 text-slate-950 text-[8px] font-black flex items-center justify-center">
                              C
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-bold text-white bg-black/85 px-1.5 py-0.5 rounded-full mt-0.5 whitespace-nowrap shadow-md border ${isHighlighted ? 'border-amber-400 text-amber-300' : 'border-[#4B7CEC]/50'
                            }`}
                        >
                          {playerInSlot.name.split(' ')[0]} ({pos.role})
                        </span>
                      </>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-black/70 border border-dashed border-teal-400/70 text-teal-300 flex flex-col items-center justify-center shadow-md">
                        <span className="text-[8px] font-mono font-bold">{pos.role}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Bar Info Overlay */}
        <div className="relative z-20 flex items-center justify-between mt-auto">
          <div className="px-3 py-1.5 rounded-xl bg-[#13283b]/85 border border-white/10 text-[10px] text-gray-300 backdrop-blur-md">
            <span>Positioning: </span>
            <strong className="text-white">{activeFormationPreset.name}</strong>
          </div>

            {!isScreenLocked && (
              <button
                type="button"
                onClick={handleSubmitOfficialLineup}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xl cursor-pointer border ${
                  isLineupSubmitted
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-300/50'
                    : 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:brightness-110 text-slate-950 border-amber-200 font-extrabold animate-pulse'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isLineupSubmitted ? '✅ LINEUP SUBMITTED (UPDATE)' : '🚀 SUBMIT MATCH LINEUP'}</span>
              </button>
            )}
        </div>
      </div>

      {/* Starting 8 & Bench Counter Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-[#09131e] border border-emerald-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">Starting 8 Lineup</span>
            <span className="text-lg font-black text-white">{startingIds.length} / 8 Selected</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/40">
            8v8
          </div>
        </div>

        <div className="p-3 rounded-xl bg-[#09131e] border border-amber-500/30 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase block">Substitutes / Bench</span>
            <span className="text-lg font-black text-white">{subIds.length} Players</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/40">
            Sub
          </div>
        </div>
      </div>

      {/* Roster Selection Table / List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            {activeTeam?.name} Squad Roster ({activeTeam?.roster?.length || 0} Players)
          </span>
          <span className="text-[10px] text-gray-400">
            {isScreenLocked ? '🔒 Selection locked by 8-hour pre-game rule' : 'Click status pill to assign player'}
          </span>
        </div>

        <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1">
          {(activeTeam?.roster || []).map((p, idx) => {
            const isStarting = startingIds.includes(p.id);
            const isSub = subIds.includes(p.id);
            const isHighlighted = highlightedPlayerId === p.id;

            return (
              <div
                key={`builder-p-${p.id}-${idx}`}
                onMouseEnter={() => setHighlightedPlayerId(p.id)}
                onMouseLeave={() => setHighlightedPlayerId(null)}
                className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${isHighlighted
                    ? 'bg-teal-900/40 border-teal-400 text-white ring-1 ring-teal-400/40'
                    : isStarting
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-white'
                      : isSub
                        ? 'bg-amber-950/30 border-amber-500/40 text-gray-200'
                        : 'bg-[#09131e] border-[#4C787E]/20 text-gray-400'
                  }`}
              >
                {/* Player Basic Info */}
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#182d42] border border-[#4C787E]/40 text-[#B7CEEC] font-black text-xs flex items-center justify-center shrink-0">
                    #{p.number}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-xs text-white leading-tight">{p.name}</p>
                      {p.isCaptain && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                          CAPTAIN
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="font-mono">{p.position}</span>
                      <span>•</span>
                      <span>OVR {p.overallRating || 82}</span>
                    </div>
                  </div>
                </div>

                {/* Status Assignment Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetStarting(p.id)}
                    disabled={isScreenLocked}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${isScreenLocked
                        ? isStarting
                          ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-500/30 cursor-not-allowed opacity-80'
                          : 'bg-slate-900 text-gray-600 border border-slate-800 cursor-not-allowed opacity-40'
                        : isStarting
                          ? 'bg-emerald-500 text-slate-950 shadow ring-1 ring-emerald-300 font-black cursor-pointer'
                          : 'bg-[#13283b] text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 cursor-pointer'
                      }`}
                  >
                    {isScreenLocked ? <Lock className="w-3 h-3 text-rose-400" /> : <UserCheck className="w-3 h-3" />}
                    <span>{isStarting ? 'STARTING 8' : 'Set Starting'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetSubstitute(p.id)}
                    disabled={isScreenLocked}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${isScreenLocked
                        ? isSub
                          ? 'bg-amber-950/50 text-amber-400 border border-amber-500/30 cursor-not-allowed opacity-80'
                          : 'bg-slate-900 text-gray-600 border border-slate-800 cursor-not-allowed opacity-40'
                        : isSub
                          ? 'bg-amber-400 text-slate-950 shadow ring-1 ring-amber-300 font-black cursor-pointer'
                          : 'bg-[#13283b] text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 cursor-pointer'
                      }`}
                  >
                    {isScreenLocked ? <Lock className="w-3 h-3 text-amber-400" /> : <Users className="w-3 h-3" />}
                    <span>{isSub ? 'BENCH / SUB' : 'Set Sub'}</span>
                  </button>

                  {(isStarting || isSub) && !isScreenLocked && (
                    <button
                      type="button"
                      onClick={() => handleUnassign(p.id)}
                      className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30 text-[10px] font-bold cursor-pointer"
                      title="Unassign Player"
                    >
                      Out
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MatchLineupBuilder;
