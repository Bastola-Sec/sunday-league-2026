import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Plus, Trash2, Calendar, Shield, Check, AlertTriangle, X, Settings2, Sliders, Layers, Sparkles } from 'lucide-react';
import { Team, Match } from '../types';
import { SeasonSetupOptions } from '../utils/leagueEngine';
import { TeamLogo } from './TeamLogos';

interface SeasonSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSeasonNumber: number;
  existingTeams: Team[];
  existingMatches: Match[];
  onConfirmSetup: (options: SeasonSetupOptions) => void;
}

export const SeasonSetupModal: React.FC<SeasonSetupModalProps> = ({
  isOpen,
  onClose,
  currentSeasonNumber,
  existingTeams,
  existingMatches,
  onConfirmSetup,
}) => {
  const nextSeasonNumber = currentSeasonNumber + 1;

  // Form State
  const [participatingTeams, setParticipatingTeams] = useState<Team[]>([...existingTeams]);
  const [matchFormat, setMatchFormat] = useState<'7v7' | '8v8' | '11v11'>('8v8');
  const [halfDurationMinutes, setHalfDurationMinutes] = useState<number>(20);
  const [homeAwayRounds, setHomeAwayRounds] = useState<number>(1);
  const [includeCups, setIncludeCups] = useState<boolean>(true);
  const [includeSuperCup, setIncludeSuperCup] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('2026-09-06');

  // Inline "Add New Club" drawer state
  const [showAddClubDrawer, setShowAddClubDrawer] = useState<boolean>(false);
  const [newClubName, setNewClubName] = useState<string>('');
  const [newClubShortName, setNewClubShortName] = useState<string>('');
  const [newClubColor, setNewClubColor] = useState<string>('#4C787E');
  const [newClubIcon, setNewClubIcon] = useState<string>('⚽');

  if (!isOpen) return null;

  // Calculate live preview metrics
  const numTeams = participatingTeams.length;
  const numRotations = numTeams % 2 === 0 ? numTeams - 1 : numTeams;
  const matchesPerRound = Math.floor(numTeams / 2);
  const totalLeagueMatches = numTeams >= 2 ? numRotations * matchesPerRound * homeAwayRounds : 0;
  const totalCupMatches = includeCups ? 2 : 0;
  const totalPlayoffMatches = 1;
  const totalFixturesToGenerate = totalLeagueMatches + totalCupMatches + totalPlayoffMatches;
  const estimatedWeeks = (numRotations * homeAwayRounds) + (includeCups ? 1 : 0) + 1;

  // Add Club Handler
  const handleAddNewClub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClubName.trim()) return;

    const clubId = newClubName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (participatingTeams.some((t) => t.id === clubId)) {
      alert('A club with a similar name already exists!');
      return;
    }

    const shortName = newClubShortName.trim() || newClubName.substring(0, 3).toUpperCase();
    
    // Default 8 player roster for new team
    const defaultRoster = Array.from({ length: 8 }).map((_, i) => ({
      id: `p-${clubId}-${i + 1}`,
      name: `Player ${i + 1}`,
      number: i + 1,
      position: (i === 0 ? 'GK' : i <= 3 ? 'DEF' : i <= 6 ? 'MID' : 'FWD') as any,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      motmAwards: 0,
      matchesPlayed: 0,
    }));

    const newTeamObj: Team = {
      id: clubId,
      name: newClubName.trim(),
      shortName: shortName,
      motto: 'Always Fighting',
      colorPrimary: newClubColor,
      colorSecondary: '#05080c',
      textColor: '#ffffff',
      rank: participatingTeams.length + 1,
      squadCount: defaultRoster.length,
      adminName: `${shortName} Admin`,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      allTimePlayed: 0,
      allTimeWins: 0,
      allTimeDraws: 0,
      allTimeLosses: 0,
      allTimeGoalsFor: 0,
      allTimeGoalsAgainst: 0,
      allTimeGoalDifference: 0,
      allTimeWinPercentage: 0,
      form: [],
      topScorer: 'N/A',
      roster: defaultRoster,
    };

    setParticipatingTeams((prev) => [...prev, newTeamObj]);
    setNewClubName('');
    setNewClubShortName('');
    setShowAddClubDrawer(false);
  };

  // Remove Club Handler
  const handleRemoveClub = (teamId: string) => {
    if (participatingTeams.length <= 2) {
      alert('A minimum of 2 teams is required to generate a season schedule!');
      return;
    }
    setParticipatingTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  // Confirm Setup Handler
  const handleConfirm = () => {
    if (participatingTeams.length < 2) {
      alert('Please add at least 2 teams before launching Season ' + nextSeasonNumber);
      return;
    }

    onConfirmSetup({
      nextSeasonNumber,
      participatingTeams,
      matchFormat,
      halfDurationMinutes,
      homeAwayRounds,
      includeCups,
      includeSuperCup,
      startDate,
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#020408]/92 backdrop-blur-2xl z-[90] flex items-center justify-center p-2 sm:p-5 overflow-y-auto animate-fade-in">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#05080c]/98 border-2 border-amber-400/60 rounded-3xl max-w-4xl w-full p-4 sm:p-6 space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative text-white max-h-[94vh] flex flex-col min-h-0 overflow-y-auto custom-scrollbar backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-amber-400/30 pb-4 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 shadow-md">
                <Trophy className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-wider f1-header flex items-center gap-2">
                  <span>SEASON {nextSeasonNumber} SETUP & CONFIGURATION</span>
                </h3>
                <p className="text-[11px] text-amber-300/80 font-mono">
                  Review, acknowledge, and confirm season settings before automated rollout
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-[#03060a] hover:bg-[#09111c] text-gray-400 hover:text-white transition-all cursor-pointer border border-[#B7CEEC]/30"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content Body */}
          <div className="space-y-6 flex-1 overflow-y-auto pr-1 custom-scrollbar">

            {/* SECTION 1: PARTICIPATING CLUBS (ADD & REMOVE) */}
            <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#B7CEEC]/15 pb-2.5">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2 font-mono">
                    <Shield className="w-4 h-4 text-teal-400" />
                    <span>1. PARTICIPATING CLUBS ({participatingTeams.length} TEAMS)</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Add or remove clubs. Changes auto-update standings, rosters, fixtures, and admin views.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddClubDrawer(!showAddClubDrawer)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all cursor-pointer border border-teal-300 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4 text-slate-950" />
                  <span>+ Add New Club</span>
                </button>
              </div>

              {/* Inline Add Club Drawer */}
              {showAddClubDrawer && (
                <form onSubmit={handleAddNewClub} className="p-3.5 rounded-xl bg-[#05080c] border border-teal-400/50 space-y-3 animate-fade-in">
                  <h5 className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>Register New Participating Club</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[10px] text-gray-400 font-mono mb-1 uppercase font-bold">Club Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kathmandu Strikers"
                        value={newClubName}
                        onChange={(e) => setNewClubName(e.target.value)}
                        className="w-full bg-[#080d15] border border-teal-500/40 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-mono mb-1 uppercase font-bold">Short Abbr (3-4 Letters)</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="e.g. KST"
                        value={newClubShortName}
                        onChange={(e) => setNewClubShortName(e.target.value)}
                        className="w-full bg-[#080d15] border border-teal-500/40 rounded-xl px-3 py-1.5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-teal-400 uppercase font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-gray-400 font-mono mb-1 uppercase font-bold">Primary Jersey Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={newClubColor}
                          onChange={(e) => setNewClubColor(e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                        />
                        <span className="text-xs font-mono font-bold text-teal-300">{newClubColor}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddClubDrawer(false)}
                      className="px-3 py-1 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 rounded-xl bg-teal-500 text-slate-950 text-xs font-black uppercase hover:bg-teal-400 shadow-md"
                    >
                      Confirm Club Addition
                    </button>
                  </div>
                </form>
              )}

              {/* Grid of Current Participating Clubs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {participatingTeams.map((team) => (
                  <div
                    key={`setup-team-${team.id}`}
                    className="p-2.5 rounded-xl bg-[#040810] border border-[#B7CEEC]/20 flex items-center justify-between gap-2 shadow-sm hover:border-[#4C787E]/60 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <TeamLogo teamId={team.id} size={28} />
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-white truncate font-mono">{team.name}</p>
                        <p className="text-[9px] text-[#B7CEEC]/60 font-mono">
                          {team.shortName || team.id} • {team.roster?.length || 8} Players
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveClub(team.id)}
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 transition-colors cursor-pointer shrink-0"
                      title={`Remove ${team.name} from Season ${nextSeasonNumber}`}
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* SECTION 2: COMPETITION FORMAT & MATCH DURATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2 font-mono border-b border-[#B7CEEC]/15 pb-2">
                  <Settings2 className="w-4 h-4 text-amber-400" />
                  <span>2. MATCH FORMAT</span>
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {(['7v7', '8v8', '11v11'] as const).map((fmt) => (
                    <button
                      key={fmt}
                      type="button"
                      onClick={() => setMatchFormat(fmt)}
                      className={`py-2 rounded-xl font-extrabold transition-all cursor-pointer text-center border ${
                        matchFormat === fmt
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                          : 'bg-[#040810] text-gray-300 border-[#B7CEEC]/20 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{fmt}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2 font-mono border-b border-[#B7CEEC]/15 pb-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>3. HALF DURATION</span>
                </h4>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[15, 20, 25, 30].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setHalfDurationMinutes(mins)}
                      className={`py-2 rounded-xl font-extrabold transition-all cursor-pointer text-center border ${
                        halfDurationMinutes === mins
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                          : 'bg-[#040810] text-gray-300 border-[#B7CEEC]/20 hover:border-amber-400/40'
                      }`}
                    >
                      <span>{mins}m</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SECTION 3: LEAGUE PHASE ROUNDS & CUP TOGGLE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Home & Away Rounds */}
              <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2 font-mono border-b border-[#B7CEEC]/15 pb-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  <span>4. LEAGUE ROUNDS (HOME & AWAY)</span>
                </h4>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {[1, 2, 3, 4].map((r) => (
                    <button
                      key={`round-${r}`}
                      type="button"
                      onClick={() => setHomeAwayRounds(r)}
                      className={`py-2 rounded-xl font-extrabold transition-all cursor-pointer text-center border ${
                        homeAwayRounds === r
                          ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-md font-black'
                          : 'bg-[#040810] text-gray-300 border-[#B7CEEC]/20 hover:border-teal-400/40'
                      }`}
                    >
                      <span>{r} {r === 1 ? 'Round' : 'Rounds'}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-gray-400 font-mono">
                  {homeAwayRounds === 1
                    ? 'Single round-robin: Teams play each other once.'
                    : homeAwayRounds === 2
                    ? 'Double round-robin: Balanced Home & Away matches.'
                    : `Multi round-robin: Teams play each other ${homeAwayRounds} times.`}
                </p>
              </div>

              {/* Cup Competitions Toggle */}
              <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-300 flex items-center gap-2 font-mono border-b border-[#B7CEEC]/15 pb-2">
                  <Trophy className="w-4 h-4 text-teal-400" />
                  <span>5. COMPETITION SCOPE</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setIncludeCups(false)}
                    className={`py-2 px-2 rounded-xl font-extrabold transition-all cursor-pointer text-center border ${
                      !includeCups
                        ? 'bg-teal-500 text-slate-950 border-teal-300 shadow-md font-black'
                        : 'bg-[#040810] text-gray-300 border-[#B7CEEC]/20 hover:border-teal-400/40'
                    }`}
                  >
                    <span>⚽ League Phase Only</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIncludeCups(true)}
                    className={`py-2 px-2 rounded-xl font-extrabold transition-all cursor-pointer text-center border ${
                      includeCups
                        ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                        : 'bg-[#040810] text-gray-300 border-[#B7CEEC]/20 hover:border-amber-400/40'
                    }`}
                  >
                    <span>🏆 League + Cup Knockouts</span>
                  </button>
                </div>
                
                {includeCups && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#B7CEEC]/15">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeSuperCup}
                        onChange={(e) => setIncludeSuperCup(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-400 accent-amber-400 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-bold text-amber-300 text-xs">
                        Include Super Cup Match (Wait until next season to enable)
                      </span>
                    </label>
                  </div>
                )}
                
                <p className="text-[10px] text-gray-400 font-mono">
                  {includeCups
                    ? (includeSuperCup ? 'Includes League Cup Knockouts, Super Cup Final, & Grand Final.' : 'Includes League Cup Knockouts & Grand Final (Super Cup Disabled).')
                    : 'Includes regular League Season fixtures & Grand Final.'}
                </p>
              </div>
            </div>

            {/* SECTION 4: SEASON START DATE */}
            <div className="p-4 rounded-2xl bg-[#080d15] border border-[#B7CEEC]/20 space-y-3 shadow-lg">
              <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2 font-mono border-b border-[#B7CEEC]/15 pb-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>6. SEASON START DATE</span>
              </h4>
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#040810] border border-amber-400/40 rounded-xl px-4 py-2 text-xs font-mono font-bold text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
                />
                <p className="text-[11px] text-gray-300 font-mono">
                  Sunday matches will be scheduled weekly starting from {startDate}.
                </p>
              </div>
            </div>

            {/* SECTION 5: LIVE CONFIGURATION SUMMARY & PREVIEW PANEL */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-[#080d15] to-teal-500/15 border border-amber-400/50 space-y-3 shadow-xl">
              <h4 className="text-xs font-black uppercase tracking-widest text-amber-300 font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                <span>SEASON {nextSeasonNumber} CONFIGURATION SUMMARY</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-[#05080c]/80 border border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Participating Clubs</p>
                  <p className="text-lg font-black text-teal-300 font-mono">{numTeams} Teams</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#05080c]/80 border border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Format & Duration</p>
                  <p className="text-lg font-black text-amber-300 font-mono">{matchFormat} ({halfDurationMinutes}m)</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#05080c]/80 border border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Total Season Fixtures</p>
                  <p className="text-lg font-black text-yellow-300 font-mono">{totalFixturesToGenerate} Matches</p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#05080c]/80 border border-white/10">
                  <p className="text-[10px] text-gray-400 uppercase font-mono font-bold">Est. Duration</p>
                  <p className="text-lg font-black text-emerald-300 font-mono">~{estimatedWeeks} Weeks</p>
                </div>
              </div>
            </div>

          </div>

          {/* Action Confirmation Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/10 pt-4 shrink-0">
            <div className="flex items-center gap-2 text-[11px] text-gray-400 font-mono">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Confirming resets current standings to 0-0-0 while archiving season champion.</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all cursor-pointer border border-yellow-300"
              >
                <Trophy className="w-4 h-4 text-slate-950" />
                <span>🚀 CONFIRM & LAUNCH SEASON {nextSeasonNumber}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
