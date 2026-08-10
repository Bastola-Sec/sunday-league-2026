import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Sparkles,
  UserCheck,
  ChevronRight,
  Clock,
  Zap,
  ArrowRight,
  CornerUpRight,
  ShieldAlert,
  Award,
  AlertTriangle,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { Match, Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';

export interface AutoEventWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  homeTeam: Team;
  awayTeam: Team;
  initialEventType?: 'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner';
  currentMatchMinute: number;
  onConfirmEvent: (eventData: {
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
  }) => void;
}

export const AutoEventWizardModal: React.FC<AutoEventWizardModalProps> = ({
  isOpen,
  onClose,
  match,
  homeTeam,
  awayTeam,
  initialEventType = 'goal',
  currentMatchMinute,
  onConfirmEvent,
}) => {
  // Wizard State
  const [eventType, setEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner'>(initialEventType);
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam?.id || '');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [assistPlayer, setAssistPlayer] = useState<Player | null>(null);
  const [isPenalty, setIsPenalty] = useState<boolean>(false);
  const [isOwnGoal, setIsOwnGoal] = useState<boolean>(false);
  const [subOutPlayer, setSubOutPlayer] = useState<Player | null>(null);
  const [eventMinute, setEventMinute] = useState<number>(currentMatchMinute || 1);
  const [customNote, setCustomNote] = useState<string>('');
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false);

  // Sync state ONLY when modal opens
  useEffect(() => {
    if (isOpen) {
      setEventType(initialEventType);
      setSelectedTeamId(homeTeam?.id || '');
      setSelectedPlayer(null);
      setAssistPlayer(null);
      setIsPenalty(false);
      setIsOwnGoal(false);
      setSubOutPlayer(null);
      setEventMinute(currentMatchMinute > 0 ? currentMatchMinute : 1);
      setCustomNote('');
      setShowSuccessToast(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeSelectedTeam = selectedTeamId === homeTeam?.id ? homeTeam : awayTeam;
  const isHomeSelected = selectedTeamId === homeTeam?.id;

  // Auto-switch team when selected
  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId);
    setSelectedPlayer(null);
    setAssistPlayer(null);
    setSubOutPlayer(null);
  };

  // Generate Live Preview Description
  const getGeneratedDescription = (): string => {
    const teamName = activeSelectedTeam?.name || '';
    const teamShort = activeSelectedTeam?.shortName || '';
    const pName = selectedPlayer ? `#${selectedPlayer.number} ${selectedPlayer.name}` : '[Select Player]';

    switch (eventType) {
      case 'goal':
        if (isOwnGoal) {
          return `⚽ OWN GOAL! ${pName} (${teamShort}) accidentally redirects into own net!`;
        }
        if (isPenalty) {
          return `⚽ GOAL! ${pName} converts from the PENALTY SPOT for ${teamName}!`;
        }
        return `⚽ GOAL! ${pName} scores for ${teamName}!${
          assistPlayer ? ` (Assist: #${assistPlayer.number} ${assistPlayer.name})` : ''
        }`;

      case 'yellow_card':
        return `🟨 YELLOW CARD issued to ${pName} (${teamShort}).`;

      case 'red_card':
        return `🟥 RED CARD! ${pName} (${teamShort}) is sent off by the official!`;

      case 'sub':
        const subOutName = subOutPlayer ? `#${subOutPlayer.number} ${subOutPlayer.name}` : '[Select Player Out]';
        return `🔄 SUBSTITUTION for ${teamShort}: ${pName} comes ON for ${subOutName}.`;

      case 'shot_on_target':
        return `🎯 SHOT ON TARGET by ${pName} (${teamShort}) saved by keeper!`;

      case 'foul':
        return `🛑 FOUL committed by ${pName} (${teamShort}).`;

      case 'corner':
        return `🚩 CORNER KICK awarded to ${teamName}.`;

      default:
        return 'Match Event';
    }
  };

  const handleConfirm = () => {
    if (!selectedPlayer && eventType !== 'corner') {
      alert('Please select a player from the team roster!');
      return;
    }

    if (eventType === 'sub' && !subOutPlayer) {
      alert('Please select the player coming OFF for substitution!');
      return;
    }

    const desc = getGeneratedDescription() + (customNote.trim() ? ` - ${customNote.trim()}` : '');

    const isHomeScore = eventType === 'goal' && (isOwnGoal ? !isHomeSelected : isHomeSelected);
    const isAwayScore = eventType === 'goal' && (isOwnGoal ? isHomeSelected : !isHomeSelected);

    onConfirmEvent({
      type: eventType,
      teamId: selectedTeamId,
      player: selectedPlayer ? selectedPlayer.name : activeSelectedTeam.name,
      assistPlayer: assistPlayer ? assistPlayer.name : undefined,
      subOutPlayer: subOutPlayer ? subOutPlayer.name : undefined,
      minute: eventMinute,
      customNote: customNote.trim() || undefined,
      description: desc,
      isHomeScoreIncrement: isHomeScore,
      isAwayScoreIncrement: isAwayScore,
    });

    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
      onClose();
    }, 650);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 25 }}
          transition={{ type: 'spring', damping: 25, stiffness: 320 }}
          className="w-full max-w-2xl bg-[#0a1420] border border-[#B7CEEC]/40 rounded-3xl text-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0e1d2d] via-[#14283c] to-[#0a1420] border-b border-[#4C787E]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#B7CEEC] to-[#4C787E] text-slate-950 font-black shadow-md">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg uppercase tracking-wide text-white">
                    AUTO MATCH EVENT RECORDER
                  </h3>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    1-Tap Sync
                  </span>
                </div>
                <p className="text-xs text-[#B7CEEC]/80">
                  {homeTeam.name} vs {awayTeam.name}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-[#15273a] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Toast Overlay */}
          {showSuccessToast ? (
            <div className="p-12 text-center my-auto space-y-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1.2 }}
                className="w-16 h-16 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center mx-auto shadow-2xl"
              >
                <CheckCircle2 className="w-10 h-10" />
              </motion.div>
              <h3 className="font-black text-xl text-white">EVENT LOGGED & SYNCED!</h3>
              <p className="text-xs text-emerald-400 font-bold">Updated live score and timeline broadcasted.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* STEP 1: EVENT TYPE SELECTOR */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-[#B7CEEC] flex items-center justify-between">
                  <span>1. Select Event Type</span>
                  <span className="text-[10px] text-gray-400 font-normal">Tap to change event category</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEventType('goal');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'goal'
                        ? 'bg-emerald-400 text-slate-950 border-emerald-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">⚽</span>
                    <span>Goal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('yellow_card');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'yellow_card'
                        ? 'bg-yellow-400 text-slate-950 border-yellow-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🟨</span>
                    <span>Yellow Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('red_card');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'red_card'
                        ? 'bg-rose-500 text-white border-rose-500 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🟥</span>
                    <span>Red Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('sub');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'sub'
                        ? 'bg-sky-400 text-slate-950 border-sky-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🔄</span>
                    <span>Substitution</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('shot_on_target');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'shot_on_target'
                        ? 'bg-purple-400 text-slate-950 border-purple-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🎯</span>
                    <span>Shot on Target</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('foul');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'foul'
                        ? 'bg-orange-400 text-slate-950 border-orange-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🛑</span>
                    <span>Foul / Free Kick</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEventType('corner');
                      setSelectedPlayer(null);
                    }}
                    className={`py-2.5 px-3 rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      eventType === 'corner'
                        ? 'bg-indigo-400 text-slate-950 border-indigo-400 font-black shadow-lg scale-[1.02]'
                        : 'bg-[#101e2e] text-gray-300 border-[#4C787E]/30 hover:bg-[#182b3d]'
                    }`}
                  >
                    <span className="text-sm">🚩</span>
                    <span>Corner Kick</span>
                  </button>

                  {/* Minute Input Quick Pill */}
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#122336] border border-[#4C787E]/40 text-xs">
                    <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-gray-400 font-bold shrink-0">Min:</span>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={eventMinute}
                      onChange={(e) => setEventMinute(Number(e.target.value))}
                      className="w-full bg-transparent text-white font-black text-center focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* STEP 2: SELECT TEAM */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-[#B7CEEC] block">
                  2. Select Team
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => homeTeam && handleSelectTeam(homeTeam.id)}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      isHomeSelected
                        ? 'bg-[#182e44] border-[#B7CEEC] ring-2 ring-[#B7CEEC]/40 shadow-xl'
                        : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-400 hover:text-white hover:border-[#4C787E]/60'
                    }`}
                  >
                    <TeamLogo teamId={homeTeam?.id || ''} size={36} />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Home Team</span>
                      <span className="font-black text-xs sm:text-sm text-white">{homeTeam?.name || 'Home Team'}</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => awayTeam && handleSelectTeam(awayTeam.id)}
                    className={`p-3 sm:p-4 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                      !isHomeSelected
                        ? 'bg-[#182e44] border-[#B7CEEC] ring-2 ring-[#B7CEEC]/40 shadow-xl'
                        : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-400 hover:text-white hover:border-[#4C787E]/60'
                    }`}
                  >
                    <TeamLogo teamId={awayTeam?.id || ''} size={36} />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-gray-400 block">Away Team</span>
                      <span className="font-black text-xs sm:text-sm text-white">{awayTeam?.name || 'Away Team'}</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* STEP 3: SELECT PLAYER FROM UPDATED GAME ROSTER */}
              {eventType !== 'corner' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-[#B7CEEC]">
                      3. Select Player ({activeSelectedTeam?.shortName || activeSelectedTeam?.name || 'Team'} Roster)
                    </label>
                    {selectedPlayer && (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Selected: #{selectedPlayer.number} {selectedPlayer.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-52 overflow-y-auto pr-1">
                    {(activeSelectedTeam?.roster || []).map((player, idx) => {
                      const isSelected = selectedPlayer?.id === player.id;
                      return (
                        <button
                          key={`wiz-p-${player.id}-${idx}`}
                          type="button"
                          onClick={() => setSelectedPlayer(player)}
                          className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30 text-white shadow-md'
                              : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-300 hover:bg-[#182a3d] hover:border-[#B7CEEC]/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-7 h-7 rounded-lg bg-[#182c40] text-[#B7CEEC] font-black text-xs flex items-center justify-center shrink-0 border border-[#4C787E]/40">
                              #{player.number}
                            </div>
                            <div className="truncate">
                              <span className="font-bold text-xs text-white block truncate">{player.name}</span>
                              <span className="text-[10px] text-gray-400 block">{player.position}</span>
                            </div>
                          </div>

                          {player.goals > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold shrink-0">
                              ⚽ {player.goals}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: EVENT SPECIFIC OPTIONS (ASSIST, SUB OUT, PENALTY, OWN GOAL) */}
              {eventType === 'goal' && selectedPlayer && (
                <div className="p-4 rounded-2xl bg-[#0f1f30] border border-[#4C787E]/40 space-y-3">
                  <span className="text-xs font-black uppercase text-amber-300 block">
                    Goal Details & Assist Selector
                  </span>

                  {/* Goal Mode Badges */}
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPenalty(!isPenalty);
                        if (!isPenalty) setIsOwnGoal(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold border cursor-pointer transition-all ${
                        isPenalty
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-[#142638] text-gray-300 border-[#4C787E]/30'
                      }`}
                    >
                      🎯 Penalty Kick
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsOwnGoal(!isOwnGoal);
                        if (!isOwnGoal) setIsPenalty(false);
                      }}
                      className={`px-3 py-1.5 rounded-xl font-bold border cursor-pointer transition-all ${
                        isOwnGoal
                          ? 'bg-rose-500 text-white border-rose-500'
                          : 'bg-[#142638] text-gray-300 border-[#4C787E]/30'
                      }`}
                    >
                      ⚽❌ Own Goal
                    </button>
                  </div>

                  {/* Assist Player Selector */}
                  {!isOwnGoal && !isPenalty && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-300 block">
                        Select Assist Provider (Optional)
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={assistPlayer?.id || ''}
                          onChange={(e) => {
                            const found = (activeSelectedTeam?.roster || []).find((p) => p.id === e.target.value);
                            setAssistPlayer(found || null);
                          }}
                          className="w-full p-2.5 rounded-xl bg-[#08111a] border border-[#4C787E]/40 text-white text-xs font-bold focus:outline-none focus:border-[#B7CEEC]"
                        >
                          <option value="">No Assist / Solo Play</option>
                          {(activeSelectedTeam?.roster || [])
                            .filter((p) => p.id !== selectedPlayer.id)
                            .map((p, idx) => (
                              <option key={`wiz-assist-${p.id}-${idx}`} value={p.id}>
                                #{p.number} {p.name} ({p.position})
                              </option>
                            ))}
                        </select>
                        {assistPlayer && (
                          <button
                            type="button"
                            onClick={() => setAssistPlayer(null)}
                            className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 text-xs font-bold shrink-0"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SUBSTITUTION OUT PLAYER SELECTOR */}
              {eventType === 'sub' && selectedPlayer && (
                <div className="p-4 rounded-2xl bg-[#0f1f30] border border-[#4C787E]/40 space-y-2">
                  <label className="text-xs font-black uppercase text-sky-300 block">
                    Select Player Coming OFF
                  </label>
                  <select
                    value={subOutPlayer?.id || ''}
                    onChange={(e) => {
                      const found = (activeSelectedTeam?.roster || []).find((p) => p.id === e.target.value);
                      setSubOutPlayer(found || null);
                    }}
                    className="w-full p-2.5 rounded-xl bg-[#08111a] border border-[#4C787E]/40 text-white text-xs font-bold focus:outline-none focus:border-[#B7CEEC]"
                  >
                    <option value="">Choose Player Going Off Pitch...</option>
                    {(activeSelectedTeam?.roster || [])
                      .filter((p) => p.id !== selectedPlayer.id)
                      .map((p, idx) => (
                        <option key={`wiz-subout-${p.id}-${idx}`} value={p.id}>
                          #{p.number} {p.name} ({p.position})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {/* OPTIONAL CUSTOM NOTE */}
              <div>
                <label className="text-[11px] font-bold text-gray-300 block mb-1">
                  Optional Commentary Note (e.g. "Upper right corner finish", "Tactical foul")
                </label>
                <input
                  type="text"
                  placeholder="e.g. Curling free kick into top corner!"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white text-xs font-medium focus:outline-none focus:border-[#B7CEEC]"
                />
              </div>

              {/* LIVE GENERATED DESCRIPTION PREVIEW */}
              <div className="p-3.5 rounded-2xl bg-[#08111a] border border-[#4C787E]/40 space-y-1">
                <span className="text-[10px] uppercase font-bold text-gray-400 block">Generated Event Preview</span>
                <p className="font-bold text-xs text-emerald-300 flex items-center gap-2">
                  <span>{getGeneratedDescription()}</span>
                </p>
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-1/3 py-3 rounded-2xl bg-[#142638] text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-2/3 py-3 rounded-2xl bg-gradient-to-r from-[#B7CEEC] via-emerald-400 to-[#4C787E] text-slate-950 font-black text-xs hover:brightness-110 shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {eventType === 'goal'
                      ? `CONFIRM GOAL (${eventMinute}')`
                      : eventType === 'yellow_card'
                      ? 'CONFIRM YELLOW CARD'
                      : eventType === 'red_card'
                      ? 'CONFIRM RED CARD'
                      : eventType === 'sub'
                      ? 'CONFIRM SUBSTITUTION'
                      : 'LOG EVENT'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
