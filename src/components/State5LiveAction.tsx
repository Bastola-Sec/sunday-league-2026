import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Calendar, MapPin, Clock, ArrowRight, Zap, Radio, BellRing, AlertTriangle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Match, Team } from '../types';
import { TeamLogo } from './TeamLogos';
import { WeatherWidget } from './WeatherWidget';
import { TiltCard } from './TiltCard';

import { formatClockTime } from '../utils/formatClock';

interface State5LiveActionProps {
  matches: Match[];
  teams: Team[];
  onOpenMatchModal: (match: Match) => void;
  onSendPushNotification: (title: string, message: string, teamId?: string) => void;
  onNext?: () => void;
  onSelectTeam?: (team: Team) => void;
}

const LiveMatchClockBadge: React.FC<{ match: Match }> = ({ match }) => {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (match.status === '1st_half' || match.status === '2nd_half' || match.isLive) {
      const timer = setInterval(() => {
        setTick((t) => t + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [match.status, match.isLive, match.kickoffTime]);

  return (
    <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      ⏱ {formatClockTime(match.minute, match.matchSeconds, match.kickoffTime, match.status, match.halfDurationMinutes)}
    </span>
  );
};

export const State5LiveAction: React.FC<State5LiveActionProps> = ({
  matches,
  teams,
  onOpenMatchModal,
  onSendPushNotification,
  onNext,
  onSelectTeam,
}) => {
  const [simulatedNoLive, setSimulatedNoLive] = useState(false);
  const [fixtureFilter, setFixtureFilter] = useState<'league' | 'cups' | 'special' | 'past'>('league');

  // Helper to extract exact scheduled Kickoff Date
  const getKickoffDate = (m?: Match): Date | null => {
    if (!m) return null;

    // 1. Check if m.kickoffTime (ISO timestamp) exists
    if (m.kickoffTime) {
      const d = new Date(m.kickoffTime);
      if (!isNaN(d.getTime())) return d;
    }

    if (!m.startTime) return null;

    // 2. Try direct Date parsing
    const directDate = new Date(m.startTime);
    if (!isNaN(directDate.getTime())) return directDate;

    // 3. Parse formatted date string e.g. "Sun, Aug 16 • 8:30 AM" or "Aug 16 8:30 AM"
    const monthMatch = m.startTime.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})/i);
    const timeMatch = m.startTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);

    if (monthMatch && timeMatch) {
      const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
      const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase());
      const day = parseInt(monthMatch[2], 10);

      let hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;

      const targetDate = new Date();
      if (monthIndex !== -1) {
        targetDate.setMonth(monthIndex, day);
      }
      targetDate.setHours(hours, minutes, 0, 0);

      // If targetDate is in the past by > 30 days, assume next year
      if (targetDate.getTime() < Date.now() - 30 * 24 * 3600 * 1000) {
        targetDate.setFullYear(targetDate.getFullYear() + 1);
      }

      return targetDate;
    }

    return null;
  };

  // Sort matches chronologically strictly by Kickoff Date & Time, then Week Number
  const sortedMatches = [...matches].sort((a, b) => {
    const dateA = getKickoffDate(a);
    const dateB = getKickoffDate(b);
    if (dateA && dateB) {
      const diff = dateA.getTime() - dateB.getTime();
      if (diff !== 0) return diff;
    }

    const wA = a.weekNumber || 99;
    const wB = b.weekNumber || 99;
    if (wA !== wB) return wA - wB;
    return a.id.localeCompare(b.id);
  });

  const actualLiveMatches = sortedMatches.filter(
    (m) => m.isLive || m.status === '1st_half' || m.status === 'halftime' || m.status === '2nd_half'
  );
  const liveMatches = simulatedNoLive ? [] : actualLiveMatches;
  const upcomingMatches = sortedMatches.filter((m) => !m.isLive && !m.isFinished && m.status !== 'ended' && m.status !== '1st_half' && m.status !== 'halftime' && m.status !== '2nd_half');
  const finishedMatches = sortedMatches.filter((m) => m.isFinished || m.status === 'ended');
  const nextMatch = upcomingMatches[0] || sortedMatches[0];

  const getTeam = (id: string) => teams.find((t) => t.id === id);

  // Dynamically calculate remaining time to nextMatch scheduled kickoff
  const calculateTimeLeft = () => {
    if (!nextMatch) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    const targetDate = getKickoffDate(nextMatch);
    if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const diffMs = targetDate.getTime() - Date.now();
    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return { days, hours, minutes, seconds };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [, setLiveTick] = useState(0);

  // Tick live match clock second-by-second on screen for all viewers
  useEffect(() => {
    let timer: any;
    if (actualLiveMatches.length > 0) {
      timer = setInterval(() => {
        setLiveTick((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [actualLiveMatches.length]);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [nextMatch?.id, nextMatch?.startTime, nextMatch?.kickoffTime]);

  const nextKickoffDate = nextMatch ? getKickoffDate(nextMatch) : null;
  const isPastKickoffTime = nextKickoffDate ? Date.now() > nextKickoffDate.getTime() : false;
  const isTimeUp = isPastKickoffTime || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0);
  const isDelayed = isTimeUp && (!nextMatch || (!nextMatch.isLive && nextMatch.status !== '1st_half' && nextMatch.status !== '2nd_half'));

  // Smart Auto-Default Tab Selection: Automatically focus tab with active upcoming fixtures
  useEffect(() => {
    const leagueFixtures = upcomingMatches.filter(
      (m) => m.matchType === 'Regular' || !m.matchType || m.matchType === 'Regular Season'
    );
    const cupFixtures = upcomingMatches.filter(
      (m) =>
        m.matchType === 'League Cup' ||
        m.matchType === 'Super Cup Qualifier' ||
        m.matchType === 'Super Cup Final' ||
        m.matchType === 'Finals' ||
        m.id.includes('FIX-007') ||
        m.id.includes('FIX-008') ||
        m.id.includes('FIX-009') ||
        m.id.includes('FIX-SC')
    );
    const specialFixtures = upcomingMatches.filter(
      (m) => m.matchType === 'Special Event' || m.matchType === 'Exhibition' || m.matchType === 'Friendly'
    );

    if (leagueFixtures.length > 0) {
      setFixtureFilter('league');
    } else if (cupFixtures.length > 0) {
      setFixtureFilter('cups');
    } else if (specialFixtures.length > 0) {
      setFixtureFilter('special');
    } else if (finishedMatches.length > 0) {
      setFixtureFilter('past');
    }
  }, [matches.length, upcomingMatches.length, finishedMatches.length]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 sm:px-6 py-6 sm:py-8 relative z-10 select-none">
      {/* Top Header Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-1 flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#4C787E]/50 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <span className="live-dot-container">
          <span className="live-dot-ping" />
          <span className="live-dot-core" />
        </span>
        <span className="f1-header text-[11px] tracking-[0.2em] text-[#B7CEEC]">LIVE ACTION & FIXTURES</span>
      </motion.div>

      {/* Main Action Content Container */}
      <div className="w-full max-w-lg my-1 space-y-5">
        {/* LIVE MATCH CARD OR NEXT MATCH COUNTDOWN CARD */}
        {liveMatches.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs f1-header tracking-[0.2em] text-[#4C787E] flex items-center gap-2">
                <span className="live-dot-container">
                  <span className="live-dot-ping" />
                  <span className="live-dot-core" />
                </span>
                Live Match in Progress
              </span>
              <span className="text-[10px] f1-sub-header text-[#B7CEEC] bg-[#05080c] px-3 py-1 rounded-full border border-[#B7CEEC]/30">
                2nd Half
              </span>
            </div>

            {liveMatches.map((match, idx) => {
              const home = getTeam(match.homeTeamId);
              const away = getTeam(match.awayTeamId);

              return (
                <TiltCard
                  key={`live-match-${match.id}-${idx}`}
                  onClick={() => onOpenMatchModal(match)}
                  maxTilt={8}
                  scale={1.02}
                  glowColor="rgba(76, 120, 126, 0.35)"
                  className="p-5 rounded-3xl border border-[#B7CEEC]/30 bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl relative overflow-hidden cursor-pointer hover:border-[#4C787E] transition-all"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#4C787E]/15 rounded-full blur-3xl pointer-events-none" />

                  {/* Top Venue & Clock */}
                  <div className="flex items-center justify-between text-[11px] text-[#B7CEEC]/90 pb-3 border-b border-[#B7CEEC]/20 mb-4 gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-[#4C787E]" />
                      {match.venue}
                    </span>
                    <div className="flex items-center gap-2">
                      <WeatherWidget compact />
                      <span className="px-2.5 py-0.5 rounded-md bg-[#4C787E]/20 text-[#B7CEEC] font-extrabold border border-[#4C787E]/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4C787E] animate-ping" />
                        ⏱ {formatClockTime(match.minute, match.matchSeconds, match.kickoffTime, match.status, match.halfDurationMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Scoreboard & Center Minutes (Screenshot Layout) */}
                  <div className="grid grid-cols-7 items-center text-center">
                    {/* Home Team */}
                    <div
                      onClick={(e) => {
                        if (home && onSelectTeam) {
                          e.stopPropagation();
                          onSelectTeam(home);
                        }
                      }}
                      className="col-span-2 flex flex-col items-center hover:scale-105 transition-transform group cursor-pointer"
                    >
                      <TeamLogo teamId={match.homeTeamId} size={52} />
                      <p className="font-extrabold text-sm mt-2 text-white group-hover:text-[#B7CEEC] transition-colors">{home?.name}</p>
                      <span className="text-[10px] text-[#B7CEEC]/70 font-mono tracking-widest">{home?.shortName}</span>
                    </div>

                    {/* Big Scoreline & Live Minutes Subtitle (FlashScore Style) */}
                    <div className="col-span-3 flex flex-col items-center justify-center space-y-1">
                      <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                        {match.homeScore} - {match.awayScore}
                      </span>

                      <span className="text-xs font-mono font-extrabold uppercase tracking-wider">
                        {match.status === '1st_half' || match.status === '2nd_half' || match.isLive ? (
                          <LiveMatchClockBadge match={match} />
                        ) : match.status === 'halftime' ? (
                          <span className="text-amber-300 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30">
                            Halftime
                          </span>
                        ) : match.status === 'ended' || match.isFinished ? (
                          <span className="text-gray-300 bg-gray-500/10 px-3 py-0.5 rounded-full border border-gray-500/30">
                            Full Time
                          </span>
                        ) : (
                          <span className="text-gray-400">Scheduled</span>
                        )}
                      </span>
                    </div>

                    {/* Away Team */}
                    <div
                      onClick={(e) => {
                        if (away && onSelectTeam) {
                          e.stopPropagation();
                          onSelectTeam(away);
                        }
                      }}
                      className="col-span-2 flex flex-col items-center hover:scale-105 transition-transform group cursor-pointer"
                    >
                      <TeamLogo teamId={match.awayTeamId} size={52} />
                      <p className="font-extrabold text-sm mt-2 text-white group-hover:text-[#B7CEEC] transition-colors">{away?.name}</p>
                      <span className="text-[10px] text-[#B7CEEC]/70 font-mono tracking-widest">{away?.shortName}</span>
                    </div>
                  </div>

                  {/* Possession Gauge */}
                  <div className="mt-5 pt-3 border-t border-[#B7CEEC]/20">
                    <div className="flex justify-between text-[10px] font-bold text-[#B7CEEC]/80 mb-1 f1-sub-header">
                      <span>Possession: {match.possessionHome}%</span>
                      <span>{match.possessionAway}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#080d14] overflow-hidden flex border border-[#B7CEEC]/20">
                      <div
                        className="h-full bg-gradient-to-r from-[#4C787E] to-[#B7CEEC]"
                        style={{ width: `${match.possessionHome}%` }}
                      />
                      <div
                        className="h-full bg-[#507D87]"
                        style={{ width: `${match.possessionAway}%` }}
                      />
                    </div>
                  </div>

                  {/* OFFICIAL MATCH SUMMARY TIMELINE (FlashScore Style) */}
                  {match.events && match.events.length > 0 ? (
                    <div className="mt-4 pt-3 border-t border-[#B7CEEC]/20 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-[#B7CEEC]/70 px-2 pb-1 border-b border-white/5 f1-sub-header">
                        <span>Min</span>
                        <span className="text-[#4C787E]">Match Event Summary</span>
                        <span>Icon</span>
                      </div>

                      <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                        {/* Halftime indicator if halftime/2nd half */}
                        {(match.status === 'halftime' || match.status === '2nd_half' || match.status === 'ended') && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#080d14] border border-[#4C787E]/30 text-xs font-mono font-bold">
                            <span className="text-gray-400">HT Score</span>
                            <span className="text-amber-300">
                              {(() => {
                                const htHome = (match.events || []).filter(e => e.type === 'goal' && e.teamId === match.homeTeamId && (e.period === '1st_half' || e.minute <= (match.halfDurationMinutes || 20))).length;
                                const htAway = (match.events || []).filter(e => e.type === 'goal' && e.teamId === match.awayTeamId && (e.period === '1st_half' || e.minute <= (match.halfDurationMinutes || 20))).length;
                                return `${htHome} - ${htAway}`;
                              })()}
                            </span>
                          </div>
                        )}

                        {match.events.map((evt, eIdx) => {
                          const isHomeEvent = evt.teamId === match.homeTeamId;

                          // Handle administrative whistle events (Kickoff & Halftime)
                          if (evt.type === 'kickoff' || evt.type === 'halftime') {
                            const whistleLabel =
                              evt.type === 'kickoff'
                                ? evt.minute > 20
                                  ? '▶️ 2ND HALF KICKOFF'
                                  : '🚀 1ST HALF KICKOFF'
                                : '⏸️ HALFTIME WHISTLE';

                            return (
                              <div
                                key={`timeline-whistle-${evt.id}-${eIdx}`}
                                className="flex items-center justify-center gap-2 py-1 px-3 my-1 rounded-lg bg-[#08121e] border border-[#4C787E]/30 text-[10px] font-mono font-bold text-[#B7CEEC]"
                              >
                                <span>{whistleLabel}</span>
                                <span className="text-gray-400">({evt.minute}')</span>
                              </div>
                            );
                          }

                          // Determine event icon
                          const icon =
                            evt.type === 'goal' ? '⚽' :
                            evt.type === 'yellow_card' ? '🟨' :
                            evt.type === 'red_card' ? '🟥' :
                            evt.type === 'sub' ? '🔄' :
                            evt.type === 'shot_on_target' ? '🎯' :
                            evt.type === 'foul' ? '⚠️' :
                            evt.type === 'corner' ? '🚩' : '⚡';

                          // Determine clean display title (Player name or event category)
                          let displayTitle = evt.player;
                          if (!displayTitle || displayTitle === 'Match Official') {
                            if (evt.type === 'goal') displayTitle = '⚽ GOAL!';
                            else if (evt.type === 'yellow_card') displayTitle = '🟨 Yellow Card';
                            else if (evt.type === 'red_card') displayTitle = '🟥 Red Card';
                            else if (evt.type === 'sub') displayTitle = '🔄 Substitution';
                            else if (evt.type === 'shot_on_target') displayTitle = '🎯 Shot on Target';
                            else if (evt.type === 'foul') displayTitle = '⚠️ Foul';
                            else if (evt.type === 'corner') displayTitle = '🚩 Corner Kick';
                            else displayTitle = 'Match Event';
                          }

                          return (
                            <div
                              key={`timeline-evt-${evt.id}-${eIdx}`}
                              className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#080d14]/90 border border-white/5 text-xs transition-all hover:border-[#4C787E]/40"
                            >
                              {/* Left Minute Badge */}
                              <span className="font-mono text-gray-400 font-bold text-[11px] w-8">
                                {evt.minute}'
                              </span>

                              {/* Event Content Row (Home on Left, Away on Right) */}
                              <div className="flex-1 flex items-center justify-between px-2">
                                {isHomeEvent ? (
                                  <div className="flex items-center gap-1.5 text-left">
                                    <span className="text-sm">{icon}</span>
                                    <span className="font-bold text-white text-xs">{displayTitle}</span>
                                    {evt.type === 'goal' && (
                                      <span className="font-mono font-black text-emerald-400 text-xs ml-1">
                                        GOAL!
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="w-full" />
                                )}

                                {!isHomeEvent ? (
                                  <div className="flex items-center gap-1.5 text-right ml-auto">
                                    {evt.type === 'goal' && (
                                      <span className="font-mono font-black text-emerald-400 text-xs mr-1">
                                        GOAL!
                                      </span>
                                    )}
                                    <span className="font-bold text-white text-xs">{displayTitle}</span>
                                    <span className="text-sm">{icon}</span>
                                  </div>
                                ) : (
                                  <div className="w-full" />
                                )}
                              </div>
                            </div>
                          );
                        })}

                        {/* Fulltime indicator if match ended */}
                        {(match.status === 'ended' || match.isFinished) && (
                          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#080d14] border border-emerald-500/40 text-xs font-mono font-bold">
                            <span className="text-gray-400">FT</span>
                            <span className="text-emerald-400 font-black">
                              {match.homeScore} - {match.awayScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-3 rounded-xl bg-[#080d14]/90 border border-[#4C787E]/30 text-center text-xs text-gray-400">
                      <span>⚽ Match underway • Awaiting first goal or card...</span>
                    </div>
                  )}

                  {/* Action prompt */}
                  <div className="mt-4 pt-2 flex items-center justify-between text-xs text-[#B7CEEC] font-bold">
                    <span className="f1-sub-header text-[10px] tracking-widest">TAP FOR MATCH CENTER & TELEMETRY</span>
                    <ArrowRight className="w-4 h-4 text-[#4C787E]" />
                  </div>
                </TiltCard>
              );
            })}
          </div>
        ) : (
          /* NEXT MATCH COUNTDOWN SHOWCASE (when no live match) */
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <span className={`text-xs f1-header tracking-[0.18em] uppercase flex items-center gap-2 ${isDelayed ? 'text-red-400' : 'text-[#B7CEEC]'}`}>
                {isDelayed ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" />
                    KICKOFF TIME PASSED
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-[#4C787E]" />
                    Next Match Countdown
                  </>
                )}
              </span>

            </div>

            {nextMatch && (
              <TiltCard
                onClick={() => onOpenMatchModal(nextMatch)}
                maxTilt={8}
                scale={1.02}
                glowColor={isDelayed ? "rgba(239, 68, 68, 0.35)" : "rgba(76, 120, 126, 0.35)"}
                className={`p-5 rounded-3xl border bg-[#05080c]/90 backdrop-blur-2xl text-white shadow-2xl relative overflow-hidden cursor-pointer transition-all ${
                  isDelayed ? 'border-red-500/60 shadow-red-950/50' : 'border-[#B7CEEC]/30 hover:border-[#4C787E]'
                }`}
              >
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none ${isDelayed ? 'bg-red-500/15' : 'bg-[#4C787E]/15'}`} />

                {/* Venue & Kickoff */}
                <div className="flex items-center justify-between text-[11px] text-[#B7CEEC]/80 pb-3 border-b border-[#B7CEEC]/20 mb-4">
                  <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    <MapPin className="w-3.5 h-3.5 text-[#4C787E]" />
                    {nextMatch.venue}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-md font-bold border ${isDelayed ? 'bg-red-500/20 text-red-300 border-red-500/40' : 'bg-[#4C787E]/20 text-[#B7CEEC] border-[#4C787E]/40'}`}>
                    📅 {nextMatch.startTime}
                  </span>
                </div>

                {/* Teams Grid & Center Scoreline (FlashScore Style) */}
                <div className="grid grid-cols-7 items-center text-center my-2">
                  <div className="col-span-2 flex flex-col items-center">
                    <TeamLogo teamId={nextMatch.homeTeamId} size={52} />
                    <p className="font-extrabold text-sm mt-2 text-white">
                      {getTeam(nextMatch.homeTeamId)?.name}
                    </p>
                    <span className="text-[10px] text-[#B7CEEC]/70 font-mono tracking-widest">
                      {getTeam(nextMatch.homeTeamId)?.shortName}
                    </span>
                  </div>

                  <div className="col-span-3 flex flex-col items-center justify-center space-y-1">
                    {nextMatch.status === 'scheduled' && !nextMatch.isLive ? (
                      <>
                        <span className={`text-2xl font-black font-mono tracking-widest ${isDelayed ? 'text-red-400 animate-pulse' : 'text-[#4C787E]'}`}>
                          VS
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                          Upcoming
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl sm:text-4xl font-black font-mono tracking-widest text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                          {nextMatch.homeScore} - {nextMatch.awayScore}
                        </span>

                        <span className="text-xs font-mono font-extrabold uppercase tracking-wider">
                          {nextMatch.status === '1st_half' || nextMatch.status === '2nd_half' || nextMatch.isLive ? (
                            <span className="text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 px-3 py-0.5 rounded-full border border-emerald-500/40 shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              ⏱ {nextMatch.minute}'
                            </span>
                          ) : nextMatch.status === 'halftime' ? (
                            <span className="text-amber-300 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/30">
                              Halftime
                            </span>
                          ) : nextMatch.status === 'ended' || nextMatch.isFinished ? (
                            <span className="text-gray-300 bg-gray-500/10 px-3 py-0.5 rounded-full border border-gray-500/30">
                              Full Time
                            </span>
                          ) : (
                            <span className="text-gray-400">Scheduled</span>
                          )}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="col-span-2 flex flex-col items-center">
                    <TeamLogo teamId={nextMatch.awayTeamId} size={52} />
                    <p className="font-extrabold text-sm mt-2 text-white">
                      {getTeam(nextMatch.awayTeamId)?.name}
                    </p>
                    <span className="text-[10px] text-[#B7CEEC]/70 font-mono tracking-widest">
                      {getTeam(nextMatch.awayTeamId)?.shortName}
                    </span>
                  </div>
                </div>

                {/* COUNTDOWN OR BOLD RED DELAYED ALERT */}
                {isDelayed ? (
                  <div className="mt-5 pt-4 border-t border-red-500/30">
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-950/90 via-[#1a0507] to-red-950/90 border-2 border-red-500/80 text-center shadow-lg shadow-red-950/50 animate-pulse flex items-center justify-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
                      <span className="text-xl font-black uppercase tracking-widest text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] f1-header">
                        MATCH DELAYED
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 pt-4 border-t border-[#B7CEEC]/20 text-center">
                    <p className="text-[10px] uppercase font-extrabold text-[#B7CEEC]/70 f1-sub-header tracking-[0.2em] mb-2">
                      KICKOFF COUNTDOWN
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      <div className="p-2.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/30">
                        <span className="block text-xl font-black text-white font-mono">
                          {String(timeLeft.days).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-[#B7CEEC] font-bold uppercase f1-sub-header">Days</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/30">
                        <span className="block text-xl font-black text-white font-mono">
                          {String(timeLeft.hours).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-[#B7CEEC] font-bold uppercase f1-sub-header">Hours</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-[#080d14] border border-[#B7CEEC]/30">
                        <span className="block text-xl font-black text-white font-mono">
                          {String(timeLeft.minutes).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-[#B7CEEC] font-bold uppercase f1-sub-header">Mins</span>
                      </div>

                      <div className="p-2.5 rounded-2xl bg-[#080d14] border border-[#4C787E]">
                        <span className="block text-xl font-black text-[#4C787E] font-mono">
                          {String(timeLeft.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-[9px] text-[#4C787E] font-bold uppercase f1-sub-header">Secs</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action hint */}
                <div className="mt-4 pt-2 flex items-center justify-between text-xs text-[#B7CEEC] font-bold">
                  <span className="f1-sub-header text-[10px] tracking-widest">TAP FOR MATCH TELEMETRY & LINEUPS</span>
                  <ArrowRight className="w-4 h-4 text-[#4C787E]" />
                </div>
              </TiltCard>
            )}
          </div>
        )}

        {/* REDESIGNED FIXTURES & RESULTS SECTION */}
        {(() => {
          // Dynamic fixture sub-lists
          const leagueFixtures = upcomingMatches.filter(
            (m) => m.matchType === 'Regular' || !m.matchType || m.matchType === 'Regular Season'
          );
          const cupFixtures = upcomingMatches.filter(
            (m) =>
              m.matchType === 'League Cup' ||
              m.matchType === 'Super Cup Qualifier' ||
              m.matchType === 'Super Cup Final' ||
              m.matchType === 'Finals' ||
              m.id.includes('FIX-007') ||
              m.id.includes('FIX-008') ||
              m.id.includes('FIX-009') ||
              m.id.includes('FIX-SC')
          );
          const specialFixtures = upcomingMatches.filter(
            (m) => m.matchType === 'Special Event' || m.matchType === 'Exhibition' || m.matchType === 'Friendly'
          );

          const activeList =
            fixtureFilter === 'league'
              ? leagueFixtures
              : fixtureFilter === 'cups'
              ? cupFixtures
              : fixtureFilter === 'special'
              ? specialFixtures
              : finishedMatches;

          return (
            <div>
              {/* Header Title */}
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs f1-header tracking-[0.18em] text-[#B7CEEC] uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#4C787E]" />
                  {fixtureFilter === 'past' ? 'Past Matches & Results' : 'Upcoming Fixtures'}
                </span>
                <span className="text-[10px] f1-sub-header text-[#B7CEEC]/60">
                  {activeList.length} {fixtureFilter === 'past' ? 'Results Saved' : 'Scheduled'}
                </span>
              </div>

              {/* 4-CATEGORY TOGGLE FILTER BAR */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-[#080d15] border border-white/10 text-xs mb-3">
                <button
                  type="button"
                  onClick={() => setFixtureFilter('league')}
                  className={`py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    fixtureFilter === 'league'
                      ? 'bg-[#4C787E] text-white shadow-md border border-[#B7CEEC]/40 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⚽ League</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFixtureFilter('cups')}
                  className={`py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    fixtureFilter === 'cups'
                      ? 'bg-[#4C787E] text-white shadow-md border border-[#B7CEEC]/40 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>🏆 Cups</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFixtureFilter('special')}
                  className={`py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    fixtureFilter === 'special'
                      ? 'bg-[#4C787E] text-white shadow-md border border-[#B7CEEC]/40 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>⭐ Special</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFixtureFilter('past')}
                  className={`py-1.5 rounded-xl font-bold text-[10px] sm:text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    fixtureFilter === 'past'
                      ? 'bg-emerald-600 text-white shadow-md border border-emerald-300/40 font-black'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>✅ Past</span>
                </button>
              </div>

              {/* RENDER ACTIVE FIXTURES OR PAST MATCHES */}
              {activeList.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#05080c]/80 border border-white/10 text-center text-xs text-gray-400 font-mono space-y-1">
                  <p className="font-extrabold text-white text-sm">
                    {fixtureFilter === 'special'
                      ? 'No Special Events Scheduled'
                      : fixtureFilter === 'cups'
                      ? 'No Cup Fixtures Pending'
                      : fixtureFilter === 'past'
                      ? 'No Completed Matches Yet'
                      : 'No Upcoming League Fixtures'}
                  </p>
                  <p className="text-[10px] text-[#B7CEEC]/60">
                    {fixtureFilter === 'special'
                      ? 'Special event exhibition matches will be posted here when announced.'
                      : 'Check back after official match telemetry is recorded.'}
                  </p>
                </div>
              ) : fixtureFilter !== 'past' ? (
                /* UPCOMING FIXTURES CARDS */
                <div className="space-y-3">
                  {activeList.map((match, idx) => {
                    const home = getTeam(match.homeTeamId);
                    const away = getTeam(match.awayTeamId);

                    return (
                      <TiltCard
                        key={`upcoming-match-${match.id}-${idx}`}
                        onClick={() => onOpenMatchModal(match)}
                        maxTilt={6}
                        scale={1.02}
                        glowColor="rgba(183, 206, 236, 0.25)"
                        className="p-4 rounded-2xl border border-[#B7CEEC]/25 bg-[#05080c]/80 backdrop-blur-xl text-white shadow-lg cursor-pointer flex items-center justify-between hover:border-[#4C787E] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center -space-x-2">
                            <TeamLogo teamId={match.homeTeamId} size={36} />
                            <TeamLogo teamId={match.awayTeamId} size={36} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-extrabold text-xs sm:text-sm text-white font-mono">
                                {home?.name || match.homeTeamId} vs {away?.name || match.awayTeamId}
                              </p>
                              {match.weekNumber && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#4C787E]/30 text-[#B7CEEC] border border-[#4C787E]/40 uppercase">
                                  W{match.weekNumber} {match.matchType || 'Regular'}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#B7CEEC]/70 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-[#4C787E]" />
                              {match.startTime} • {match.venue}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="px-3 py-1.5 rounded-xl bg-[#080d14] text-[10px] f1-sub-header text-[#B7CEEC] hover:text-white border border-[#B7CEEC]/30 shadow-md flex items-center gap-1.5 cursor-pointer hover:border-[#4C787E] transition-all">
                            <span>Match Center & Lineups</span>
                            <ArrowRight className="w-3 h-3 text-[#4C787E]" />
                          </span>
                        </div>
                      </TiltCard>
                    );
                  })}
                </div>
              ) : (
                /* PAST MATCHES RESULTS CARDS */
                <div className="space-y-3">
                  {finishedMatches.map((match, idx) => {
                    const home = getTeam(match.homeTeamId);
                    const away = getTeam(match.awayTeamId);

                    return (
                      <TiltCard
                        key={`finished-match-${match.id}-${idx}`}
                        onClick={() => onOpenMatchModal(match)}
                        maxTilt={6}
                        scale={1.02}
                        glowColor="rgba(52, 211, 153, 0.25)"
                        className="p-4 rounded-2xl border border-emerald-500/30 bg-[#05080c]/90 backdrop-blur-xl text-white shadow-xl cursor-pointer hover:border-emerald-400 transition-all space-y-3"
                      >
                        {/* Header: Scoreline & FT Pill */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono font-black text-[10px] border border-emerald-500/40">
                              FT RESULT
                            </span>
                            <span className="text-[11px] text-gray-400 font-mono">
                              Week {match.weekNumber || 1} • {match.venue}
                            </span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                            Tap for Match Center <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Scoreline Grid (FlashScore Style) */}
                        <div className="grid grid-cols-7 items-center text-center py-1">
                          <div className="col-span-2 flex flex-col items-center">
                            <TeamLogo teamId={match.homeTeamId} size={40} />
                            <p className="font-extrabold text-xs mt-1 text-white">{home?.name}</p>
                          </div>

                          <div className="col-span-3 flex flex-col items-center justify-center space-y-0.5">
                            <span className="text-2xl font-black font-mono tracking-widest text-emerald-400">
                              {match.homeScore} - {match.awayScore}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider">
                              Full Time (FT)
                            </span>
                          </div>

                          <div className="col-span-2 flex flex-col items-center">
                            <TeamLogo teamId={match.awayTeamId} size={40} />
                            <p className="font-extrabold text-xs mt-1 text-white">{away?.name}</p>
                          </div>
                        </div>

                        {/* Timeline Summary Table (FlashScore Style) */}
                        {(() => {
                          const keyMatchEvents = (match.events || []).filter(
                            (e) => e.type === 'goal' || e.type === 'yellow_card' || e.type === 'red_card' || e.type === 'sub'
                          );

                          if (keyMatchEvents.length === 0) {
                            return (
                              <div className="pt-2 border-t border-white/5 text-center text-[10px] text-gray-500 italic">
                                No goals, cards, or substitutions recorded in match timeline
                              </div>
                            );
                          }

                          return (
                            <div className="pt-2 border-t border-white/5 space-y-1">
                              {keyMatchEvents.map((evt, eIdx) => {
                                const isHomeEvent = evt.teamId === match.homeTeamId;
                                const isTeamNameLabel = evt.player === home?.name || evt.player === away?.name;
                                const icon =
                                  evt.type === 'goal'
                                    ? '⚽'
                                    : evt.type === 'yellow_card'
                                    ? '🟨'
                                    : evt.type === 'red_card'
                                    ? '🟥'
                                    : evt.type === 'sub'
                                    ? '🔄'
                                    : '⚡';

                                const displayLabel = isTeamNameLabel
                                  ? evt.description || evt.player
                                  : evt.player;

                                return (
                                  <div key={eIdx} className="flex items-center text-[11px] py-0.5">
                                    {isHomeEvent ? (
                                      <div className="flex items-center gap-1.5 text-left flex-1">
                                        <span className="font-bold text-gray-400 text-[10px]">{evt.minute}'</span>
                                        <span className="text-sm">{icon}</span>
                                        <span className="font-bold text-white text-xs">{displayLabel}</span>
                                        {evt.type === 'goal' && displayLabel !== 'GOAL!' && (
                                          <span className="font-mono font-black text-emerald-400 text-xs ml-1">
                                            GOAL!
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="flex-1" />
                                    )}

                                    {!isHomeEvent ? (
                                      <div className="flex items-center gap-1.5 text-right flex-1 justify-end">
                                        {evt.type === 'goal' && displayLabel !== 'GOAL!' && (
                                          <span className="font-mono font-black text-emerald-400 text-xs mr-1">
                                            GOAL!
                                          </span>
                                        )}
                                        <span className="font-bold text-white text-xs">{displayLabel}</span>
                                        <span className="text-sm">{icon}</span>
                                        <span className="font-bold text-gray-400 text-[10px]">{evt.minute}'</span>
                                      </div>
                                    ) : (
                                      <div className="flex-1" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </TiltCard>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* Footer Info & Scroll Prompt */}
      <div className="mt-6 flex flex-col items-center gap-3 text-center">
        {onNext && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="cursor-pointer group flex flex-col items-center gap-1.5"
            onClick={onNext}
          >
            <p className="text-[10px] f1-header tracking-[0.2em] text-[#B7CEEC] group-hover:text-white transition-colors">
              SCROLL TO MATCH VENUE
            </p>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="p-2 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/80 text-[#B7CEEC] backdrop-blur-md group-hover:border-[#4C787E] group-hover:text-[#4C787E] transition-all"
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.div>
        )}
        <p className="text-[10px] text-[#B7CEEC]/60 font-mono">
          SUNDAY LEAGUE (EST: 2026) • OFFICIAL MATCH TELEMETRY & LIVE CENTER
        </p>
      </div>
    </div>
  );
};
