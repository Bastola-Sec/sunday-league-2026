import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  BarChart3,
  TrendingUp,
  Zap,
  Award,
  Calendar,
  MapPin,
  Clock,
  Shield,
  Activity,
  User,
  AlertCircle,
  PieChart,
  CheckCircle2,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { Match, Team, MatchEvent } from '../types';
import { TeamLogo } from './TeamLogos';

interface CompletedMatchAnalyticsProps {
  match: Match;
  homeTeam?: Team;
  awayTeam?: Team;
}

export const CompletedMatchAnalytics: React.FC<CompletedMatchAnalyticsProps> = ({
  match,
  homeTeam,
  awayTeam,
}) => {
  const [hoveredEvent, setHoveredEvent] = useState<MatchEvent | null>(null);
  const [selectedStatFilter, setSelectedStatFilter] = useState<'all' | 'goals' | 'cards' | 'momentum'>('all');

  const isMatchFinished = match.isFinished || match.status === 'ended';
  const isMatchLive = match.isLive || match.status === '1st_half' || match.status === '2nd_half' || match.status === 'halftime';

  // Derive stats from live events
  const events = match.events || [];
  const goalEvents = events.filter((e) => e.type === 'goal');
  const homeGoals = goalEvents.filter((e) => e.teamId === match.homeTeamId);
  const awayGoals = goalEvents.filter((e) => e.teamId === match.awayTeamId);

  const yellowEvents = events.filter((e) => e.type === 'yellow_card');
  const redEvents = events.filter((e) => e.type === 'red_card');
  const foulEvents = events.filter((e) => e.type === 'foul');
  const shotEvents = events.filter((e) => e.type === 'shot_on_target');
  const cornerEvents = events.filter((e) => e.type === 'corner');

  const homeYellows = yellowEvents.filter((e) => e.teamId === match.homeTeamId).length;
  const awayYellows = yellowEvents.filter((e) => e.teamId === match.awayTeamId).length;
  const homeReds = redEvents.filter((e) => e.teamId === match.homeTeamId).length;
  const awayReds = redEvents.filter((e) => e.teamId === match.awayTeamId).length;

  const homeFouls = match.foulsHome !== undefined && match.foulsHome > 0
    ? match.foulsHome
    : foulEvents.filter((e) => e.teamId === match.homeTeamId).length;
  const awayFouls = match.foulsAway !== undefined && match.foulsAway > 0
    ? match.foulsAway
    : foulEvents.filter((e) => e.teamId === match.awayTeamId).length;

  const homeCorners = cornerEvents.filter((e) => e.teamId === match.homeTeamId).length;
  const awayCorners = cornerEvents.filter((e) => e.teamId === match.awayTeamId).length;

  // Shots calculation strictly synced with live telemetry entry
  const homeShotsOnTargetEvents = homeGoals.length + shotEvents.filter((e) => e.teamId === match.homeTeamId).length;
  const awayShotsOnTargetEvents = awayGoals.length + shotEvents.filter((e) => e.teamId === match.awayTeamId).length;

  const homeShotsOnTarget = (match.shotsOnTargetHome !== undefined && match.shotsOnTargetHome > 0)
    ? match.shotsOnTargetHome
    : homeShotsOnTargetEvents;

  const awayShotsOnTarget = (match.shotsOnTargetAway !== undefined && match.shotsOnTargetAway > 0)
    ? match.shotsOnTargetAway
    : awayShotsOnTargetEvents;

  const homeShots = (match.shotsHome !== undefined && match.shotsHome > 0)
    ? match.shotsHome
    : homeShotsOnTarget;

  const awayShots = (match.shotsAway !== undefined && match.shotsAway > 0)
    ? match.shotsAway
    : awayShotsOnTarget;

  // Possession
  const possessionHome = (match.possessionHome !== undefined && match.possessionHome > 0)
    ? match.possessionHome
    : 50;
  const possessionAway = (match.possessionAway !== undefined && match.possessionAway > 0)
    ? match.possessionAway
    : (100 - possessionHome);

  // Determine Match Winner
  const isDraw = match.homeScore === match.awayScore;
  const homeWon = match.homeScore > match.awayScore;
  const winningTeam = isDraw ? null : homeWon ? homeTeam : awayTeam;

  // Conversion rates
  const homeConversion = homeShotsOnTarget > 0 ? Math.round((match.homeScore / homeShotsOnTarget) * 100) : 0;
  const awayConversion = awayShotsOnTarget > 0 ? Math.round((match.awayScore / awayShotsOnTarget) * 100) : 0;

  // Compute 10-minute interval momentum data points (0', 10', 20', 30', 40', 50', 60', 70', 80', 90')
  const timeBuckets = [10, 20, 30, 40, 50, 60, 70, 80, 90];
  const momentumData = timeBuckets.map((bucketMinute) => {
    const windowEvents = events.filter(
      (e) => (e.minute || 0) > bucketMinute - 10 && (e.minute || 0) <= bucketMinute
    );

    let homeVal = 30; // base momentum
    let awayVal = 30;

    windowEvents.forEach((e) => {
      const isHomeEvt = e.teamId === match.homeTeamId;
      let weight = 0;
      if (e.type === 'goal') weight = 40;
      else if (e.type === 'shot_on_target') weight = 20;
      else if (e.type === 'corner') weight = 10;
      else if (e.type === 'yellow_card') weight = -10;
      else if (e.type === 'red_card') weight = -35;

      if (isHomeEvt) homeVal += weight;
      else awayVal += weight;
    });

    return {
      minute: bucketMinute,
      home: Math.min(Math.max(homeVal, 5), 95),
      away: Math.min(Math.max(awayVal, 5), 95),
    };
  });

  // SVG dimensions for Momentum Chart
  const svgWidth = 500;
  const svgHeight = 160;
  const paddingX = 40;
  const paddingY = 20;

  const getX = (minute: number) => paddingX + ((minute - 10) / 80) * (svgWidth - paddingX * 2);
  const getY = (val: number) => svgHeight - paddingY - (val / 100) * (svgHeight - paddingY * 2);

  const homePathD = momentumData.reduce((acc, pt, idx) => {
    const x = getX(pt.minute);
    const y = getY(pt.home);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  const homeAreaD = `${homePathD} L ${getX(90)} ${svgHeight - paddingY} L ${getX(10)} ${svgHeight - paddingY} Z`;

  const awayPathD = momentumData.reduce((acc, pt, idx) => {
    const x = getX(pt.minute);
    const y = getY(pt.away);
    return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
  }, '');

  return (
    <div className="space-y-5 select-none">
      {/* 1. MATCH HEADER & SCORE BANNER */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-[#0c1a29] via-[#09131f] to-[#04080e] border border-[#4C787E]/50 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[#4C787E]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between text-xs mb-3 text-[#B7CEEC]">
          <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-gray-400">
            <MapPin className="w-3.5 h-3.5 text-[#4C787E]" />
            {match.venue}
          </span>
          {isMatchFinished ? (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/40 flex items-center gap-1.5 text-[11px] uppercase tracking-widest shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              FULL TIME
            </span>
          ) : isMatchLive ? (
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 font-extrabold border border-red-500/40 flex items-center gap-1.5 text-[11px] uppercase tracking-widest shadow-md animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              LIVE • {match.status === 'halftime' ? 'HALFTIME' : `${match.minute || 0}'`}
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-[#4C787E]/20 text-[#B7CEEC] font-extrabold border border-[#4C787E]/40 flex items-center gap-1.5 text-[11px] uppercase tracking-widest shadow-md">
              <Clock className="w-3.5 h-3.5 text-[#4C787E]" />
              AWAITING KICKOFF
            </span>
          )}
        </div>

        {/* Teams and Score */}
        <div className="grid grid-cols-7 items-center text-center my-3 relative z-10">
          {/* Home Team */}
          <div className="col-span-3 flex flex-col items-center">
            <TeamLogo teamId={match.homeTeamId} size={56} />
            <p className="font-extrabold text-sm sm:text-base text-white mt-2 leading-tight">
              {homeTeam?.name}
            </p>
            <span className="text-[10px] text-[#B7CEEC]/80 font-mono font-bold tracking-widest mt-0.5">
              {homeTeam?.shortName}
            </span>
          </div>

          {/* Score Display */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="px-4 py-2 rounded-2xl bg-[#05090f] border-2 border-[#4C787E] text-2xl sm:text-3xl font-black text-amber-300 shadow-2xl font-mono tracking-wider">
              {match.homeScore} - {match.awayScore}
            </div>
            {isMatchFinished ? (
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest mt-1.5 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" />
                FINAL
              </span>
            ) : isMatchLive ? (
              <span className="text-[10px] font-black uppercase text-red-400 tracking-widest mt-1.5 flex items-center gap-1 animate-pulse">
                <Zap className="w-3 h-3 text-red-400" />
                LIVE
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase text-[#B7CEEC] tracking-widest mt-1.5 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#4C787E]" />
                SCHEDULED
              </span>
            )}
          </div>

          {/* Away Team */}
          <div className="col-span-3 flex flex-col items-center">
            <TeamLogo teamId={match.awayTeamId} size={56} />
            <p className="font-extrabold text-sm sm:text-base text-white mt-2 leading-tight">
              {awayTeam?.name}
            </p>
            <span className="text-[10px] text-[#B7CEEC]/80 font-mono font-bold tracking-widest mt-0.5">
              {awayTeam?.shortName}
            </span>
          </div>
        </div>

        {/* Goal Scorers Breakdown Bar */}
        <div className="mt-4 pt-3 border-t border-[#4C787E]/30 grid grid-cols-2 gap-3 text-xs">
          {/* Home Scorers */}
          <div className="space-y-1 text-left">
            {homeGoals.length > 0 ? (
              homeGoals.map((g, idx) => (
                <div key={`hg-${g.id || idx}-${idx}`} className="flex items-center gap-1.5 text-emerald-300 font-semibold text-[11px]">
                  <span className="shrink-0">⚽</span>
                  <span className="text-white font-bold">{g.player}</span>
                  <span className="text-gray-400 font-mono text-[10px]">({g.minute}')</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-gray-500 italic">No goals scored</span>
            )}
          </div>

          {/* Away Scorers */}
          <div className="space-y-1 text-right">
            {awayGoals.length > 0 ? (
              awayGoals.map((g, idx) => (
                <div key={`ag-${g.id || idx}-${idx}`} className="flex items-center justify-end gap-1.5 text-emerald-300 font-semibold text-[11px]">
                  <span className="text-gray-400 font-mono text-[10px]">({g.minute}')</span>
                  <span className="text-white font-bold">{g.player}</span>
                  <span className="shrink-0">⚽</span>
                </div>
              ))
            ) : (
              <span className="text-[11px] text-gray-500 italic">No goals scored</span>
            )}
          </div>
        </div>


      </div>

      {/* 2. MATCH MOMENTUM & EVENT TIMELINE GRAPH */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#09131e] border border-[#4C787E]/40 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-[#4C787E]/30 pb-3">
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Live Event Momentum & Match Graph</span>
            </h4>
            <p className="text-[11px] text-[#B7CEEC]/80 font-medium">
              Real-time attack pressure curve calculated directly from logged events (0' to 90').
            </p>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5 text-[#4C787E]">
              <span className="w-3 h-1 bg-[#4C787E] rounded-full" />
              {homeTeam?.shortName} Pressure
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-3 h-1 bg-amber-400 rounded-full" />
              {awayTeam?.shortName} Pressure
            </span>
          </div>
        </div>

        {/* Interactive SVG Momentum Graph */}
        <div className="relative bg-[#050a12] p-2 rounded-2xl border border-[#4C787E]/20 overflow-hidden">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-40 overflow-visible">
            {/* Grid Lines */}
            {[25, 50, 75].map((val) => (
              <line
                key={`grid-${val}`}
                x1={paddingX}
                y1={getY(val)}
                x2={svgWidth - paddingX}
                y2={getY(val)}
                stroke="rgba(183, 206, 236, 0.08)"
                strokeDasharray="4 4"
              />
            ))}

            {/* Home Team Area fill */}
            <path d={homeAreaD} fill="rgba(76, 120, 126, 0.25)" />

            {/* Home Team Pressure Line */}
            <path d={homePathD} fill="none" stroke="#4C787E" strokeWidth="3" strokeLinecap="round" />

            {/* Away Team Pressure Line */}
            <path d={awayPathD} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeDasharray="3 3" />

            {/* Plot Events directly on the Graph X-Axis */}
            {events.map((evt, idx) => {
              if (!evt.minute) return null;
              const xPos = getX(evt.minute);
              const isHomeEvt = evt.teamId === match.homeTeamId;
              const yPos = isHomeEvt ? getY(65) : getY(35);

              let iconSymbol = '📍';
              let badgeColor = 'bg-blue-500';
              if (evt.type === 'goal') {
                iconSymbol = '⚽';
                badgeColor = 'bg-emerald-500 text-slate-950 font-black';
              } else if (evt.type === 'yellow_card') {
                iconSymbol = '🟨';
                badgeColor = 'bg-amber-400';
              } else if (evt.type === 'red_card') {
                iconSymbol = '🟥';
                badgeColor = 'bg-rose-500';
              } else if (evt.type === 'shot_on_target') {
                iconSymbol = '🎯';
                badgeColor = 'bg-[#4C787E]';
              }

              return (
                <g key={`graph-evt-${evt.id || idx}-${idx}`} className="cursor-pointer group" onMouseEnter={() => setHoveredEvent(evt)} onMouseLeave={() => setHoveredEvent(null)}>
                  {/* Vertical event drop line */}
                  <line x1={xPos} y1={paddingY} x2={xPos} y2={svgHeight - paddingY} stroke="rgba(255, 255, 255, 0.2)" strokeDasharray="2 2" />
                  <circle cx={xPos} cy={yPos} r="10" fill={isHomeEvt ? '#0d2238' : '#291e0a'} stroke={isHomeEvt ? '#4C787E' : '#fbbf24'} strokeWidth="2" />
                  <text x={xPos} y={yPos + 3.5} textAnchor="middle" fontSize="10" className="pointer-events-none select-none">
                    {iconSymbol}
                  </text>
                </g>
              );
            })}

            {/* Time Markers */}
            {[10, 30, 45, 60, 75, 90].map((m) => (
              <text key={`time-${m}`} x={getX(m)} y={svgHeight - 4} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="bold" fontFamily="monospace">
                {m}'
              </text>
            ))}
          </svg>

          {/* Hovered Event Tooltip */}
          {hoveredEvent && (
            <div className="mt-2 p-2.5 rounded-xl bg-[#0f2133] border border-amber-400/50 text-xs text-white flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[10px]">
                  {hoveredEvent.minute}'
                </span>
                <p className="font-semibold text-[11px] text-gray-200">{hoveredEvent.description}</p>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">{hoveredEvent.player}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. EVENT-BASED STATS COMPARISON BARS */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#09131e] border border-[#4C787E]/40 space-y-4">
        <h4 className="text-xs font-black uppercase tracking-wider text-[#B7CEEC] flex items-center gap-2 border-b border-[#4C787E]/30 pb-2">
          <BarChart3 className="w-4 h-4 text-[#4C787E]" />
          <span>Match Event & Performance Stats</span>
        </h4>

        <div className="space-y-3 text-xs">
          {/* Goals Comparison */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white mb-1.5">
              <span className="text-amber-300 font-mono text-sm">{match.homeScore}</span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Goals Scored</span>
              <span className="text-amber-300 font-mono text-sm">{match.awayScore}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0d1c2c] overflow-hidden flex">
              <div
                className="h-full bg-gradient-to-r from-[#4C787E] to-[#B7CEEC]"
                style={{ width: `${(match.homeScore / (match.homeScore + match.awayScore || 1)) * 100}%` }}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(match.awayScore / (match.homeScore + match.awayScore || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Shots & Shots on Target */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white mb-1.5">
              <span className="font-mono text-sm">{homeShotsOnTarget} / {homeShots}</span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Shots On Target / Total</span>
              <span className="font-mono text-sm">{awayShotsOnTarget} / {awayShots}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0d1c2c] overflow-hidden flex">
              <div
                className="h-full bg-[#4C787E]"
                style={{ width: `${(homeShots / (homeShots + awayShots || 1)) * 100}%` }}
              />
              <div
                className="h-full bg-amber-400/80"
                style={{ width: `${(awayShots / (homeShots + awayShots || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Corner Kicks */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white mb-1.5">
              <span className="font-mono text-sm">{homeCorners}</span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Corner Kicks</span>
              <span className="font-mono text-sm">{awayCorners}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0d1c2c] overflow-hidden flex">
              <div
                className="h-full bg-[#4C787E]"
                style={{ width: `${(homeCorners / (homeCorners + awayCorners || 1)) * 100}%` }}
              />
              <div
                className="h-full bg-amber-400"
                style={{ width: `${(awayCorners / (homeCorners + awayCorners || 1)) * 100}%` }}
              />
            </div>
          </div>

          {/* Possession Split */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white mb-1.5">
              <span className="font-mono text-sm">{possessionHome}%</span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Possession %</span>
              <span className="font-mono text-sm">{possessionAway}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#0d1c2c] overflow-hidden flex">
              <div
                className="h-full bg-[#4C787E]"
                style={{ width: `${possessionHome}%` }}
              />
              <div
                className="h-full bg-[#3d6368]"
                style={{ width: `${possessionAway}%` }}
              />
            </div>
          </div>

          {/* Cards & Discipline */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white mb-1.5">
              <span className="font-mono text-xs flex items-center gap-1 text-amber-300">
                🟨 {homeYellows} | 🟥 {homeReds}
              </span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Discipline Cards</span>
              <span className="font-mono text-xs flex items-center gap-1 text-amber-300">
                🟨 {awayYellows} | 🟥 {awayReds}
              </span>
            </div>
          </div>

          {/* Fouls Committed */}
          <div className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20">
            <div className="flex justify-between font-extrabold text-white">
              <span className="font-mono text-sm">{homeFouls}</span>
              <span className="text-[#B7CEEC] font-bold text-[11px] uppercase tracking-wider">Fouls Committed</span>
              <span className="font-mono text-sm">{awayFouls}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHRONOLOGICAL MATCH EVENT HIGHLIGHTS FEED */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#09131e] border border-[#4C787E]/40 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2 border-b border-[#4C787E]/30 pb-2">
          <Activity className="w-4 h-4 text-[#4C787E]" />
          <span>Full Match Event Timeline & Highlights Log ({events.length} Events)</span>
        </h4>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {events.length > 0 ? (
            events.map((evt, idx) => {
              const evtTeam = evt.teamId === match.homeTeamId ? homeTeam : awayTeam;

              return (
                <div
                  key={`timeline-evt-${evt.id || idx}-${idx}`}
                  className="p-3 rounded-2xl bg-[#050a12] border border-[#4C787E]/20 flex items-center justify-between text-xs transition-all hover:border-[#4C787E]/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-[#0e1d2c] border border-[#4C787E]/40 text-amber-300 font-black text-xs flex items-center justify-center shrink-0 font-mono">
                      {evt.minute}'
                    </span>
                    <div>
                      <p className="font-bold text-white leading-tight">{evt.description}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <span>{evt.player}</span>
                        {evtTeam && (
                          <>
                            <span>•</span>
                            <span className="text-[#B7CEEC] font-semibold">{evtTeam.name}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <span className="text-lg shrink-0">
                    {evt.type === 'goal' && '⚽'}
                    {evt.type === 'yellow_card' && '🟨'}
                    {evt.type === 'red_card' && '🟥'}
                    {evt.type === 'shot_on_target' && '🎯'}
                    {evt.type === 'kickoff' && '🏁'}
                    {evt.type === 'fulltime' && '🏆'}
                  </span>
                </div>
              );
            })
          ) : (
            <p className="text-center text-xs text-gray-400 py-4 italic">
              No live match events recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedMatchAnalytics;
