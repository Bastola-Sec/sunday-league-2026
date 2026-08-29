import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Trophy, Star, Sparkles, Calendar, Clock, Zap, Shield, Users, Plus, Trash2, Upload, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { Team, Match, SpecialTournament, Player } from '../types';

interface CreateSpecialTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTeams: Team[];
  onCreateTournament: (tournament: SpecialTournament, generatedMatches: Match[]) => void;
  tournamentToEdit?: SpecialTournament | null;
}

const PRESET_COLORS = [
  { primary: '#C0392B', secondary: '#F39C12', text: '#FFFFFF' }, // Momo Red/Gold
  { primary: '#8E44AD', secondary: '#3498DB', text: '#FFFFFF' }, // Jhyap Purple/Blue
  { primary: '#27AE60', secondary: '#F1C40F', text: '#FFFFFF' }, // NSH Green/Yellow
  { primary: '#2980B9', secondary: '#E74C3C', text: '#FFFFFF' }, // Royal Blue/Red
  { primary: '#D35400', secondary: '#16A085', text: '#FFFFFF' }, // Orange/Teal
  { primary: '#34495E', secondary: '#E67E22', text: '#FFFFFF' }, // Dark Slate/Gold
  { primary: '#16A085', secondary: '#8E44AD', text: '#FFFFFF' }, // Emerald/Purple
  { primary: '#C0392B', secondary: '#2C3E50', text: '#FFFFFF' }, // Crimson/Navy
];

const PRESET_LOGOS = [
  { label: 'MoMo Strikers', url: '/logos/momo-strikers.png' },
  { label: 'Jhyap Warriors', url: '/logos/jhyap-warriors.png' },
  { label: 'No Stamina', url: '/logos/no-stamina.png' },
];

// Helper to calculate exact Kickoff time for single-day or multi-game schedules
const formatCalculatedKickoff = (
  baseTimeStr: string, // "09:00"
  matchIndex: number,
  halfDurationMins: number,
  restGapMins: number
): string => {
  const [h, m] = (baseTimeStr || '09:00').split(':').map(Number);
  const totalMatchLength = halfDurationMins * 2 + 10; // Halves + 10m halftime
  const totalMinutesFromMidnight = (h || 9) * 60 + (m || 0) + matchIndex * (totalMatchLength + restGapMins);

  const hours24 = Math.floor(totalMinutesFromMidnight / 60) % 24;
  const minutes = totalMinutesFromMidnight % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;

  const paddedMins = String(minutes).padStart(2, '0');
  return `${hours12}:${paddedMins} ${period}`;
};

// Format ISO date string into readable "Sun, Sep 6"
const formatReadableDate = (dateStr: string): string => {
  try {
    if (!dateStr) return 'Sun, Sep 6';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const CreateSpecialTournamentModal: React.FC<CreateSpecialTournamentModalProps> = ({
  isOpen,
  onClose,
  existingTeams,
  onCreateTournament,
  tournamentToEdit = null,
}) => {
  // Step navigation: 1 = Rules, 2 = Schedule, 3 = Teams & Roster Setup, 4 = Review & Launch
  const [step, setStep] = useState<number>(1);

  // Form State - Format & Rules
  const [tournamentName, setTournamentName] = useState<string>('Dashain Cup 2026');
  const [matchFormat, setMatchFormat] = useState<'7v7' | '8v8' | '11v11'>('8v8');
  const [halfDuration, setHalfDuration] = useState<number>(20);
  const [tournamentType, setTournamentType] = useState<'league_only' | 'league_and_playoffs'>('league_and_playoffs');
  const [leagueRounds, setLeagueRounds] = useState<number>(1);
  const [playoffFormat, setPlayoffFormat] = useState<'top_2_final' | 'top_4_knockout' | 'super_cup'>('top_2_final');

  // Form State - Fixture Scheduling Options
  const [scheduleMode, setScheduleMode] = useState<'weekly' | 'single_day'>('single_day');
  const [gamesPerWeek, setGamesPerWeek] = useState<number>(2);
  const [matchDayName, setMatchDayName] = useState<string>('Sunday');
  const [singleDayDate, setSingleDayDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [firstGameKickoff, setFirstGameKickoff] = useState<string>('09:00');
  const [restGapMinutes, setRestGapMinutes] = useState<number>(25);

  // Teams Selection
  const [teamCount, setTeamCount] = useState<number>(4);
  const [expandedRosterTeamIdx, setExpandedRosterTeamIdx] = useState<number | null>(null);

  // Inline New Player Form for Team
  const [newPlayerName, setNewPlayerName] = useState<string>('');
  const [newPlayerNumber, setNewPlayerNumber] = useState<number>(10);
  const [newPlayerPos, setNewPlayerPos] = useState<'GK' | 'DEF' | 'MID' | 'FWD'>('FWD');

  // Custom Teams state (with explicit Name, ShortCode, LogoUrl, and Roster)
  const [customTeams, setCustomTeams] = useState<Partial<Team>[]>(() => [
    { id: 'team-a', name: 'Team A', shortName: 'TMA', motto: 'Dashain Cup Champions', colorPrimary: PRESET_COLORS[0].primary, colorSecondary: PRESET_COLORS[0].secondary, textColor: '#FFF', roster: [] },
    { id: 'team-b', name: 'Team B', shortName: 'TMB', motto: 'Dashain Cup Contenders', colorPrimary: PRESET_COLORS[1].primary, colorSecondary: PRESET_COLORS[1].secondary, textColor: '#FFF', roster: [] },
    { id: 'team-c', name: 'Team C', shortName: 'TMC', motto: 'Dashain Cup Challengers', colorPrimary: PRESET_COLORS[2].primary, colorSecondary: PRESET_COLORS[2].secondary, textColor: '#FFF', roster: [] },
    { id: 'team-d', name: 'Team D', shortName: 'TMD', motto: 'Dashain Cup Dark Horses', colorPrimary: PRESET_COLORS[3].primary, colorSecondary: PRESET_COLORS[3].secondary, textColor: '#FFF', roster: [] },
  ]);

  // Pre-fill form if editing an existing tournament
  useEffect(() => {
    if (tournamentToEdit) {
      setTournamentName(tournamentToEdit.name);
      setMatchFormat(tournamentToEdit.matchFormat);
      setHalfDuration(tournamentToEdit.halfDurationMinutes);
      setTournamentType(tournamentToEdit.tournamentType);
      setLeagueRounds(tournamentToEdit.leagueRounds);
      if (tournamentToEdit.playoffFormat) setPlayoffFormat(tournamentToEdit.playoffFormat);
      if (tournamentToEdit.teams && tournamentToEdit.teams.length > 0) {
        setTeamCount(tournamentToEdit.teams.length);
        setCustomTeams(tournamentToEdit.teams);
      }
    }
  }, [tournamentToEdit]);

  // Handle Team Count Change
  const handleTeamCountChange = (count: number) => {
    setTeamCount(count);
    setCustomTeams((prev) => {
      const updated: Partial<Team>[] = [];
      const letterLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

      for (let i = 0; i < count; i++) {
        if (prev[i]) {
          updated.push(prev[i]);
        } else {
          const letter = letterLabels[i] || `${i + 1}`;
          updated.push({
            id: `team-${letter.toLowerCase()}`,
            name: `Team ${letter}`,
            shortName: `TM${letter}`,
            motto: 'Pure passion for football ⚽',
            colorPrimary: PRESET_COLORS[i % PRESET_COLORS.length].primary,
            colorSecondary: PRESET_COLORS[i % PRESET_COLORS.length].secondary,
            textColor: '#FFFFFF',
            roster: [],
          });
        }
      }
      return updated;
    });
  };

  // Image Upload Handler for Team Logo (convert to base64 Data URL)
  const handleLogoFileUpload = (teamIdx: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCustomTeams((prev) =>
          prev.map((t, idx) => (idx === teamIdx ? { ...t, logoUrl: result } : t))
        );
      }
    };
    reader.readAsDataURL(file);
  };

  // Inline Player Addition Handler
  const handleAddPlayerToTeam = (teamIdx: number) => {
    if (!newPlayerName.trim()) return;
    const playerToAdd: Player = {
      id: `player-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: newPlayerName.trim(),
      number: newPlayerNumber || 10,
      position: newPlayerPos,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    };

    setCustomTeams((prev) =>
      prev.map((t, idx) => {
        if (idx === teamIdx) {
          const currentRoster = t.roster || [];
          return {
            ...t,
            roster: [...currentRoster, playerToAdd],
          };
        }
        return t;
      })
    );

    setNewPlayerName('');
    setNewPlayerNumber((num) => num + 1);
  };

  // Remove Player from Team Roster
  const handleRemovePlayerFromTeam = (teamIdx: number, playerId: string) => {
    setCustomTeams((prev) =>
      prev.map((t, idx) => {
        if (idx === teamIdx) {
          return {
            ...t,
            roster: (t.roster || []).filter((p) => p.id !== playerId),
          };
        }
        return t;
      })
    );
  };

  // Generate Fixtures Engine with Smart Scheduling Options
  const generateTournamentData = () => {
    const tourneyId = tournamentToEdit ? tournamentToEdit.id : `TOURNAMENT-SPECIAL-${Date.now()}`;

    // Construct final Teams array with clean IDs derived from user's typed names
    const finalTeams: Team[] = customTeams.map((t, idx) => {
      const rawName = t.name?.trim() || `Team ${String.fromCharCode(65 + idx)}`;
      const cleanId = t.id && !t.id.startsWith('spec-team-')
        ? t.id
        : rawName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      const shortName = (t.shortName || rawName.substring(0, 4)).substring(0, 5).toUpperCase();

      return {
        id: cleanId,
        name: rawName,
        shortName,
        motto: t.motto || 'Pure passion for football ⚽',
        colorPrimary: t.colorPrimary || PRESET_COLORS[idx % PRESET_COLORS.length].primary,
        colorSecondary: t.colorSecondary || PRESET_COLORS[idx % PRESET_COLORS.length].secondary,
        textColor: t.textColor || '#FFFFFF',
        logoUrl: t.logoUrl || '',
        rank: idx + 1,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        points: 0,
        form: [],
        topScorer: t.roster && t.roster.length > 0 ? t.roster[0].name : 'N/A',
        squadCount: t.roster?.length || 10,
        adminName: 'Tournament Admin',
        roster: t.roster || [],
      };
    });

    const generatedMatches: Match[] = [];
    let matchCounter = 0;
    let currentWeekNumber = 1;

    // Round-Robin Match Generation for league phase
    for (let round = 1; round <= leagueRounds; round++) {
      for (let i = 0; i < finalTeams.length; i++) {
        for (let j = i + 1; j < finalTeams.length; j++) {
          const home = round % 2 === 1 ? finalTeams[i] : finalTeams[j];
          const away = round % 2 === 1 ? finalTeams[j] : finalTeams[i];

          let startTimeLabel = '';

          if (scheduleMode === 'single_day') {
            const formattedTime = formatCalculatedKickoff(
              firstGameKickoff,
              matchCounter,
              halfDuration,
              restGapMinutes
            );
            const formattedDate = formatReadableDate(singleDayDate);
            startTimeLabel = `${formattedDate} • ${formattedTime}`;
          } else {
            // Weekly Schedule
            const matchIndexInWeek = matchCounter % gamesPerWeek;
            const weekNumberForMatch = Math.floor(matchCounter / gamesPerWeek) + 1;
            currentWeekNumber = weekNumberForMatch;

            const timeStr = formatCalculatedKickoff(
              firstGameKickoff,
              matchIndexInWeek,
              halfDuration,
              restGapMinutes
            );
            startTimeLabel = `${matchDayName}, Week ${weekNumberForMatch} • ${timeStr}`;
          }

          generatedMatches.push({
            id: `FIX-${tourneyId.slice(-6)}-${String(matchCounter + 1).padStart(3, '0')}`,
            homeTeamId: home.id,
            awayTeamId: away.id,
            homeScore: 0,
            awayScore: 0,
            minute: 0,
            isLive: false,
            isFinished: false,
            startTime: startTimeLabel,
            venue: `De Anza Stadium (${tournamentName})`,
            possessionHome: 50,
            possessionAway: 50,
            shotsHome: 0,
            shotsAway: 0,
            shotsOnTargetHome: 0,
            shotsOnTargetAway: 0,
            foulsHome: 0,
            foulsAway: 0,
            events: [],
            weekNumber: currentWeekNumber,
            matchType: 'Special Event',
            status: 'scheduled',
            matchFormat,
            halfDurationMinutes: halfDuration,
            tournamentId: tourneyId,
          });

          matchCounter++;
        }
      }
    }

    // Playoff Knockout Matches (if League + Playoffs enabled)
    if (tournamentType === 'league_and_playoffs') {
      if (playoffFormat === 'top_2_final') {
        let finalTimeLabel = '';
        if (scheduleMode === 'single_day') {
          const formattedTime = formatCalculatedKickoff(firstGameKickoff, matchCounter, halfDuration, restGapMinutes);
          finalTimeLabel = `${formatReadableDate(singleDayDate)} • ${formattedTime}`;
        } else {
          currentWeekNumber++;
          finalTimeLabel = `${matchDayName}, Week ${currentWeekNumber} • ${firstGameKickoff} AM`;
        }

        generatedMatches.push({
          id: `FIX-${tourneyId.slice(-6)}-FINAL`,
          homeTeamId: '1st Place',
          awayTeamId: '2nd Place',
          homeScore: 0,
          awayScore: 0,
          minute: 0,
          isLive: false,
          isFinished: false,
          startTime: finalTimeLabel,
          venue: `De Anza Stadium (${tournamentName} Grand Final: 1st Place vs 2nd Place)`,
          possessionHome: 50,
          possessionAway: 50,
          shotsHome: 0,
          shotsAway: 0,
          shotsOnTargetHome: 0,
          shotsOnTargetAway: 0,
          foulsHome: 0,
          foulsAway: 0,
          events: [],
          weekNumber: currentWeekNumber,
          matchType: 'Special Event',
          status: 'scheduled',
          matchFormat,
          halfDurationMinutes: halfDuration,
          tournamentId: tourneyId,
        });
      } else if (playoffFormat === 'top_4_knockout') {
        let semi1Time = '';
        let semi2Time = '';
        let finalTime = '';

        if (scheduleMode === 'single_day') {
          semi1Time = `${formatReadableDate(singleDayDate)} • ${formatCalculatedKickoff(firstGameKickoff, matchCounter, halfDuration, restGapMinutes)}`;
          semi2Time = `${formatReadableDate(singleDayDate)} • ${formatCalculatedKickoff(firstGameKickoff, matchCounter + 1, halfDuration, restGapMinutes)}`;
          finalTime = `${formatReadableDate(singleDayDate)} • ${formatCalculatedKickoff(firstGameKickoff, matchCounter + 2, halfDuration, restGapMinutes)}`;
        } else {
          currentWeekNumber++;
          semi1Time = `${matchDayName}, Week ${currentWeekNumber} • 8:30 AM`;
          semi2Time = `${matchDayName}, Week ${currentWeekNumber} • 9:45 AM`;
          currentWeekNumber++;
          finalTime = `${matchDayName}, Week ${currentWeekNumber} • 10:30 AM`;
        }

        generatedMatches.push({
          id: `FIX-${tourneyId.slice(-6)}-SEMI1`,
          homeTeamId: '1st Place',
          awayTeamId: '4th Place',
          homeScore: 0,
          awayScore: 0,
          minute: 0,
          isLive: false,
          isFinished: false,
          startTime: semi1Time,
          venue: `De Anza Stadium (${tournamentName} Semi-Final 1: 1st vs 4th)`,
          possessionHome: 50,
          possessionAway: 50,
          shotsHome: 0,
          shotsAway: 0,
          shotsOnTargetHome: 0,
          shotsOnTargetAway: 0,
          foulsHome: 0,
          foulsAway: 0,
          events: [],
          weekNumber: currentWeekNumber,
          matchType: 'Special Event',
          status: 'scheduled',
          matchFormat,
          halfDurationMinutes: halfDuration,
          tournamentId: tourneyId,
        });

        generatedMatches.push({
          id: `FIX-${tourneyId.slice(-6)}-SEMI2`,
          homeTeamId: '2nd Place',
          awayTeamId: '3rd Place',
          homeScore: 0,
          awayScore: 0,
          minute: 0,
          isLive: false,
          isFinished: false,
          startTime: semi2Time,
          venue: `De Anza Stadium (${tournamentName} Semi-Final 2: 2nd vs 3rd)`,
          possessionHome: 50,
          possessionAway: 50,
          shotsHome: 0,
          shotsAway: 0,
          shotsOnTargetHome: 0,
          shotsOnTargetAway: 0,
          foulsHome: 0,
          foulsAway: 0,
          events: [],
          weekNumber: currentWeekNumber,
          matchType: 'Special Event',
          status: 'scheduled',
          matchFormat,
          halfDurationMinutes: halfDuration,
          tournamentId: tourneyId,
        });

        generatedMatches.push({
          id: `FIX-${tourneyId.slice(-6)}-FINAL`,
          homeTeamId: 'Semi 1 Winner',
          awayTeamId: 'Semi 2 Winner',
          homeScore: 0,
          awayScore: 0,
          minute: 0,
          isLive: false,
          isFinished: false,
          startTime: finalTime,
          venue: `De Anza Stadium (${tournamentName} Grand Final)`,
          possessionHome: 50,
          possessionAway: 50,
          shotsHome: 0,
          shotsAway: 0,
          shotsOnTargetHome: 0,
          shotsOnTargetAway: 0,
          foulsHome: 0,
          foulsAway: 0,
          events: [],
          weekNumber: currentWeekNumber,
          matchType: 'Special Event',
          status: 'scheduled',
          matchFormat,
          halfDurationMinutes: halfDuration,
          tournamentId: tourneyId,
        });
      }
    }

    const newTournament: SpecialTournament = {
      id: tourneyId,
      name: tournamentName.trim() || 'Sunday Special Tournament',
      teams: finalTeams,
      matchFormat,
      halfDurationMinutes: halfDuration,
      tournamentType,
      leagueRounds,
      playoffFormat,
      createdAt: tournamentToEdit ? tournamentToEdit.createdAt : new Date().toISOString(),
      isCompleted: false,
    };

    onCreateTournament(newTournament, generatedMatches);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xl overflow-y-auto"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-[#070c14] border-2 border-amber-400/60 rounded-3xl p-5 sm:p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-white space-y-5 max-h-[92vh] flex flex-col min-h-0 custom-scrollbar"
      >
        {/* Header Title */}
        <div className="flex items-center justify-between border-b border-amber-400/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center shadow-lg border border-amber-300/40">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-wider text-amber-300 f1-header">
                {tournamentToEdit ? '✏️ Edit Special Event Tournament' : '⭐ Tournament Creator Wizard'}
              </h3>
              <p className="text-xs text-gray-300">
                Design, customize teams, logos & rosters, and auto-generate fixtures
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator Bar (4 Steps) */}
        <div className="grid grid-cols-4 gap-1.5 text-center text-xs font-bold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`py-2 rounded-xl transition-all border text-[11px] ${
              step === 1
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-black'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            1. Rules
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className={`py-2 rounded-xl transition-all border text-[11px] ${
              step === 2
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-black'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            2. Schedule
          </button>

          <button
            type="button"
            onClick={() => setStep(3)}
            className={`py-2 rounded-xl transition-all border text-[11px] ${
              step === 3
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-black'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            3. Teams ({teamCount})
          </button>

          <button
            type="button"
            onClick={() => setStep(4)}
            className={`py-2 rounded-xl transition-all border text-[11px] ${
              step === 4
                ? 'bg-amber-500/20 text-amber-300 border-amber-400/60 font-black'
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white'
            }`}
          >
            4. Launch
          </button>
        </div>

        {/* Wizard Step Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 custom-scrollbar">
          {/* STEP 1: FORMAT & RULES */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                  Tournament / Event Name
                </label>
                <input
                  type="text"
                  value={tournamentName}
                  onChange={(e) => setTournamentName(e.target.value)}
                  placeholder="e.g. Dashain Cup 2026"
                  className="w-full bg-[#03060a] border border-amber-400/40 rounded-xl px-3.5 py-2.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                  required
                />
              </div>

              {/* Match Format & Half Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                    Match Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['7v7', '8v8', '11v11'] as const).map((fmt) => (
                      <button
                        key={`fmt-${fmt}`}
                        type="button"
                        onClick={() => setMatchFormat(fmt)}
                        className={`py-2 rounded-xl text-xs font-black transition-all border ${
                          matchFormat === fmt
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                            : 'bg-[#03060a] text-gray-300 border-white/10 hover:border-amber-400/40'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                    Half Duration (Minutes)
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[15, 20, 25, 30, 45].map((mins) => (
                      <button
                        key={`min-${mins}`}
                        type="button"
                        onClick={() => setHalfDuration(mins)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          halfDuration === mins
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                            : 'bg-[#03060a] text-gray-300 border-white/10 hover:border-amber-400/40'
                        }`}
                      >
                        {mins}'
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Competition Structure */}
              <div className="p-4 rounded-2xl bg-[#03060a] border border-amber-400/30 space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Competition Structure
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setTournamentType('league_only')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      tournamentType === 'league_only'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <p className="font-extrabold text-xs">⚽ League Only</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Round-robin table determines the champion based on points & GD</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTournamentType('league_and_playoffs')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      tournamentType === 'league_and_playoffs'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <p className="font-extrabold text-xs">🏆 League + Playoff Cups</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Round-robin league followed by knockout finals or semi-finals</p>
                  </button>
                </div>
              </div>

              {/* Rounds & Playoff Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                    League Rounds (Legs)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { r: 1, label: '1 Leg (Single)' },
                      { r: 2, label: '2 Legs (H/A)' },
                      { r: 3, label: '3 Legs' },
                    ].map((item) => (
                      <button
                        key={`leg-${item.r}`}
                        type="button"
                        onClick={() => setLeagueRounds(item.r)}
                        className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                          leagueRounds === item.r
                            ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                            : 'bg-[#03060a] text-gray-300 border-white/10 hover:border-amber-400/40'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {tournamentType === 'league_and_playoffs' && (
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                      Playoff Cup Format
                    </label>
                    <select
                      value={playoffFormat}
                      onChange={(e) => setPlayoffFormat(e.target.value as any)}
                      className="w-full bg-[#03060a] border border-amber-400/40 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                    >
                      <option value="top_2_final">🥇 Top 2 Grand Final (1st vs 2nd)</option>
                      <option value="top_4_knockout">⚡ Top 4 Knockout (Semis & Final)</option>
                      <option value="super_cup">👑 Super Cup (League Cup + Super Cup)</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: FIXTURE SCHEDULING OPTIONS */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#03060a] border border-amber-400/30 space-y-3">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Select Scheduling Mode
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('weekly')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      scheduleMode === 'weekly'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-amber-400" />
                      <p className="font-extrabold text-xs">📅 Multi-Week League</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      Fixtures spread across multiple match weeks
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScheduleMode('single_day')}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                      scheduleMode === 'single_day'
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <p className="font-extrabold text-xs">⚡ Single Day Blitz Tournament</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      All matches played back-to-back on a single date with custom rest gaps
                    </p>
                  </button>
                </div>
              </div>

              {scheduleMode === 'weekly' ? (
                <div className="p-4 rounded-2xl bg-[#03060a] border border-white/15 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        Matches Per Week
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[1, 2, 3].map((g) => (
                          <button
                            key={`games-wk-${g}`}
                            type="button"
                            onClick={() => setGamesPerWeek(g)}
                            className={`py-2 rounded-xl text-xs font-black transition-all border ${
                              gamesPerWeek === g
                                ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-400/40'
                            }`}
                          >
                            {g} Game{g > 1 ? 's' : ''}/Wk
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        Match Day
                      </label>
                      <select
                        value={matchDayName}
                        onChange={(e) => setMatchDayName(e.target.value)}
                        className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      >
                        <option value="Sunday">Sunday League</option>
                        <option value="Saturday">Saturday Super Cup</option>
                        <option value="Wednesday">Wednesday Midweek</option>
                        <option value="Friday">Friday Night Lights</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        First Kickoff Time
                      </label>
                      <input
                        type="time"
                        value={firstGameKickoff}
                        onChange={(e) => setFirstGameKickoff(e.target.value)}
                        className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        Rest / Gap Duration Between Games
                      </label>
                      <select
                        value={restGapMinutes}
                        onChange={(e) => setRestGapMinutes(Number(e.target.value))}
                        className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      >
                        <option value={15}>15 Minutes Rest</option>
                        <option value={20}>20 Minutes Rest</option>
                        <option value={25}>25 Minutes Rest</option>
                        <option value={30}>30 Minutes Rest</option>
                        <option value={45}>45 Minutes Rest</option>
                        <option value={60}>60 Minutes Rest</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-[#03060a] border border-white/15 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        Tournament Date
                      </label>
                      <input
                        type="date"
                        value={singleDayDate}
                        onChange={(e) => setSingleDayDate(e.target.value)}
                        className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                        First Game Kickoff Time
                      </label>
                      <input
                        type="time"
                        value={firstGameKickoff}
                        onChange={(e) => setFirstGameKickoff(e.target.value)}
                        className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5">
                      Rest / Gap Duration Between Back-to-Back Games
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[15, 20, 25, 30, 45].map((mins) => (
                        <button
                          key={`rest-gap-${mins}`}
                          type="button"
                          onClick={() => setRestGapMinutes(mins)}
                          className={`py-2 rounded-xl text-xs font-extrabold transition-all border ${
                            restGapMinutes === mins
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md font-black'
                              : 'bg-[#080d14] text-gray-300 border-white/10 hover:border-amber-400/40'
                          }`}
                        >
                          {mins}' Rest
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Calculation Preview */}
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/30 text-xs space-y-1">
                    <p className="font-extrabold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Single Day Tournament Timeline Preview</span>
                    </p>
                    <p className="text-[11px] text-gray-300 font-mono">
                      Game 1: {formatCalculatedKickoff(firstGameKickoff, 0, halfDuration, restGapMinutes)} • Game 2: {formatCalculatedKickoff(firstGameKickoff, 1, halfDuration, restGapMinutes)} • Game 3: {formatCalculatedKickoff(firstGameKickoff, 2, halfDuration, restGapMinutes)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TEAMS & ROSTER SETUP */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#03060a] border border-amber-400/30">
                <div>
                  <p className="text-xs font-extrabold uppercase text-amber-300">Number of Participating Teams</p>
                  <p className="text-[10px] text-gray-400">Choose team count for this special event</p>
                </div>

                <div className="flex items-center gap-2">
                  {[3, 4, 6, 8].map((cnt) => (
                    <button
                      key={`cnt-${cnt}`}
                      type="button"
                      onClick={() => handleTeamCountChange(cnt)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                        teamCount === cnt
                          ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-md'
                          : 'bg-white/5 text-gray-300 border-white/10 hover:border-amber-400/40'
                      }`}
                    >
                      {cnt} Teams
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Customizer List */}
              <div className="space-y-4">
                {customTeams.map((t, idx) => (
                  <div
                    key={`custom-t-${idx}`}
                    className="p-4 rounded-2xl bg-[#03060a] border border-white/15 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        Team #{idx + 1} Settings
                      </span>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">Kit Color:</span>
                        <input
                          type="color"
                          value={t.colorPrimary || PRESET_COLORS[idx % PRESET_COLORS.length].primary}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomTeams((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, colorPrimary: val } : item))
                            );
                          }}
                          className="w-6 h-6 rounded border-none cursor-pointer bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Name, Short Name, Logo Upload */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Team Name
                        </label>
                        <input
                          type="text"
                          value={t.name || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomTeams((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                            );
                          }}
                          placeholder={`e.g. Team ${String.fromCharCode(65 + idx)}`}
                          className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                          Abbr / Short Code
                        </label>
                        <input
                          type="text"
                          maxLength={5}
                          value={t.shortName || ''}
                          onChange={(e) => {
                            const val = e.target.value.toUpperCase();
                            setCustomTeams((prev) =>
                              prev.map((item, i) => (i === idx ? { ...item, shortName: val } : item))
                            );
                          }}
                          placeholder={`TM${String.fromCharCode(65 + idx)}`}
                          className="w-full bg-[#080d14] border border-white/15 rounded-xl px-3 py-2 text-white text-xs font-mono font-black focus:border-amber-400 focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    {/* LOGO UPLOAD & PRESETS */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                        Team Logo Badge (Upload File or Select Preset)
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Image Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleLogoFileUpload(idx, e.target.files[0]);
                              }
                            }}
                            className="hidden"
                          />
                        </label>

                        {/* Preset logos */}
                        {PRESET_LOGOS.map((p) => (
                          <button
                            key={`preset-${p.label}-${idx}`}
                            type="button"
                            onClick={() => {
                              setCustomTeams((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, logoUrl: p.url } : item))
                              );
                            }}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                              t.logoUrl === p.url
                                ? 'bg-amber-500 text-slate-950 border-amber-300'
                                : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
                            }`}
                          >
                            <img src={p.url} alt={p.label} className="w-3.5 h-3.5 object-contain" />
                            <span>{p.label}</span>
                          </button>
                        ))}
                      </div>

                      {t.logoUrl && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">Active Logo:</span>
                          <img src={t.logoUrl} alt="Logo" className="w-6 h-6 object-contain rounded-full border border-amber-400/40" />
                          <button
                            type="button"
                            onClick={() => {
                              setCustomTeams((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, logoUrl: '' } : item))
                              );
                            }}
                            className="text-[10px] text-red-400 hover:underline cursor-pointer"
                          >
                            Remove Logo
                          </button>
                        </div>
                      )}
                    </div>

                    {/* EXPANDABLE INLINE PLAYER ROSTER REGISTRATION */}
                    <div className="border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedRosterTeamIdx(expandedRosterTeamIdx === idx ? null : idx)}
                        className="w-full flex items-center justify-between text-xs font-bold text-gray-300 hover:text-amber-300 transition-colors py-1 cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 text-amber-400" />
                          <span>Register Squad / Players ({t.roster?.length || 0} Registered)</span>
                        </span>
                        {expandedRosterTeamIdx === idx ? (
                          <ChevronUp className="w-4 h-4 text-amber-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </button>

                      {expandedRosterTeamIdx === idx && (
                        <div className="mt-3 space-y-3 p-3 rounded-xl bg-[#080d14] border border-white/10">
                          {/* Add Player Input Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                            <input
                              type="text"
                              placeholder="Player Name"
                              value={newPlayerName}
                              onChange={(e) => setNewPlayerName(e.target.value)}
                              className="sm:col-span-2 bg-[#03060a] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="#"
                                value={newPlayerNumber}
                                onChange={(e) => setNewPlayerNumber(Number(e.target.value))}
                                className="w-16 bg-[#03060a] border border-white/15 rounded-lg px-2.5 py-1.5 text-white text-xs font-mono font-bold focus:border-amber-400 focus:outline-none"
                              />
                              <select
                                value={newPlayerPos}
                                onChange={(e) => setNewPlayerPos(e.target.value as any)}
                                className="flex-1 bg-[#03060a] border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs font-bold focus:border-amber-400 focus:outline-none"
                              >
                                <option value="FWD">FWD</option>
                                <option value="MID">MID</option>
                                <option value="DEF">DEF</option>
                                <option value="GK">GK</option>
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAddPlayerToTeam(idx)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Player</span>
                            </button>
                          </div>

                          {/* Roster List */}
                          {t.roster && t.roster.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                              {t.roster.map((player) => (
                                <div
                                  key={player.id}
                                  className="flex items-center justify-between p-2 rounded-lg bg-[#03060a] border border-white/10 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-amber-400 font-bold">
                                      #{player.number}
                                    </span>
                                    <span className="font-bold text-white">{player.name}</span>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                                      {player.position}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePlayerFromTeam(idx, player.id)}
                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-gray-400 italic">No players registered yet for this team. Type player details above to add!</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & LAUNCH */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#03060a] to-[#03060a] border-2 border-amber-400/50 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-400/30 pb-3">
                  <div>
                    <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
                      🏆 {tournamentName}
                    </h4>
                    <p className="text-xs text-gray-300 font-mono">
                      {matchFormat} • {halfDuration} Min Halves • {tournamentType === 'league_only' ? 'League Only' : 'League + Playoff Cups'}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-black">
                    READY TO LAUNCH
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Teams</p>
                    <p className="font-black text-amber-300 text-sm">{customTeams.length}</p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Schedule Mode</p>
                    <p className="font-black text-amber-300 text-xs uppercase truncate">
                      {scheduleMode === 'single_day' ? 'Single Day Blitz' : `${gamesPerWeek} Games/Wk`}
                    </p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Rest Gap</p>
                    <p className="font-black text-amber-300 text-sm">{restGapMinutes}' Rest</p>
                  </div>

                  <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-[10px] text-gray-400 uppercase font-bold">Playoffs</p>
                    <p className="font-black text-amber-300 text-xs truncate">
                      {tournamentType === 'league_only' ? 'None' : playoffFormat.replace('_', ' ').toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Participating Teams Showcase */}
              <div>
                <p className="text-xs font-extrabold uppercase text-amber-300 mb-2">
                  Participating Teams Showcase
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {customTeams.map((t, idx) => (
                    <div
                      key={`prev-t-${idx}`}
                      style={{ borderColor: t.colorPrimary || '#B7CEEC' }}
                      className="p-2.5 rounded-xl bg-[#03060a] border-l-4 border-y border-r border-white/10 text-xs flex items-center gap-2"
                    >
                      {t.logoUrl ? (
                        <img src={t.logoUrl} alt={t.name} className="w-7 h-7 object-contain rounded-full border border-amber-400/40 shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[10px] shrink-0 border border-amber-400/30">
                          {t.shortName ? t.shortName.substring(0, 2) : `T${idx + 1}`}
                        </div>
                      )}
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{t.name}</p>
                        <p className="text-[10px] text-gray-400 font-mono">{t.roster?.length || 0} Players</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Footer Buttons */}
        <div className="flex items-center justify-between border-t border-amber-400/30 pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Next Step →</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={generateTournamentData}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-xl transition-all cursor-pointer flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>{tournamentToEdit ? '💾 Update Special Event' : '🚀 Create & Launch Special Event'}</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
