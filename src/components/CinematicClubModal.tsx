import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Users,
  MapPin,
  User,
  ChevronRight,
  Info,
  Trophy,
  Award,
  Shield,
  Search,
  Flame,
  Calendar,
  Sparkles,
  LayoutGrid,
  Briefcase,
} from 'lucide-react';
import { Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';
import { Player3DAvatar } from './Player3DAvatar';
import { TiltCard } from './TiltCard';

interface CinematicClubModalProps {
  team: Team | null;
  allTeams: Team[];
  onClose: () => void;
  onSelectPlayer: (player: Player, team: Team) => void;
  onOpenAdmin: (team: Team) => void;
  onTriggerCinematic3D: () => void;
  isSoundEnabled?: boolean;
}

const CLUB_EXTENDED_DETAILS: Record<
  string,
  {
    founded: string;
    stadiumCapacity: string;
    nickname: string;
    headCoach: string;
    bio: string;
    achievements: string[];
    clubCulture: string;
  }
> = {
  'momo-strikers': {
    founded: '2021',
    stadiumCapacity: '12,500 (Steam Arena)',
    nickname: 'The Dumpling Kings',
    headCoach: 'Sujjan "Chef" Maharjan',
    bio: 'Founded in 2021 by local futsal enthusiasts over steaming plates of buff momos in Kathmandu. Renowned for their high-octane pressing, clinical counter-attacks, and savory post-match celebrations.',
    achievements: [
      'Winter Futsal Cup Champions 2023',
      'Highest Goals Per Match (2.8 GPG)',
      'Fair Play League Award 2024',
    ],
    clubCulture: 'High-energy pressing, post-game dumplings, and unwavering team camaraderie.',
  },
  'no-stamina': {
    founded: '2022',
    stadiumCapacity: '8,000 (Oxygen Park)',
    nickname: 'The Oxygen Tankers',
    headCoach: 'Prashant "Gas Out" Adhikari',
    bio: 'Born out of weekend pickup matches where talent was 100% and cardio was 5%. Famous for explosive early-game blitzes, tactical water breaks, and frantic 70th-minute substitutions.',
    achievements: [
      'Sub-In Record Holders (45 Tactical Subs)',
      'Best First 20-Minute Goal Ratio',
      'Runner-up League Super Cup 2023',
    ],
    clubCulture: 'Max effort in short bursts, tactical breaks, and pure passion till the last breath.',
  },
  'jhyap-warriors': {
    founded: '2020',
    stadiumCapacity: '15,000 (Chill Turf Grounds)',
    nickname: 'The Night Owls',
    headCoach: 'Sanjay "Juice Master" Bista',
    bio: 'A legendary social squad where tactics are drawn over cold beverages and weekend banter. Though unpredictable on the pitch, their team spirit is the most celebrated in the entire league.',
    achievements: [
      'Fan Favorite Club 3 Years Running',
      'Best Comeback Win of the Season 2023',
      'Most Long-Distance Spectacular Goals',
    ],
    clubCulture: 'Zero stress, pure enjoyment, and turning every match day into a festive gathering.',
  },
};

export const CinematicClubModal: React.FC<CinematicClubModalProps> = ({
  team,
  allTeams,
  onClose,
  onSelectPlayer,
  onOpenAdmin,
  onTriggerCinematic3D,
  isSoundEnabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'about'>('overview');
  const [squadPosFilter, setSquadPosFilter] = useState<'ALL' | 'FWD' | 'MID' | 'DEF' | 'GK'>('ALL');
  const [memberSearch, setMemberSearch] = useState('');

  // Calculate team position/rank dynamically from allTeams
  const sortedTeams = [...allTeams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return (a.rank || 99) - (b.rank || 99);
  });

  const rankIndex = team ? sortedTeams.findIndex((t) => t.id === team.id) : -1;
  const leagueRank = rankIndex !== -1 ? rankIndex + 1 : team?.rank || 1;

  const extraDetails = {
    founded: team?.founded || (team ? CLUB_EXTENDED_DETAILS[team.id]?.founded : '') || '2022',
    stadiumCapacity: team?.stadiumCapacity || (team?.homeStadium ? `${team.homeStadium}` : '10,000'),
    nickname: team?.nickname || (team ? CLUB_EXTENDED_DETAILS[team.id]?.nickname : '') || team?.shortName || '',
    headCoach: team?.headCoach || team?.manager || team?.adminName || 'Team Head Coach',
    bio: team?.bio || (team ? CLUB_EXTENDED_DETAILS[team.id]?.bio : '') || `Official squad profile and roster details for ${team?.name}. Competing at the highest level of Sunday futsal action.`,
    achievements: team?.achievements || (team ? CLUB_EXTENDED_DETAILS[team.id]?.achievements : null) || ['League Contenders', 'Fan Favorite Squad'],
    clubCulture: team?.clubCulture || (team ? CLUB_EXTENDED_DETAILS[team.id]?.clubCulture : '') || 'Passion, teamwork, and victory on every matchday.',
  };

  // Holographic Mouse Tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setTilt({
      x: (y / rect.height) * -12,
      y: (x / rect.width) * 12,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const playCrowdRoar = () => {
    if (!isSoundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch (e) {
      // Audio fallback
    }
  };

  // Filter squad members for About view
  const filteredRoster = (team?.roster || []).filter((player) => {
    const matchesPos = squadPosFilter === 'ALL' || player.position === squadPosFilter;
    const matchesQuery =
      player.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
      player.number.toString().includes(memberSearch);
    return matchesPos && matchesQuery;
  });

  return (
    <AnimatePresence>
      {team && (
        <motion.div
          key={`cinematic-club-modal-${team.id}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl overflow-y-auto"
        >
          {/* Ambient Atmosphere Spotlight */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] bg-[#B7CEEC]/15 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 translate-y-1/2 w-[28rem] h-[28rem] bg-[#4C787E]/25 rounded-full blur-[140px] pointer-events-none" />

          <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 35 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.88, y: 35 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transition: 'transform 0.15s ease-out',
          }}
          className="relative w-full max-w-lg my-auto rounded-3xl bg-[#0A1118]/95 border border-[#B7CEEC]/40 p-5 sm:p-6 shadow-[0_0_50px_rgba(183,206,236,0.25)] text-white overflow-hidden"
        >
          {/* Top Bar Controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#4C787E]/30">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-black">
                #{leagueRank} RANK
              </span>

              {/* View Toggle Buttons */}
              <div className="flex items-center bg-[#122428] p-0.5 rounded-xl border border-[#348781]/40">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'overview'
                      ? 'bg-[#348781] text-white shadow-sm'
                      : 'text-[#B7CEEC]/70 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  Overview
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('about')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                    activeTab === 'about'
                      ? 'bg-[#348781] text-white shadow-sm'
                      : 'text-[#B7CEEC]/70 hover:text-white'
                  }`}
                >
                  <Info className="w-3 h-3 text-amber-300" />
                  About Club
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Club Header & Emblem */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-5 text-center sm:text-left">
            <div className="relative group shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-r from-[#B7CEEC] to-[#4C787E] rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>
              <div className="relative p-2 rounded-2xl bg-[#0A1118] border border-[#B7CEEC]/50 shadow-xl">
                <TeamLogo teamId={team.id} size={72} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                {team.name}
              </h2>

              <p className="text-xs text-amber-300 font-semibold italic mt-0.5">
                "{team.motto}"
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-2 text-xs text-[#B7CEEC]">
                {team.homeStadium && (
                  <span className="flex items-center gap-1 bg-[#122428]/80 px-2.5 py-1 rounded-lg border border-[#348781]/40">
                    <MapPin className="w-3.5 h-3.5 text-[#348781]" />
                    {team.homeStadium}
                  </span>
                )}
                {team.manager && (
                  <span className="flex items-center gap-1 bg-[#122428]/80 px-2.5 py-1 rounded-lg border border-[#348781]/40">
                    <User className="w-3.5 h-3.5 text-[#348781]" />
                    Mgr: {team.manager}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW VIEW */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Stats Bar Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-5">
                {[
                  { label: 'PTS', val: team.points, highlight: true },
                  { label: 'PL', val: team.played },
                  { label: 'W', val: team.won },
                  { label: 'D', val: team.drawn },
                  { label: 'L', val: team.lost },
                  {
                    label: 'GD',
                    val: team.goalDifference >= 0 ? `+${team.goalDifference}` : team.goalDifference,
                  },
                ].map((stat, idx) => (
                  <div
                    key={`cinematic-stat-${stat.label}-${idx}`}
                    className={`p-2 rounded-xl text-center border ${
                      stat.highlight
                        ? 'bg-[#122428] border-[#B7CEEC] shadow-[0_0_12px_rgba(183,206,236,0.3)]'
                        : 'bg-[#0A1118]/80 border-[#4C787E]/30'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-[#B7CEEC]/80 uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p
                      className={`text-base font-black ${
                        stat.highlight ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {stat.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* Top Players / Squad Preview */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h3 className="text-xs font-bold text-[#B7CEEC] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#348781]" />
                    Key Roster Players ({team.roster?.length || team.squadCount || 0})
                  </h3>
                  <span className="text-[10px] text-[#B7CEEC]/70">Click player to view 3D Card</span>
                </div>

                {team.roster && team.roster.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#4C787E]/40">
                    {team.roster.map((player, idx) => (
                      <TiltCard
                        key={`roster-${player.id}-${idx}`}
                        onClick={() => {
                          onSelectPlayer(player, team);
                          playCrowdRoar();
                        }}
                        maxTilt={8}
                        scale={1.03}
                        glowColor="rgba(52, 135, 129, 0.3)"
                        className="p-2 rounded-xl bg-[#0A1118]/80 hover:bg-[#122428] border border-[#4C787E]/30 hover:border-[#B7CEEC] flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#122428] border border-[#348781] flex items-center justify-center text-[10px] font-black text-amber-300">
                            #{player.number}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate group-hover:text-[#B7CEEC] transition-colors">
                              {player.name}
                            </p>
                            <p className="text-[10px] text-[#B7CEEC]/70 font-semibold">
                              {player.position} • {player.goals || 0} goals
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#B7CEEC] group-hover:translate-x-0.5 transition-all" />
                      </TiltCard>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B7CEEC]/60 italic p-2 bg-[#0A1118]/50 rounded-xl">
                    No players added to roster yet. Use Team Admin to manage squad.
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: ABOUT CLUB & MEMBERS DETAILED VIEW */}
          {activeTab === 'about' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 max-h-[22rem] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#4C787E]/40"
            >
              {/* Club Story & History */}
              <div className="p-3.5 rounded-2xl bg-[#122428]/80 border border-[#348781]/40">
                <div className="flex items-center gap-2 mb-1.5 text-amber-300">
                  <Shield className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-white">
                    Club History & Heritage
                  </h3>
                </div>
                <p className="text-xs text-[#B7CEEC]/90 leading-relaxed font-sans">
                  {extraDetails.bio}
                </p>
              </div>

              {/* Key Quick Facts Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[#0A1118]/90 border border-[#4C787E]/30 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#B7CEEC]/70 uppercase font-bold block">
                      Founded
                    </span>
                    <span className="font-extrabold text-white">{extraDetails.founded}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0A1118]/90 border border-[#4C787E]/30 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#348781] shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#B7CEEC]/70 uppercase font-bold block">
                      Stadium Ground
                    </span>
                    <span className="font-extrabold text-white truncate block max-w-[130px]">
                      {extraDetails.stadiumCapacity}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0A1118]/90 border border-[#4C787E]/30 flex items-center gap-2">
                  <User className="w-4 h-4 text-amber-300 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#B7CEEC]/70 uppercase font-bold block">
                      Head Coach
                    </span>
                    <span className="font-extrabold text-white truncate block max-w-[130px]">
                      {extraDetails.headCoach}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-[#0A1118]/90 border border-[#4C787E]/30 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="text-[10px] text-[#B7CEEC]/70 uppercase font-bold block">
                      Club Culture
                    </span>
                    <span className="font-extrabold text-white truncate block max-w-[130px]">
                      {extraDetails.nickname}
                    </span>
                  </div>
                </div>
              </div>

              {/* Club Honors & Achievements */}
              <div className="p-3 rounded-2xl bg-[#0A1118]/80 border border-[#4C787E]/30">
                <div className="flex items-center gap-1.5 mb-2 text-amber-300">
                  <Trophy className="w-4 h-4" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Honors & Milestones
                  </h4>
                </div>
                <div className="space-y-1.5">
                  {extraDetails.achievements.map((ach, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#B7CEEC]">
                      <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{ach}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Board Members & Leadership Section */}
              <div className="p-3.5 rounded-2xl bg-[#0A1118]/90 border border-[#348781]/40 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-amber-300">
                    <Briefcase className="w-4 h-4" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-white">
                      Board Members & Leadership
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#122428] text-amber-300 font-bold border border-amber-400/30">
                    {team.boardMembers?.length || 0} Members
                  </span>
                </div>

                {team.boardMembers && team.boardMembers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {team.boardMembers.map((bm, idx) => (
                      <div
                        key={`bm-${bm.id}-${idx}`}
                        className="p-2.5 rounded-xl bg-[#102032] border border-[#4C787E]/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white truncate">{bm.name}</p>
                          <p className="text-[10px] text-[#B7CEEC] font-medium">{bm.designation}</p>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B7CEEC]/60 italic p-2 bg-[#102032]/50 rounded-xl">
                    No board members registered. Add board members in Team Admin.
                  </p>
                )}
              </div>

              {/* Full Squad Roster Breakdown */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <h4 className="text-xs font-bold text-[#B7CEEC] uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#348781]" />
                    Club Members & Roster ({filteredRoster.length})
                  </h4>

                  {/* Position Filter Pills */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {(['ALL', 'FWD', 'MID', 'DEF', 'GK'] as const).map((pos, idx) => (
                      <button
                        key={`cinematic-pos-${pos}-${idx}`}
                        type="button"
                        onClick={() => setSquadPosFilter(pos)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          squadPosFilter === pos
                            ? 'bg-[#348781] text-white'
                            : 'bg-[#122428] text-[#B7CEEC]/70 hover:text-white'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Member Search Input */}
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search member name or shirt #..."
                    className="w-full bg-[#122428]/90 border border-[#348781]/40 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#B7CEEC]"
                  />
                </div>

                {/* Members List Grid */}
                {filteredRoster.length > 0 ? (
                  <div className="space-y-1.5">
                    {filteredRoster.map((player, idx) => (
                      <div
                        key={`filtered-${player.id}-${idx}`}
                        onClick={() => {
                          onSelectPlayer(player, team);
                          playCrowdRoar();
                        }}
                        className="p-2 rounded-xl bg-[#122428]/60 hover:bg-[#122428] border border-[#4C787E]/30 hover:border-[#B7CEEC] flex items-center justify-between cursor-pointer transition-all group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Player3DAvatar player={player} teamId={team.id} size="sm" className="w-8 h-8 shrink-0" />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-white group-hover:text-[#B7CEEC] transition-colors truncate">
                                {player.name}
                              </p>
                              {player.isCaptain && (
                                <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 text-[9px] font-black rounded border border-amber-400/40">
                                  C
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-[#B7CEEC]/70">
                              {player.position} • {player.goals || 0} Goals, {player.assists || 0} Assists
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#0A1118] border border-[#348781]/40 text-[#B7CEEC] group-hover:border-[#B7CEEC]">
                            View Card
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#B7CEEC] group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#B7CEEC]/60 italic p-3 bg-[#0A1118]/50 rounded-xl text-center">
                    No matching members found.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};
