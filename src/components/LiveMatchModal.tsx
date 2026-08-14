import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ShieldAlert,
  Zap,
  Plus,
  Radio,
  ArrowRight,
  Maximize2,
  Target,
  Swords,
  ShieldCheck,
  Lock,
  ChevronLeft,
  SlidersHorizontal,
  CheckCircle2,
  Users,
  BarChart2,
  MapPin,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Match, Team, MatchEvent, Player } from '../types';
import { TeamLogo } from './TeamLogos';
import { AutoEventWizardModal } from './AutoEventWizardModal';
import { CompletedMatchAnalytics } from './CompletedMatchAnalytics';

interface LiveMatchModalProps {
  match: Match | null;
  onClose: () => void;
  teams: Team[];
  allMatches?: Match[];
  activeAdminTeamId: string | null;
  onUpdateMatchScore: (matchId: string, homeScore: number, awayScore: number, newEvent?: MatchEvent) => void;
  onSendPushNotification: (title: string, message: string, teamId?: string) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
}

export const LiveMatchModal: React.FC<LiveMatchModalProps> = ({
  match,
  onClose,
  teams,
  allMatches = [],
  activeAdminTeamId,
  onUpdateMatchScore,
  onSendPushNotification,
  onSelectPlayer,
}) => {
  const homeTeam = match ? teams.find((t) => t.id === match.homeTeamId) : undefined;
  const awayTeam = match ? teams.find((t) => t.id === match.awayTeamId) : undefined;

  // Compute dynamic Head-To-Head record strictly from finished matches in history
  const completedH2HMatches = (allMatches || []).filter((m) => {
    if (!m || !match) return false;
    const isFinished = m.isFinished || m.status === 'ended';
    if (!isFinished) return false;
    const isTeamA = m.homeTeamId === match.homeTeamId || m.awayTeamId === match.homeTeamId;
    const isTeamB = m.homeTeamId === match.awayTeamId || m.awayTeamId === match.awayTeamId;
    return isTeamA && isTeamB;
  });

  let h2hHomeWins = 0;
  let h2hAwayWins = 0;
  let h2hDraws = 0;
  let h2hTotalGoals = 0;

  completedH2HMatches.forEach((m) => {
    const isHomeInRef = m.homeTeamId === match?.homeTeamId;
    const hGoals = m.homeScore || 0;
    const aGoals = m.awayScore || 0;
    h2hTotalGoals += hGoals + aGoals;

    if (hGoals === aGoals) {
      h2hDraws++;
    } else if (isHomeInRef ? hGoals > aGoals : aGoals > hGoals) {
      h2hHomeWins++;
    } else {
      h2hAwayWins++;
    }
  });

  const h2hTotalMeetings = completedH2HMatches.length;
  const h2hAvgGoals = h2hTotalMeetings > 0 ? (h2hTotalGoals / h2hTotalMeetings).toFixed(1) : '0.0';

  // Active Modal Tab State
  const [activeTab, setActiveTab] = useState<'analytics' | 'lineup' | 'h2h'>(
    match?.isFinished || match?.status === 'ended' ? 'analytics' : 'lineup'
  );

  // Sync tab on match change
  React.useEffect(() => {
    if (match) {
      if (match.isFinished || match.status === 'ended') {
        setActiveTab('analytics');
      } else {
        setActiveTab('lineup');
      }
      setLineupTeamId(match.homeTeamId);
      setSelectedTeamId(match.homeTeamId);
    }
  }, [match?.id, match?.isFinished, match?.status]);

  // Live Clock Interval for Lineup Selection Deadline Countdown
  const [nowTime, setNowTime] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const formatCountdownStr = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Selected Team for Lineup View
  const [lineupTeamId, setLineupTeamId] = useState<string>(match?.homeTeamId || '');
  const selectedLineupTeam = teams.find((t) => t.id === lineupTeamId) || homeTeam;

  // Formation State (8v8 Tournament Formations)
  const [selectedFormation, setSelectedFormation] = useState<string>('3-3-1');
  const [pitchZoom, setPitchZoom] = useState(false);

  useEffect(() => {
    if (match) {
      const isHome = lineupTeamId === match.homeTeamId;
      const savedFormation = isHome ? match.homeFormation : match.awayFormation;
      if (savedFormation) {
        setSelectedFormation(savedFormation);
      }
    }
  }, [lineupTeamId, match?.homeFormation, match?.awayFormation]);

  // Admin Event Form State
  const [selectedEventType, setSelectedEventType] = useState<'goal' | 'yellow_card' | 'red_card'>('goal');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(match?.homeTeamId || '');
  const [selectedPlayerName, setSelectedPlayerName] = useState<string>('');
  const [eventMinute, setEventMinute] = useState<number>(match?.minute || 70);

  // Auto Event Wizard Popup State
  const [isAutoWizardOpen, setIsAutoWizardOpen] = useState<boolean>(false);
  const [wizardEventType, setWizardEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'>('goal');

  const openWizardWithCategory = (cat: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner') => {
    setWizardEventType(cat);
    setIsAutoWizardOpen(true);
  };

  const handleConfirmWizardEvent = (eventData: {
    type: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner';
    teamId: string;
    player: string;
    assistPlayer?: string;
    subOutPlayer?: string;
    minute: number;
    customNote?: string;
    description: string;
    isHomeScoreIncrement?: boolean;
    isAwayScoreIncrement?: boolean;
  }) => {
    if (!match) return;

    let newHomeScore = match.homeScore;
    let newAwayScore = match.awayScore;

    if (eventData.isHomeScoreIncrement) newHomeScore += 1;
    if (eventData.isAwayScoreIncrement) newAwayScore += 1;

    const newEvt: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: eventData.minute,
      type: eventData.type,
      teamId: eventData.teamId,
      player: eventData.player,
      description: eventData.description,
      assistPlayer: eventData.assistPlayer,
      subOutPlayer: eventData.subOutPlayer,
    };

    onUpdateMatchScore(match.id, newHomeScore, newAwayScore, newEvt);

    if (eventData.type === 'goal' || eventData.type === 'red_card') {
      const scoringTeam = teams.find((t) => t.id === eventData.teamId);
      const notifTitle =
        eventData.type === 'goal' ? `⚽ GOAL ALERT! ${scoringTeam?.name}` : `🟥 RED CARD ALERT! ${scoringTeam?.shortName}`;
      onSendPushNotification(notifTitle, eventData.description, eventData.teamId);
    }
  };

  const activeAdminTeam = teams.find((t) => t.id === activeAdminTeamId);
  const isAdminForThisMatch = match ? activeAdminTeamId === match.homeTeamId || activeAdminTeamId === match.awayTeamId : false;

  const handleAddAdminEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!match || !selectedPlayerName) return;

    let isHome = selectedTeamId === match.homeTeamId;
    let newHomeScore = match.homeScore;
    let newAwayScore = match.awayScore;

    if (selectedEventType === 'goal') {
      if (isHome) newHomeScore += 1;
      else newAwayScore += 1;
    }

    const scoringTeam = isHome ? homeTeam : awayTeam;
    const desc =
      selectedEventType === 'goal'
        ? `⚽ GOAL! ${selectedPlayerName} scores for ${scoringTeam?.name}!`
        : selectedEventType === 'yellow_card'
        ? `🟨 Yellow card issued to ${selectedPlayerName} (${scoringTeam?.shortName})`
        : `🟥 RED CARD! ${selectedPlayerName} is sent off! (${scoringTeam?.shortName})`;

    const newEvt: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: eventMinute,
      type: selectedEventType,
      teamId: selectedTeamId,
      player: selectedPlayerName,
      description: desc,
    };

    onUpdateMatchScore(match.id, newHomeScore, newAwayScore, newEvt);

    // Trigger Push Notification
    const notifTitle =
      selectedEventType === 'goal'
        ? `⚽ GOAL ALERT! ${scoringTeam?.name}`
        : `🚨 CARD ISSUED! ${scoringTeam?.shortName}`;
    const notifMsg = `${desc} (${eventMinute}' - ${homeTeam?.shortName} ${newHomeScore} - ${newAwayScore} ${awayTeam?.shortName})`;
    onSendPushNotification(notifTitle, notifMsg, selectedTeamId);

    // Reset Form
    setSelectedPlayerName('');
  };

  // Coordinates for 7v7 / 8v8 tactical pitch formations
  const getFormationCoordinates = (formation: string) => {
    switch (formation) {
      // 7v7 Formations
      case '3-2-1':
        return [
          { num: 1, top: '85%', left: '48%', role: 'CB' },
          { num: 3, top: '70%', left: '22%', role: 'LB' },
          { num: 2, top: '70%', left: '74%', role: 'RB' },
          { num: 6, top: '48%', left: '36%', role: 'LCM' },
          { num: 8, top: '48%', left: '60%', role: 'RCM' },
          { num: 10, top: '34%', left: '48%', role: 'AM' },
          { num: 9, top: '22%', left: '48%', role: 'ST' },
        ];
      case '2-3-1':
        return [
          { num: 1, top: '85%', left: '36%', role: 'LCB' },
          { num: 4, top: '85%', left: '60%', role: 'RCB' },
          { num: 8, top: '52%', left: '20%', role: 'LM' },
          { num: 6, top: '56%', left: '48%', role: 'CM' },
          { num: 7, top: '52%', left: '76%', role: 'RM' },
          { num: 10, top: '36%', left: '48%', role: 'AM' },
          { num: 9, top: '22%', left: '48%', role: 'ST' },
        ];
      case '3-1-2':
        return [
          { num: 1, top: '85%', left: '48%', role: 'CB' },
          { num: 3, top: '70%', left: '22%', role: 'LB' },
          { num: 2, top: '70%', left: '74%', role: 'RB' },
          { num: 6, top: '52%', left: '48%', role: 'CM' },
          { num: 8, top: '36%', left: '32%', role: 'LS' },
          { num: 10, top: '36%', left: '64%', role: 'RS' },
          { num: 9, top: '22%', left: '48%', role: 'ST' },
        ];
      case '2-2-2':
        return [
          { num: 1, top: '85%', left: '36%', role: 'LCB' },
          { num: 4, top: '85%', left: '60%', role: 'RCB' },
          { num: 3, top: '68%', left: '24%', role: 'LB' },
          { num: 2, top: '68%', left: '72%', role: 'RB' },
          { num: 6, top: '48%', left: '36%', role: 'LCM' },
          { num: 8, top: '48%', left: '60%', role: 'RCM' },
          { num: 9, top: '24%', left: '48%', role: 'ST' },
        ];
      case '1-4-1':
        return [
          { num: 1, top: '85%', left: '48%', role: 'CB' },
          { num: 3, top: '72%', left: '28%', role: 'LCB' },
          { num: 2, top: '72%', left: '68%', role: 'RCB' },
          { num: 8, top: '50%', left: '18%', role: 'LM' },
          { num: 6, top: '52%', left: '48%', role: 'CM' },
          { num: 7, top: '50%', left: '78%', role: 'RM' },
          { num: 9, top: '24%', left: '48%', role: 'ST' },
        ];

      // 8v8 Formations
      case '2-3-2':
        return [
          { num: 1, top: '86%', left: '48%', role: 'CB' },
          { num: 3, top: '72%', left: '32%', role: 'CB' },
          { num: 5, top: '72%', left: '64%', role: 'CB' },
          { num: 8, top: '48%', left: '20%', role: 'LM' },
          { num: 6, top: '52%', left: '48%', role: 'CM' },
          { num: 7, top: '48%', left: '80%', role: 'RM' },
          { num: 9, top: '26%', left: '36%', role: 'ST' },
          { num: 10, top: '26%', left: '60%', role: 'ST' },
        ];
      case '3-2-2':
        return [
          { num: 1, top: '86%', left: '48%', role: 'CB' },
          { num: 3, top: '70%', left: '20%', role: 'LB' },
          { num: 4, top: '74%', left: '48%', role: 'CB' },
          { num: 2, top: '70%', left: '76%', role: 'RB' },
          { num: 8, top: '50%', left: '36%', role: 'CM' },
          { num: 6, top: '50%', left: '60%', role: 'CM' },
          { num: 9, top: '26%', left: '36%', role: 'ST' },
          { num: 10, top: '26%', left: '60%', role: 'ST' },
        ];
      case '2-4-1':
        return [
          { num: 1, top: '86%', left: '48%', role: 'CB' },
          { num: 3, top: '72%', left: '34%', role: 'CB' },
          { num: 5, top: '72%', left: '62%', role: 'CB' },
          { num: 11, top: '48%', left: '16%', role: 'LM' },
          { num: 8, top: '52%', left: '38%', role: 'CM' },
          { num: 6, top: '52%', left: '58%', role: 'CM' },
          { num: 7, top: '48%', left: '84%', role: 'RM' },
          { num: 9, top: '24%', left: '48%', role: 'ST' },
        ];
      case '3-1-3':
        return [
          { num: 1, top: '86%', left: '48%', role: 'CB' },
          { num: 3, top: '72%', left: '22%', role: 'LB' },
          { num: 4, top: '75%', left: '48%', role: 'CB' },
          { num: 2, top: '72%', left: '74%', role: 'RB' },
          { num: 6, top: '53%', left: '48%', role: 'CDM' },
          { num: 11, top: '26%', left: '20%', role: 'LW' },
          { num: 9, top: '23%', left: '48%', role: 'ST' },
          { num: 7, top: '26%', left: '76%', role: 'RW' },
        ];
      case '4-2-1':
        return [
          { num: 1, top: '86%', left: '48%', role: 'CB' },
          { num: 3, top: '72%', left: '18%', role: 'LB' },
          { num: 4, top: '74%', left: '38%', role: 'LCB' },
          { num: 5, top: '74%', left: '58%', role: 'RCB' },
          { num: 2, top: '72%', left: '82%', role: 'RB' },
          { num: 8, top: '52%', left: '36%', role: 'DM' },
          { num: 6, top: '52%', left: '60%', role: 'DM' },
          { num: 9, top: '26%', left: '48%', role: 'ST' },
        ];
      case '3-3-1':
      default:
        return [
          { num: 1, top: '85%', left: '48%', role: 'CB' },
          { num: 3, top: '70%', left: '22%', role: 'LB' },
          { num: 2, top: '70%', left: '74%', role: 'RB' },
          { num: 6, top: '48%', left: '36%', role: 'LCM' },
          { num: 8, top: '48%', left: '60%', role: 'RCM' },
          { num: 10, top: '34%', left: '48%', role: 'AM' },
          { num: 9, top: '22%', left: '48%', role: 'ST' },
        ];
    }
  };

  const formationCoords = getFormationCoordinates(selectedFormation);

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          key={`live-match-modal-${match.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-2xl overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="w-full max-w-xl bg-[#091522] border border-[#B7CEEC]/30 rounded-[2.2rem] text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          >
            {/* Modal Top Header Bar */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1c2d] to-[#0a1624] border-b border-[#4C787E]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-full bg-[#142637] text-gray-300 hover:text-white transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h3 className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
                    <span>Team Management</span>
                  </h3>
                  <p className="text-[10px] text-[#B7CEEC]/80">
                    {homeTeam?.shortName} vs {awayTeam?.shortName} • {match.venue}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPitchZoom((prev) => !prev)}
                  className="p-2 rounded-xl bg-[#142637] text-[#B7CEEC] hover:text-white border border-[#4C787E]/30 transition-all cursor-pointer"
                  title="Toggle Pitch Focus"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-[#16293d] text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tab Bar */}
            <div className="px-4 pt-3 bg-[#0a1726] border-b border-[#4C787E]/20 flex items-center gap-2 text-xs font-bold overflow-x-auto">
              <button
                onClick={() => setActiveTab('analytics')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>📊 Match Analytics & Graphs</span>
                {(match.isFinished || match.status === 'ended') ? (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                    FULL TIME
                  </span>
                ) : (match.isLive || match.status === '1st_half' || match.status === '2nd_half' || match.status === 'halftime') ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-black animate-pulse">
                    LIVE
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-[#4C787E]/30 text-[#B7CEEC] text-[9px] font-black">
                    SCHEDULED
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('lineup')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'lineup'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Squad Lineups</span>
              </button>

              <button
                onClick={() => setActiveTab('h2h')}
                className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  activeTab === 'h2h'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Swords className="w-3.5 h-3.5" />
                <span>Head-to-Head</span>
              </button>
            </div>

            {/* Body Scroll Area */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-5">
              {/* TAB 0: COMPLETED MATCH ANALYTICS & GRAPH */}
              {activeTab === 'analytics' && (
                <CompletedMatchAnalytics match={match} homeTeam={homeTeam} awayTeam={awayTeam} />
              )}
              {/* TAB 1: 3D TACTICAL PITCH LINEUP (MATCHING ATTACHED IMAGE) */}
              {activeTab === 'lineup' && (() => {
                const isHomeSelected = lineupTeamId === match.homeTeamId;
                const matchStartingIds = isHomeSelected ? match.homeStartingPlayerIds : match.awayStartingPlayerIds;
                const matchSubIds = isHomeSelected ? match.homeSubstitutePlayerIds : match.awaySubstitutePlayerIds;

                const kickoffDate = getMatchKickoffDate(match);
                const deadlineDate = kickoffDate ? new Date(kickoffDate.getTime() - 8 * 3600 * 1000) : null;
                const msUntilDeadline = deadlineDate ? deadlineDate.getTime() - nowTime : 0;
                const isDeadlinePassed = deadlineDate ? msUntilDeadline <= 0 : false;
                const isLineupSubmitted = Boolean(isHomeSelected ? match.homeLineupSubmitted : match.awayLineupSubmitted);
                const isLineupAvailable = isLineupSubmitted || isDeadlinePassed;

                let activeStartingList: Player[] = [];
                let activeBenchList: Player[] = [];

                const currentFormat = match.matchFormat || '7v7';
                const targetSlots = currentFormat === '7v7' ? 7 : 8;

                if (selectedLineupTeam) {
                  const teamRoster = selectedLineupTeam.roster || [];
                  if (matchStartingIds && matchStartingIds.length > 0) {
                    activeStartingList = matchStartingIds
                      .map((id) => teamRoster.find((p) => p.id === id))
                      .filter((p): p is Player => Boolean(p));
                  } else {
                    activeStartingList = teamRoster.slice(0, targetSlots);
                  }

                  if (matchSubIds && matchSubIds.length > 0) {
                    activeBenchList = matchSubIds
                      .map((id) => teamRoster.find((p) => p.id === id))
                      .filter((p): p is Player => Boolean(p));
                  } else {
                    activeBenchList = teamRoster.filter(
                      (p) => !activeStartingList.some((sp) => sp.id === p.id)
                    );
                  }
                }

                return (
                <div className="space-y-4">
                  {/* Team Toggle Selection Bar */}
                  <div className="flex items-center justify-between p-1.5 rounded-2xl bg-[#0e1d2c] border border-[#4C787E]/30 text-xs">
                    <button
                      onClick={() => setLineupTeamId(match.homeTeamId)}
                      className={`flex-1 py-2 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        lineupTeamId === match.homeTeamId
                          ? 'bg-[#18324a] text-[#B7CEEC] border border-[#B7CEEC]/40 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <TeamLogo teamId={match.homeTeamId} size={20} />
                      <span>{homeTeam?.name}</span>
                    </button>

                    <button
                      onClick={() => setLineupTeamId(match.awayTeamId)}
                      className={`flex-1 py-2 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        lineupTeamId === match.awayTeamId
                          ? 'bg-[#18324a] text-[#B7CEEC] border border-[#B7CEEC]/40 shadow-md'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <TeamLogo teamId={match.awayTeamId} size={20} />
                      <span>{awayTeam?.name}</span>
                    </button>
                  </div>

                  {!isLineupAvailable ? (
                    /* LOCKED UNTIL SUBMITTED OR DEADLINE PASSED PLACEHOLDER */
                    <div className="p-8 rounded-[2rem] bg-[#0b1c28]/90 border border-amber-500/40 text-center space-y-4 shadow-2xl">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
                        <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-base font-black text-white uppercase tracking-wider f1-header">
                          🔒 LINEUP NOT SUBMITTED YET
                        </h4>
                        <p className="text-xs text-[#B7CEEC] font-medium max-w-sm mx-auto leading-relaxed">
                          {selectedLineupTeam?.name} management has not selected their tactical starting 8 yet.
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#040912] border border-amber-500/50 text-amber-300 font-mono text-xs sm:text-sm font-black shadow-inner">
                        <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
                        <span>Lineups will be available in (<strong className="text-white font-extrabold">{formatCountdownStr(msUntilDeadline)}</strong>)</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* 8-Hour Roster Submission Lock Banner */}
                      <div className="p-3 rounded-2xl bg-[#0f2133] border border-amber-500/30 text-[11px] text-amber-200 flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <p className="font-bold text-white">
                            Official Roster Verified • Locked 8+ Hours Before Kickoff
                          </p>
                          <p className="text-[10px] text-gray-300">
                            Lineup reflects official roster updates submitted by {selectedLineupTeam?.name} admin at least 8 hours prior to game time.
                          </p>
                        </div>
                      </div>

                      {/* VIBRANT 3D TACTICAL FOOTBALL PITCH (DISPLAYING ACTIVE TEAM'S 8 PLAYERS) */}
                  <div className="relative w-full h-[400px] rounded-[2.2rem] bg-gradient-to-b from-[#0b1c28] to-[#07131d] border border-[#4C787E]/40 overflow-hidden shadow-2xl flex flex-col justify-between p-4">
                    {/* Top Left Glass Pill Badge */}
                    <div className="absolute top-4 left-4 z-20 px-3.5 py-2 rounded-2xl bg-[#13283b]/80 border border-white/10 backdrop-blur-md shadow-lg pointer-events-auto flex items-center gap-2">
                      <TeamLogo teamId={selectedLineupTeam?.id || ''} size={18} />
                      <div>
                        <span className="block text-[10px] text-gray-300 font-medium leading-none mb-1">
                          Tactical Lineup ({selectedFormation})
                        </span>
                        <span className="text-xs font-black text-white tracking-wider uppercase">
                          {selectedLineupTeam?.name} • {activeStartingList.length} Players
                        </span>
                      </div>
                    </div>

                    {/* Pitch 3D Canvas Area */}
                    <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                      {/* Tilted Isometric Pitch Surface */}
                      <div
                        className="w-[320px] h-[370px] relative rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border-2 border-emerald-300/40 transition-transform duration-300"
                        style={{
                          transform: pitchZoom ? 'scale(1.05)' : 'scale(1.0)',
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

                        {/* SELECTED TEAM PLAYERS ON PITCH */}
                        {(() => {
                          const customPositions = isHomeSelected ? match.homeCustomPositions : match.awayCustomPositions;

                          return formationCoords.map((pos, idx) => {
                            const playerInRoster = activeStartingList[idx];
                            const playerNum = playerInRoster?.number || pos.num;
                            const isHome = lineupTeamId === match.homeTeamId;

                            const nodePos = (customPositions && customPositions[idx]) ? customPositions[idx] : { top: pos.top, left: pos.left };

                            return (
                              <div
                                key={`jersey-node-${selectedLineupTeam?.id}-${idx}`}
                                onClick={() =>
                                  playerInRoster &&
                                  selectedLineupTeam &&
                                  onSelectPlayer &&
                                  onSelectPlayer(playerInRoster, selectedLineupTeam)
                                }
                                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10 transition-all duration-300"
                                style={{ top: nodePos.top, left: nodePos.left }}
                              >
                                {/* Glowing Ring Base on Pitch */}
                                <div
                                  className={`w-8 h-8 rounded-full border shadow-lg animate-pulse ${
                                    isHome
                                      ? 'bg-[#4B7CEC]/30 border-[#4B7CEC] shadow-[#4B7CEC]'
                                      : 'bg-rose-500/30 border-rose-500 shadow-[#EF4444]'
                                  }`}
                                />

                                {/* 3D Vertical Standing Jersey */}
                                <div
                                  className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center group-hover:scale-125 transition-transform"
                                >
                                  <div
                                    className={`w-9 h-10 border border-white/60 rounded-t-xl rounded-b-md shadow-2xl flex items-center justify-center relative overflow-hidden bg-gradient-to-b ${
                                      isHome
                                        ? 'from-[#4B7CEC] to-[#2B54B8]'
                                        : 'from-[#EF4444] to-[#991B1B]'
                                    }`}
                                  >
                                    {/* Jersey Collar */}
                                    <div className="absolute top-0 w-4 h-1.5 bg-white/80 rounded-b-full" />
                                    <span className="text-white font-black text-xs tracking-tight drop-shadow-md mt-1">
                                      {playerNum}
                                    </span>
                                  </div>
                                  <span
                                    className={`text-[9px] font-extrabold text-white bg-black/80 px-2 py-0.5 rounded-full mt-0.5 whitespace-nowrap shadow-md opacity-90 group-hover:opacity-100 border ${
                                      isHome ? 'border-[#4B7CEC]/40' : 'border-rose-500/40'
                                    }`}
                                  >
                                    {playerInRoster ? playerInRoster.name.split(' ')[0] : `#${idx + 1}`}
                                  </span>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>



                    {/* Bottom Overlay Controls */}
                    <div className="relative z-20 flex items-end justify-between mt-auto">
                      {/* Bottom Left Glass Box - Official Team Formation Display */}
                      <div className="px-3.5 py-2 rounded-2xl bg-[#13283b]/85 border border-white/10 backdrop-blur-md shadow-xl flex flex-col">
                        <span className="text-[9px] text-gray-300 font-bold mb-0.5 uppercase tracking-wider">
                          Tactical Lineup
                        </span>
                        <span className="text-xs font-black text-amber-300 tracking-wider">
                          {selectedFormation} Formation
                        </span>
                      </div>

                      {/* Bottom Right Glass Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPitchZoom((prev) => !prev)}
                          className="p-2.5 rounded-2xl bg-[#13283b]/85 border border-white/10 text-white backdrop-blur-md hover:bg-[#1d3a54] transition-all cursor-pointer shadow-xl"
                          title="Fullscreen / Expand Pitch"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPitchZoom(false)}
                          className="p-2.5 rounded-2xl bg-[#13283b]/85 border border-white/10 text-white backdrop-blur-md hover:bg-[#1d3a54] transition-all cursor-pointer shadow-xl"
                          title="Center Pitch View"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Starting Roster Grid List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-black uppercase text-[#B7CEEC] flex items-center gap-1.5">
                        <span>{selectedLineupTeam?.name} Starting {activeStartingList.length}</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#4C787E]/30 text-[10px] text-amber-300 border border-[#4C787E]/50 font-bold">
                          {currentFormat} Format
                        </span>
                      </h4>
                      <span className="text-[10px] text-gray-400 font-normal">
                        Tap player to view 3D Card
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {activeStartingList.map((p, idx) => (
                        <button
                          key={`starting-${p.id}-${idx}`}
                          onClick={() =>
                            selectedLineupTeam && onSelectPlayer && onSelectPlayer(p, selectedLineupTeam)
                          }
                          className="p-2.5 rounded-2xl bg-[#0f2133] hover:bg-[#18324a] border border-[#4C787E]/30 text-xs text-left flex items-center justify-between transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-[#4B7CEC]/20 border border-[#4B7CEC]/40 text-[#B7CEEC] font-black text-[10px] flex items-center justify-center shrink-0">
                              #{p.number}
                            </span>
                            <div className="overflow-hidden">
                              <p className="font-bold text-white text-[11px] group-hover:text-amber-300 transition-colors truncate">
                                {p.name}
                              </p>
                              <p className="text-[9px] text-gray-400 font-mono truncate">{p.position}</p>
                            </div>
                          </div>
                          <span className="text-[9px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 shrink-0">
                            {p.overallRating || 82}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Bench / Substitutes */}
                    {activeBenchList.length > 0 && (
                      <div className="mt-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                          Bench / Substitutes ({activeBenchList.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {activeBenchList.map((sub, idx) => (
                            <span
                              key={`bench-${sub.id}-${idx}`}
                              onClick={() =>
                                selectedLineupTeam && onSelectPlayer && onSelectPlayer(sub, selectedLineupTeam)
                              }
                              className="px-2.5 py-1 rounded-xl bg-[#0b1724] border border-[#4C787E]/30 text-[10px] text-gray-300 hover:text-white hover:border-[#B7CEEC]/50 cursor-pointer transition-all flex items-center gap-1"
                            >
                              <span className="text-amber-400 font-bold">#{sub.number}</span>
                              <span>{sub.name}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })()}

              {/* TAB 2: HEAD-TO-HEAD (H2H) RESULTS */}
              {activeTab === 'h2h' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-[#102336] to-[#0a1522] border border-[#4C787E]/40 text-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center justify-center gap-1.5">
                      <Swords className="w-4 h-4 text-amber-400" />
                      Historic Head-to-Head Record
                    </h4>

                    {/* H2H Visual Bar comparison */}
                    <div className="grid grid-cols-3 gap-2 items-center my-3">
                      <div className="p-3 rounded-2xl bg-[#14283c] border border-[#4C787E]/30">
                        <TeamLogo teamId={match.homeTeamId} size={32} className="mx-auto mb-1" />
                        <span className="block text-xl font-black text-white">{h2hHomeWins}</span>
                        <span className="text-[9px] text-[#B7CEEC] font-bold">
                          {homeTeam?.shortName} Wins
                        </span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#14283c] border border-[#4C787E]/30">
                        <span className="block text-xl font-black text-amber-300">{h2hDraws}</span>
                        <span className="text-[9px] text-amber-300 font-bold uppercase">Draws</span>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#14283c] border border-[#4C787E]/30">
                        <TeamLogo teamId={match.awayTeamId} size={32} className="mx-auto mb-1" />
                        <span className="block text-xl font-black text-white">{h2hAwayWins}</span>
                        <span className="text-[9px] text-[#B7CEEC] font-bold">
                          {awayTeam?.shortName} Wins
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-gray-300 mt-2">
                      Total {h2hTotalMeetings} Meetings • Average {h2hAvgGoals} Goals per match
                    </p>
                  </div>

                  {/* Form Guide */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#B7CEEC] mb-2">
                      Recent Form Comparison
                    </h4>
                    <div className="space-y-2">
                      <div className="p-3 rounded-2xl bg-[#0f2133] border border-[#4C787E]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TeamLogo teamId={match.homeTeamId} size={24} />
                          <span className="font-bold text-xs text-white">{homeTeam?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(homeTeam?.form || []).length === 0 ? (
                            <span className="text-[10px] text-gray-500 font-mono">No matches played</span>
                          ) : (
                            homeTeam?.form.map((f, i) => (
                              <span
                                key={`home-form-${i}`}
                                className={`w-5 h-5 rounded-md font-black text-[10px] flex items-center justify-center ${
                                  f === 'W'
                                    ? 'bg-emerald-500 text-slate-950'
                                    : f === 'D'
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#0f2133] border border-[#4C787E]/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TeamLogo teamId={match.awayTeamId} size={24} />
                          <span className="font-bold text-xs text-white">{awayTeam?.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {(awayTeam?.form || []).length === 0 ? (
                            <span className="text-[10px] text-gray-500 font-mono">No matches played</span>
                          ) : (
                            awayTeam?.form.map((f, i) => (
                              <span
                                key={`away-form-${i}`}
                                className={`w-5 h-5 rounded-md font-black text-[10px] flex items-center justify-center ${
                                  f === 'W'
                                    ? 'bg-emerald-500 text-slate-950'
                                    : f === 'D'
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {f}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Previous Encounters History */}
                  <div>
                    <h4 className="text-xs font-black uppercase text-[#B7CEEC] mb-2">
                      Past Match Results
                    </h4>
                    {completedH2HMatches.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[#0f2133] border border-[#4C787E]/30 text-center text-xs text-gray-400">
                        No previous official meetings recorded yet. Fixtures played in current & future seasons will automatically record and persist here.
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs">
                        {completedH2HMatches.map((prevMatch, idx) => {
                          const isHomeRef = prevMatch.homeTeamId === match.homeTeamId;
                          const hG = prevMatch.homeScore || 0;
                          const aG = prevMatch.awayScore || 0;

                          let outcomeBadge = null;
                          if (hG === aG) {
                            outcomeBadge = (
                              <span className="text-[10px] text-amber-400 font-bold px-2 py-1 rounded-lg bg-amber-500/10">
                                Draw
                              </span>
                            );
                          } else if (isHomeRef ? hG > aG : aG > hG) {
                            outcomeBadge = (
                              <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded-lg bg-emerald-500/10">
                                {homeTeam?.shortName} Win
                              </span>
                            );
                          } else {
                            outcomeBadge = (
                              <span className="text-[10px] text-rose-400 font-bold px-2 py-1 rounded-lg bg-rose-500/10">
                                {awayTeam?.shortName} Win
                              </span>
                            );
                          }

                          return (
                            <div
                              key={`h2h-prev-match-${prevMatch.id}-${idx}`}
                              className="p-3 rounded-2xl bg-[#0f2133] border border-[#4C787E]/30 flex items-center justify-between"
                            >
                              <div>
                                <p className="font-bold text-white">
                                  {prevMatch.homeTeamId === match.homeTeamId ? homeTeam?.shortName : awayTeam?.shortName} {hG} - {aG} {prevMatch.awayTeamId === match.awayTeamId ? awayTeam?.shortName : homeTeam?.shortName}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  Week {prevMatch.week} • {prevMatch.venue || 'Official Match'}
                                </p>
                              </div>
                              {outcomeBadge}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* AUTO EVENT WIZARD POPUP MODAL */}
      {match && homeTeam && awayTeam && (
        <AutoEventWizardModal
          isOpen={isAutoWizardOpen}
          onClose={() => setIsAutoWizardOpen(false)}
          match={match}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          initialEventType={wizardEventType}
          currentMatchMinute={match.minute || eventMinute}
          onConfirmEvent={handleConfirmWizardEvent}
        />
      )}
    </AnimatePresence>
  );
};
