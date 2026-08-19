import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Play,
  Pause,
  CheckCircle2,
  RotateCcw,
  Zap,
  Clock,
  Activity,
  ShieldCheck,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Match, Team, MatchEvent, Player } from '../types';
import { TeamLogo } from './TeamLogos';
import { formatClockTime } from '../utils/formatClock';
import { saveMatchToFirestore } from '../lib/firestoreService';

interface LiveTelemetryConsoleProps {
  match: Match;
  teams: Team[];
  onUpdateFullMatch?: (matchId: string, updatedFields: Partial<Match>) => void;
  onSendPushNotification?: (title: string, message: string, teamId?: string) => void;
  onClose?: () => void;
}

// Self-contained ticking clock component (prevents whole-modal re-renders)
const LiveConsoleClock: React.FC<{ match: Match; halfDuration: number }> = ({ match, halfDuration }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (match.status === '1st_half' || match.status === '2nd_half' || match.isLive) {
      const timer = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [match.status, match.isLive, match.kickoffTime, match.kickoffTime2nd]);

  const displayTime = formatClockTime(
    match.minute || 0,
    match.matchSeconds,
    match.status === '2nd_half' ? (match.kickoffTime2nd || match.kickoffTime) : match.kickoffTime,
    match.status,
    halfDuration
  );

  return (
    <div className="flex items-center gap-2 bg-[#02050a] px-3.5 py-1.5 rounded-xl border border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
      <Clock className="w-5 h-5 text-emerald-400 animate-pulse" />
      <div className="flex flex-col items-center">
        <span className="text-[8px] font-black uppercase tracking-widest text-[#B7CEEC] font-mono">MATCH TIME</span>
        <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-emerald-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.6)]">
          {displayTime}
        </span>
      </div>
    </div>
  );
};

export const LiveTelemetryConsole: React.FC<LiveTelemetryConsoleProps> = ({
  match,
  teams,
  onUpdateFullMatch,
  onSendPushNotification,
  onClose,
}) => {
  const halfDuration = match.halfDurationMinutes || 20;

  // Selected event type & form state
  const [inlineEventType, setInlineEventType] = useState<
    'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'
  >('goal');
  const [inlineTeamId, setInlineTeamId] = useState<string>(match.homeTeamId);
  const [inlinePlayerName, setInlinePlayerName] = useState<string>('');
  const [inlineAssistPlayerName, setInlineAssistPlayerName] = useState<string>('');
  const [inlineSubOutPlayerName, setInlineSubOutPlayerName] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const homeTeam = teams.find((t) => t.id === match.homeTeamId);
  const awayTeam = teams.find((t) => t.id === match.awayTeamId);
  const activeTeam = teams.find((t) => t.id === inlineTeamId) || homeTeam;
  const activeRoster = activeTeam?.roster || [];

  // Auto-switch default event team when match prop changes
  useEffect(() => {
    setInlineTeamId(match.homeTeamId);
  }, [match.id]);

  // Toast feedback helper
  const triggerFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  // State Flow Machine Handlers
  const handleKickoff1st = () => {
    const kickoffEvt: MatchEvent = {
      id: `evt-kickoff-1st-${Date.now()}`,
      minute: 1,
      second: 0,
      type: 'kickoff',
      teamId: match.homeTeamId,
      player: 'Match Official',
      description: '🚀 KICKOFF! The referee blows the whistle to start the first half!',
      period: '1st_half',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [kickoffEvt, ...(match.events || [])];
    const update: Partial<Match> = {
      status: '1st_half',
      isLive: true,
      isFinished: false,
      minute: 1,
      matchSeconds: 0,
      kickoffTime: new Date().toISOString(),
      currentPeriod: '1st_half',
      events: updatedEvents,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, update);
    else saveMatchToFirestore(match.id, update);

    if (onSendPushNotification) {
      onSendPushNotification(
        '🚀 MATCH KICKOFF!',
        `${homeTeam?.name || 'Home'} vs ${awayTeam?.name || 'Away'} has officially kicked off!`,
        undefined
      );
    }
    triggerFeedback('🚀 1st Half Kickoff Started!');
  };

  const handleHalftime = () => {
    const htSec = halfDuration * 60;
    const htEvt: MatchEvent = {
      id: `evt-ht-${Date.now()}`,
      minute: halfDuration,
      second: htSec,
      type: 'halftime',
      teamId: match.homeTeamId,
      player: 'Match Official',
      description: `⏸️ HALFTIME! First half ends. (${match.homeScore} - ${match.awayScore})`,
      period: 'halftime',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [htEvt, ...(match.events || [])];
    const update: Partial<Match> = {
      status: 'halftime',
      isLive: false,
      isFinished: false,
      minute: halfDuration,
      matchSeconds: htSec,
      currentPeriod: 'halftime',
      events: updatedEvents,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, update);
    else saveMatchToFirestore(match.id, update);

    if (onSendPushNotification) {
      onSendPushNotification(
        '⏸️ HALFTIME PAUSE',
        `Halftime Score: ${homeTeam?.shortName} ${match.homeScore} - ${match.awayScore} ${awayTeam?.shortName}`,
        undefined
      );
    }
    triggerFeedback('⏸️ Halftime Pause Set!');
  };

  const handleKickoff2nd = () => {
    const start2ndMin = halfDuration + 1;
    const start2ndSec = halfDuration * 60;

    const kickoff2ndEvt: MatchEvent = {
      id: `evt-kickoff-2nd-${Date.now()}`,
      minute: start2ndMin,
      second: start2ndSec,
      type: 'kickoff',
      teamId: match.awayTeamId,
      player: 'Match Official',
      description: '▶️ SECOND HALF UNDERWAY! Teams return to the pitch for the final half!',
      period: '2nd_half',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [kickoff2ndEvt, ...(match.events || [])];
    const update: Partial<Match> = {
      status: '2nd_half',
      isLive: true,
      isFinished: false,
      minute: start2ndMin,
      matchSeconds: start2ndSec,
      kickoffTime2nd: new Date().toISOString(),
      currentPeriod: '2nd_half',
      events: updatedEvents,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, update);
    else saveMatchToFirestore(match.id, update);

    if (onSendPushNotification) {
      onSendPushNotification(
        '▶️ 2ND HALF KICKOFF',
        `Second half underway! Current score: ${match.homeScore} - ${match.awayScore}`,
        undefined
      );
    }
    triggerFeedback('▶️ 2nd Half Kickoff Started!');
  };

  const handleFullTime = () => {
    const ftMin = halfDuration * 2;
    const ftEvt: MatchEvent = {
      id: `evt-ft-${Date.now()}`,
      minute: ftMin,
      type: 'fulltime',
      teamId: match.homeTeamId,
      player: 'Match Official',
      description: `🏁 FULL TIME! Final Score: ${match.homeScore} - ${match.awayScore}`,
      period: 'fulltime',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [ftEvt, ...(match.events || [])];
    const update: Partial<Match> = {
      homeScore: match.homeScore,
      awayScore: match.awayScore,
      status: 'ended',
      isLive: false,
      isFinished: true,
      minute: ftMin,
      currentPeriod: 'fulltime',
      events: updatedEvents,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, update);
    else saveMatchToFirestore(match.id, update);

    if (onSendPushNotification) {
      onSendPushNotification(
        '🏁 FULL TIME FINAL RESULT',
        `Final Score: ${homeTeam?.name} ${match.homeScore} - ${match.awayScore} ${awayTeam?.name}`,
        undefined
      );
    }
    triggerFeedback('🏁 Full Time Concluded!');
  };

  const handleResetFixture = () => {
    if (!window.confirm(`🔄 RESET FIXTURE ${match.id}?\n\nThis will reset score to 0-0, set status to Scheduled, and clear all logged events.`)) return;

    const resetFields: Partial<Match> = {
      homeScore: 0,
      awayScore: 0,
      minute: 0,
      matchSeconds: 0,
      isLive: false,
      isFinished: false,
      status: 'scheduled',
      events: [],
      motmPlayerId: undefined,
      motmPlayerName: undefined,
      possessionHome: 50,
      possessionAway: 50,
      shotsHome: 0,
      shotsAway: 0,
      shotsOnTargetHome: 0,
      shotsOnTargetAway: 0,
      foulsHome: 0,
      foulsAway: 0,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, resetFields);
    else saveMatchToFirestore(match.id, resetFields);

    triggerFeedback('🔄 Fixture Reset cleanly to 0-0 Scheduled!');
  };

  // Event Logging Handler
  const handleLogEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlinePlayerName) {
      alert('Please select a roster player for this event!');
      return;
    }

    const isHome = inlineTeamId === match.homeTeamId;
    let newHomeScore = match.homeScore;
    let newAwayScore = match.awayScore;

    if (inlineEventType === 'goal') {
      if (isHome) newHomeScore += 1;
      else newAwayScore += 1;
    }

    const currentMin = Math.max(1, match.minute || 1);
    const newEvt: MatchEvent = {
      id: `evt-${Date.now()}`,
      minute: currentMin,
      type: inlineEventType,
      teamId: inlineTeamId,
      player: inlinePlayerName,
      assistPlayer: inlineAssistPlayerName || undefined,
      subOutPlayer: inlineSubOutPlayerName || undefined,
      description:
        inlineEventType === 'goal'
          ? `⚽ GOAL! ${inlinePlayerName} scores for ${activeTeam?.name}!${inlineAssistPlayerName ? ` (Assist: ${inlineAssistPlayerName})` : ''}`
          : inlineEventType === 'yellow_card'
          ? `🟨 YELLOW CARD issued to ${inlinePlayerName}.`
          : inlineEventType === 'red_card'
          ? `🟥 RED CARD! ${inlinePlayerName} sent off!`
          : inlineEventType === 'sub'
          ? `🔄 SUB: ${inlinePlayerName} enters pitch (Replacing ${inlineSubOutPlayerName || 'Teammate'}).`
          : `${inlineEventType.toUpperCase()} by ${inlinePlayerName}`,
      period: (match.status as any) || '1st_half',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedEvents = [newEvt, ...(match.events || [])];
    const updateData: Partial<Match> = {
      homeScore: newHomeScore,
      awayScore: newAwayScore,
      events: updatedEvents,
    };

    if (inlineEventType === 'shot_on_target') {
      if (isHome) updateData.shotsOnTargetHome = (match.shotsOnTargetHome || 0) + 1;
      else updateData.shotsOnTargetAway = (match.shotsOnTargetAway || 0) + 1;
    } else if (inlineEventType === 'foul') {
      if (isHome) updateData.foulsHome = (match.foulsHome || 0) + 1;
      else updateData.foulsAway = (match.foulsAway || 0) + 1;
    }

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, updateData);
    else saveMatchToFirestore(match.id, updateData);

    setInlinePlayerName('');
    setInlineAssistPlayerName('');
    setInlineSubOutPlayerName('');
    triggerFeedback(`✅ Logged ${inlineEventType.toUpperCase()} for ${inlinePlayerName}!`);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = (match.events || []).filter((evt) => evt.id !== eventId);
    const goalEvents = updatedEvents.filter((evt) => evt.type === 'goal');
    const calcHome = goalEvents.filter((evt) => evt.teamId === match.homeTeamId).length;
    const calcAway = goalEvents.filter((evt) => evt.teamId === match.awayTeamId).length;

    const update = {
      homeScore: calcHome,
      awayScore: calcAway,
      events: updatedEvents,
    };

    if (onUpdateFullMatch) onUpdateFullMatch(match.id, update);
    else saveMatchToFirestore(match.id, update);

    triggerFeedback('🗑️ Event deleted and scoreline re-calculated!');
  };

  return (
    <div className="space-y-4 p-4 sm:p-5 rounded-3xl bg-[#070d18] border-2 border-[#4C787E]/40 text-white shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Toast Feedback Banner */}
      {feedbackMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-extrabold text-xs text-center uppercase tracking-wider shadow-lg flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-emerald-400 animate-bounce" />
          <span>{feedbackMsg}</span>
        </motion.div>
      )}

      {/* HEADER: MATCH TITLE, STATUS, LIVE SCORE & CLOCK */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#030812] via-[#09182a] to-[#030812] border border-[#4C787E]/50 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping shadow-[0_0_12px_rgba(52,211,153,0.8)]" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block font-mono">
              STATUS: {match.status === '1st_half'
                ? '🔴 1ST HALF LIVE'
                : match.status === 'halftime'
                ? '⏸️ HALFTIME PAUSE'
                : match.status === '2nd_half'
                ? '🔴 2ND HALF LIVE'
                : match.status === 'ended' || match.isFinished
                ? '🏁 FULL TIME ENDED'
                : '⚪ UPCOMING / READY'}
            </span>
            <h3 className="font-black text-sm sm:text-base text-white tracking-wider uppercase">
              {homeTeam?.name} vs {awayTeam?.name}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3">
          {/* Score Badge */}
          <div className="flex items-center gap-3 bg-[#02050a] px-4 py-1.5 rounded-xl border border-teal-400/60 shadow-md">
            <TeamLogo teamId={match.homeTeamId} size={24} />
            <span className="text-xl sm:text-2xl font-black font-mono tracking-widest text-white">
              {match.homeScore} - {match.awayScore}
            </span>
            <TeamLogo teamId={match.awayTeamId} size={24} />
          </div>

          {/* Wall-Clock Ticking Time Badge */}
          <LiveConsoleClock match={match} halfDuration={halfDuration} />

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetFixture}
            className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/50 font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            title="Reset Fixture to 0-0 Scheduled"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* STATE MACHINE ACTION BUTTONS */}
      <div className="p-3.5 rounded-2xl bg-[#0b1422] border border-[#4C787E]/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            Match State Flow & Clock Control
          </span>
          <span className="text-[11px] text-gray-400">
            Half Duration: <strong className="text-white">{halfDuration} Mins</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          {/* 1. Kickoff 1st Half */}
          <button
            type="button"
            onClick={handleKickoff1st}
            disabled={match.status === '1st_half' || match.status === '2nd_half' || match.status === 'ended'}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              match.status === 'scheduled' || !match.status
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:brightness-110 ring-2 ring-emerald-400'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>1. Kickoff 1st Half</span>
          </button>

          {/* 2. Halftime Pause */}
          <button
            type="button"
            onClick={handleHalftime}
            disabled={match.status !== '1st_half'}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              match.status === '1st_half'
                ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 ring-2 ring-amber-300'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Pause className="w-4 h-4" />
            <span>2. Halftime Pause</span>
          </button>

          {/* 3. Kickoff 2nd Half */}
          <button
            type="button"
            onClick={handleKickoff2nd}
            disabled={match.status !== 'halftime'}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              match.status === 'halftime'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 hover:brightness-110 ring-2 ring-emerald-400'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>3. Kickoff 2nd Half</span>
          </button>

          {/* 4. Full Time End */}
          <button
            type="button"
            onClick={handleFullTime}
            disabled={match.status !== '2nd_half'}
            className={`py-2.5 px-3 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              match.status === '2nd_half'
                ? 'bg-rose-500 text-white hover:bg-rose-600 ring-2 ring-rose-400'
                : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>4. Full Time End</span>
          </button>
        </div>
      </div>

      {/* RECORD LIVE EVENT (INLINE CONSOLE) */}
      <form onSubmit={handleLogEvent} className="p-4 rounded-2xl bg-[#0b1422] border border-[#4C787E]/30 space-y-3">
        <div className="flex items-center justify-between border-b border-[#4C787E]/30 pb-2">
          <span className="text-xs font-black uppercase text-white flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
            RECORD LIVE EVENT (INLINE CONSOLE)
          </span>
        </div>

        {/* Event Type Category Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
          {[
            { type: 'goal', label: '⚽ Goal', color: 'bg-emerald-500/20 border-emerald-400 text-emerald-300' },
            { type: 'yellow_card', label: '🟨 Yellow Card', color: 'bg-yellow-500/20 border-yellow-400 text-yellow-300' },
            { type: 'red_card', label: '🟥 Red Card', color: 'bg-rose-500/20 border-rose-400 text-rose-300' },
            { type: 'sub', label: '🔄 Substitution', color: 'bg-sky-500/20 border-sky-400 text-sky-300' },
            { type: 'shot_on_target', label: '🎯 Shot on Target', color: 'bg-purple-500/20 border-purple-400 text-purple-300' },
            { type: 'foul', label: '⚠️ Foul / Free Kick', color: 'bg-orange-500/20 border-orange-400 text-orange-300' },
            { type: 'corner', label: '🚩 Corner Kick', color: 'bg-indigo-500/20 border-indigo-400 text-indigo-300' },
          ].map((item) => (
            <button
              key={`inline-btn-${item.type}`}
              type="button"
              onClick={() => {
                setInlineEventType(item.type as any);
                setInlinePlayerName('');
                setInlineAssistPlayerName('');
                setInlineSubOutPlayerName('');
              }}
              className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer shadow-md ${
                inlineEventType === item.type
                  ? `${item.color} ring-2 ring-emerald-400 font-extrabold scale-[1.02]`
                  : 'bg-[#060c16] border-[#4C787E]/30 text-gray-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Form Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* Select Team */}
          <div>
            <label className="text-[10px] font-black uppercase text-gray-300 block mb-1">1. Select Team</label>
            <select
              value={inlineTeamId}
              onChange={(e) => {
                setInlineTeamId(e.target.value);
                setInlinePlayerName('');
                setInlineAssistPlayerName('');
                setInlineSubOutPlayerName('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-[#060c16] border border-[#4C787E]/40 text-white font-bold text-xs focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              <option value={match.homeTeamId}>🌎 {homeTeam?.name} (Home Team)</option>
              <option value={match.awayTeamId}>✈️ {awayTeam?.name} (Away Team)</option>
            </select>
          </div>

          {/* Select Main Roster Player */}
          <div>
            <label className="text-[10px] font-black uppercase text-gray-300 block mb-1">
              2. Select Player ({activeTeam?.shortName} Roster)
            </label>
            <select
              value={inlinePlayerName}
              onChange={(e) => setInlinePlayerName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#060c16] border border-[#4C787E]/40 text-white font-bold text-xs focus:outline-none focus:border-teal-400 cursor-pointer"
            >
              <option value="">-- Choose Roster Player --</option>
              {activeRoster.map((p) => (
                <option key={p.id} value={p.name}>
                  #{p.number || '0'} {p.name} ({p.position}) {p.isCaptain ? '⭐ [C]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Optional Assist Provider (Goal Only) */}
          {inlineEventType === 'goal' && (
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-300 block mb-1">
                3. Assist Provider (Optional)
              </label>
              <select
                value={inlineAssistPlayerName}
                onChange={(e) => setInlineAssistPlayerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#060c16] border border-[#4C787E]/40 text-white font-bold text-xs focus:outline-none focus:border-teal-400 cursor-pointer"
              >
                <option value="">None / Solo Goal</option>
                {activeRoster
                  .filter((p) => p.name !== inlinePlayerName)
                  .map((p) => (
                    <option key={`ast-${p.id}`} value={p.name}>
                      #{p.number || '0'} {p.name} ({p.position})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Substitution Out Player */}
          {inlineEventType === 'sub' && (
            <div className="sm:col-span-2">
              <label className="text-[10px] font-black uppercase text-gray-300 block mb-1">
                Player Leaving Pitch (Replaced)
              </label>
              <select
                value={inlineSubOutPlayerName}
                onChange={(e) => setInlineSubOutPlayerName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#060c16] border border-[#4C787E]/40 text-white font-bold text-xs focus:outline-none focus:border-teal-400 cursor-pointer"
              >
                <option value="">-- Select Player Being Replaced --</option>
                {activeRoster
                  .filter((p) => p.name !== inlinePlayerName)
                  .map((p) => (
                    <option key={`subout-${p.id}`} value={p.name}>
                      #{p.number || '0'} {p.name} ({p.position})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Submit Event Button */}
        <button
          type="submit"
          className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4 text-slate-950" />
          <span>⚡ CONFIRM & LOG {inlineEventType.toUpperCase()}</span>
        </button>
      </form>

      {/* LOGGED MATCH EVENTS FEED */}
      <div className="p-4 rounded-2xl bg-[#0b1422] border border-[#4C787E]/30 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase text-amber-300 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" />
            RECORDED MATCH EVENTS LOG ({(match.events || []).length} RECORDED)
          </span>
        </div>

        {(!match.events || match.events.length === 0) ? (
          <p className="text-xs text-gray-400 py-3 text-center italic">
            No events recorded yet for this fixture. Use the controls above to log goals, cards, and match events!
          </p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {match.events.map((evt) => {
              const evtTeam = teams.find((t) => t.id === evt.teamId);
              return (
                <div
                  key={evt.id}
                  className="p-2.5 rounded-xl bg-[#050b14] border border-[#4C787E]/25 flex items-center justify-between text-xs gap-2 hover:border-[#4C787E]/60 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-[#0b1928] text-teal-300 font-mono font-bold text-[10px] border border-teal-500/30 shrink-0">
                      {evt.minute}'
                    </span>
                    {evtTeam && <TeamLogo teamId={evtTeam.id} size={20} />}
                    <span className="font-bold text-white truncate">{evt.description || evt.player}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(evt.id)}
                    className="p-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-500/40 transition-all cursor-pointer shrink-0"
                    title="Delete Event"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
