import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  CheckCircle2,
  Edit2,
  Plus,
  Clock,
  Zap,
  ShieldCheck,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { Match, Team, MatchEvent, Player } from '../types';
import { TeamLogo } from './TeamLogos';

export interface EditMatchEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match;
  teams: Team[];
  eventToEdit: MatchEvent | null; // null means adding a new event
  onSaveEvent: (updatedEvents: MatchEvent[], newHomeScore: number, newAwayScore: number) => void;
}

export const EditMatchEventModal: React.FC<EditMatchEventModalProps> = ({
  isOpen,
  onClose,
  match,
  teams,
  eventToEdit,
  onSaveEvent,
}) => {
  const homeTeam = teams.find((t) => t.id === match.homeTeamId) || teams[0];
  const awayTeam = teams.find((t) => t.id === match.awayTeamId) || teams[1];

  const [eventType, setEventType] = useState<'goal' | 'yellow_card' | 'red_card' | 'sub' | 'shot_on_target' | 'foul' | 'corner' | 'kickoff' | 'halftime' | 'fulltime'>('goal');
  const [selectedTeamId, setSelectedTeamId] = useState<string>(homeTeam?.id || '');
  const [playerName, setPlayerName] = useState<string>('');
  const [assistPlayerName, setAssistPlayerName] = useState<string>('');
  const [subOutPlayerName, setSubOutPlayerName] = useState<string>('');
  const [minute, setMinute] = useState<number>(1);
  const [description, setDescription] = useState<string>('');

  // Score override options
  const [homeScoreInput, setHomeScoreInput] = useState<number>(match?.homeScore || 0);
  const [awayScoreInput, setAwayScoreInput] = useState<number>(match?.awayScore || 0);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHomeScoreInput(match?.homeScore || 0);
      setAwayScoreInput(match?.awayScore || 0);

      if (eventToEdit) {
        setEventType(eventToEdit.type as any || 'goal');
        setSelectedTeamId(eventToEdit.teamId || homeTeam?.id || '');
        setPlayerName(eventToEdit.player || '');
        setAssistPlayerName(eventToEdit.assistPlayer || '');
        setSubOutPlayerName(eventToEdit.subOutPlayer || '');
        setMinute(eventToEdit.minute || 1);
        setDescription(eventToEdit.description || '');
      } else {
        setEventType('goal');
        setSelectedTeamId(homeTeam?.id || '');
        setPlayerName('');
        setAssistPlayerName('');
        setSubOutPlayerName('');
        setMinute(match?.minute || 1);
        setDescription('');
      }
    }
  }, [isOpen, eventToEdit, match, homeTeam?.id]);

  if (!isOpen) return null;

  const activeSelectedTeam = selectedTeamId === homeTeam?.id ? homeTeam : awayTeam;
  const teamRoster = activeSelectedTeam?.roster || [];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let finalDescription = description.trim();

    // Dynamically format clean description for goals based on assist selection
    if (eventType === 'goal') {
      if (assistPlayerName.trim()) {
        finalDescription = `⚽ GOAL! ${playerName || 'Player'} scores for ${activeSelectedTeam?.name}! (Assist: ${assistPlayerName.trim()})`;
      } else {
        finalDescription = `⚽ GOAL! ${playerName || 'Player'} scores for ${activeSelectedTeam?.name}!`;
      }
    } else if (!finalDescription) {
      finalDescription = eventType === 'yellow_card'
        ? `🟨 YELLOW CARD to ${playerName || 'Player'} (${activeSelectedTeam?.shortName})`
        : eventType === 'red_card'
        ? `🟥 RED CARD to ${playerName || 'Player'} (${activeSelectedTeam?.shortName})`
        : eventType === 'sub'
        ? `🔄 SUB: ${playerName || 'Player'} in for ${subOutPlayerName || 'Player'}`
        : `${eventType.toUpperCase()} - ${playerName || activeSelectedTeam?.name}`;
    }

    const currentPeriodStr =
      minute <= 20 ? '1st_half' : minute <= 40 ? '2nd_half' : 'fulltime';

    let updatedEventsList: MatchEvent[] = [...(match.events || [])];

    if (eventToEdit) {
      // Edit existing event
      updatedEventsList = updatedEventsList.map((evt) => {
        if (evt.id === eventToEdit.id) {
          const updatedEvt: MatchEvent = {
            ...evt,
            type: eventType,
            teamId: selectedTeamId,
            player: playerName || 'Player',
            minute: Number(minute),
            description: finalDescription,
            period: currentPeriodStr,
          };

          if (assistPlayerName.trim()) {
            updatedEvt.assistPlayer = assistPlayerName.trim();
          } else {
            delete updatedEvt.assistPlayer;
          }

          if (subOutPlayerName.trim()) {
            updatedEvt.subOutPlayer = subOutPlayerName.trim();
          } else {
            delete updatedEvt.subOutPlayer;
          }

          return updatedEvt;
        }
        return evt;
      });
    } else {
      // Create new event
      const newEvt: MatchEvent = {
        id: `evt-manual-${Date.now()}`,
        minute: Number(minute),
        type: eventType,
        teamId: selectedTeamId,
        player: playerName || activeSelectedTeam?.name || 'Player',
        description: finalDescription,
        period: currentPeriodStr,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        assistPlayer: assistPlayerName || undefined,
        subOutPlayer: subOutPlayerName || undefined,
      };
      updatedEventsList = [newEvt, ...updatedEventsList];
    }

    // Sort events chronologically by minute
    updatedEventsList.sort((a, b) => b.minute - a.minute);

    onSaveEvent(updatedEventsList, Number(homeScoreInput), Number(awayScoreInput));
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
        className="fixed inset-0 z-[75] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="w-full max-w-lg bg-[#091522] border border-[#B7CEEC]/40 rounded-[2.2rem] text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Top Modal Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0d1c2d] to-[#0a1624] border-b border-[#4C787E]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shadow-md">
                {eventToEdit ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white tracking-wide flex items-center gap-2">
                  <span>{eventToEdit ? 'Edit Match Event' : 'Add Manual / Past Match Event'}</span>
                </h3>
                <p className="text-[10px] text-[#B7CEEC]/80 font-medium">
                  {homeTeam?.name} vs {awayTeam?.name} • Correct event details or adjust score
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-[#16293d] text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Event Category Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#B7CEEC]">1. Select Event Type</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-xs font-bold">
                {[
                  { type: 'goal', label: '⚽ Goal', color: 'bg-emerald-500/20 border-emerald-400 text-emerald-300' },
                  { type: 'yellow_card', label: '🟨 Yellow Card', color: 'bg-yellow-500/20 border-yellow-400 text-yellow-300' },
                  { type: 'red_card', label: '🟥 Red Card', color: 'bg-rose-500/20 border-rose-400 text-rose-300' },
                  { type: 'sub', label: '🔄 Sub', color: 'bg-sky-500/20 border-sky-400 text-sky-300' },
                  { type: 'shot_on_target', label: '🎯 Shot', color: 'bg-purple-500/20 border-purple-400 text-purple-300' },
                  { type: 'foul', label: '🛑 Foul', color: 'bg-orange-500/20 border-orange-400 text-orange-300' },
                  { type: 'corner', label: '🚩 Corner', color: 'bg-indigo-500/20 border-indigo-400 text-indigo-300' },
                  { type: 'kickoff', label: '🚀 Kickoff', color: 'bg-teal-500/20 border-teal-400 text-teal-300' },
                ].map((item) => (
                  <button
                    key={`edit-cat-${item.type}`}
                    type="button"
                    onClick={() => setEventType(item.type as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      eventType === item.type
                        ? `${item.color} font-black ring-2 ring-amber-300 shadow-md scale-105`
                        : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Team Selection Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase text-[#B7CEEC]">2. Select Team</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedTeamId(homeTeam.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    selectedTeamId === homeTeam.id
                      ? 'bg-[#18324a] border-[#B7CEEC] ring-2 ring-[#B7CEEC]/40 text-white font-extrabold shadow-md'
                      : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-400 hover:text-white'
                  }`}
                >
                  <TeamLogo teamId={homeTeam.id} size={22} />
                  <span>{homeTeam.name} (Home)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedTeamId(awayTeam.id)}
                  className={`p-3 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                    selectedTeamId === awayTeam.id
                      ? 'bg-[#18324a] border-[#B7CEEC] ring-2 ring-[#B7CEEC]/40 text-white font-extrabold shadow-md'
                      : 'bg-[#101e2e] border-[#4C787E]/30 text-gray-400 hover:text-white'
                  }`}
                >
                  <TeamLogo teamId={awayTeam.id} size={22} />
                  <span>{awayTeam.name} (Away)</span>
                </button>
              </div>
            </div>

            {/* Player Roster Selection */}
            {eventType !== 'kickoff' && eventType !== 'halftime' && eventType !== 'fulltime' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-gray-300 block mb-1">
                    Primary Player ({activeSelectedTeam?.shortName})
                  </label>
                  {teamRoster.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white font-bold focus:outline-none focus:border-[#B7CEEC]"
                      >
                        <option value="">-- Select Roster Player --</option>
                        {teamRoster.map((p, idx) => (
                          <option key={`edit-p-opt-${p.id}-${idx}`} value={p.name}>
                            #{p.number} {p.name} ({p.position})
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Or type custom player name / #number"
                        className="w-full p-2 rounded-lg bg-[#08101a] border border-[#4C787E]/30 text-xs text-amber-300 font-bold focus:outline-none placeholder-gray-500"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter Player Name / Shirt Number"
                      className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white font-bold focus:outline-none"
                    />
                  )}
                </div>

                {/* Secondary Player (Assist or Sub Out) */}
                {eventType === 'goal' && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">Assist Player (Optional)</label>
                    <select
                      value={assistPlayerName}
                      onChange={(e) => setAssistPlayerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white font-bold focus:outline-none"
                    >
                      <option value="">None / Solo Goal</option>
                      {teamRoster.map((p, idx) => (
                        <option key={`edit-ast-opt-${p.id}-${idx}`} value={p.name}>
                          #{p.number} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {eventType === 'sub' && (
                  <div>
                    <label className="text-[11px] font-bold text-gray-300 block mb-1">Player Subbed Out</label>
                    <select
                      value={subOutPlayerName}
                      onChange={(e) => setSubOutPlayerName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white font-bold focus:outline-none"
                    >
                      <option value="">-- Choose Player Out --</option>
                      {teamRoster.map((p, idx) => (
                        <option key={`edit-out-opt-${p.id}-${idx}`} value={p.name}>
                          #{p.number} {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Event Minute & Score Override Row */}
            <div className="p-3 rounded-2xl bg-[#0b1724] border border-[#4C787E]/30 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" /> Event Match Minute
                </span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={minute}
                  onChange={(e) => setMinute(Number(e.target.value))}
                  className="w-24 p-2 rounded-xl bg-[#122336] border border-amber-500/40 text-white font-black text-center focus:outline-none"
                />
              </div>

              {/* Scoreline Direct Controls */}
              <div className="pt-2 border-t border-[#4C787E]/20 space-y-1.5">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-300 block">
                  Official Score Override
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#122336] border border-[#4C787E]/30">
                    <span className="text-gray-300 font-bold truncate">{homeTeam.shortName} Score:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={homeScoreInput}
                      onChange={(e) => setHomeScoreInput(Number(e.target.value))}
                      className="w-14 p-1 rounded-lg bg-[#07111c] border border-[#4C787E]/40 text-white font-black text-center"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-[#122336] border border-[#4C787E]/30">
                    <span className="text-gray-300 font-bold truncate">{awayTeam.shortName} Score:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={awayScoreInput}
                      onChange={(e) => setAwayScoreInput(Number(e.target.value))}
                      className="w-14 p-1 rounded-lg bg-[#07111c] border border-[#4C787E]/40 text-white font-black text-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Description Override */}
            <div>
              <label className="text-[11px] font-bold text-gray-300 block mb-1">Custom Event Description / Note</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Auto-generated if left blank (e.g. ⚽ GOAL! #10 Player scores for Team!)"
                className="w-full p-2.5 rounded-xl bg-[#101e2e] border border-[#4C787E]/40 text-white text-xs focus:outline-none focus:border-[#B7CEEC]"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 hover:brightness-110 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xl"
              >
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>{eventToEdit ? 'Save Event Changes & Sync Score' : 'Save New Event to Official Match Record'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
