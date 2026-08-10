import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronUp, Shield, Trophy, Sparkles, Users, Settings, ChevronRight } from 'lucide-react';
import { Team, Player } from '../types';
import { TeamLogo } from './TeamLogos';
import { TiltCard } from './TiltCard';

interface State4TopClubsProps {
  teams: Team[];
  onNext: () => void;
  onOpenAdmin: (team: Team) => void;
  onSelectTeam: (team: Team) => void;
  onSelectPlayer?: (player: Player, team: Team) => void;
}

export const State4TopClubs: React.FC<State4TopClubsProps> = ({
  teams,
  onNext,
  onOpenAdmin,
  onSelectTeam,
  onSelectPlayer,
}) => {
  // Dynamically sort teams by standings (points > goalDifference > goalsFor > won > rank)
  const sortedTeams = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return (a.rank || 99) - (b.rank || 99);
  });

  const rank1Team = sortedTeams[0] || teams[0];
  const rank2Team = sortedTeams[1] || teams[1] || teams[0];
  const rank3Team = sortedTeams[2] || teams[2] || teams[0];

  const [selectedTeamId, setSelectedTeamId] = useState<string>(rank1Team?.id || teams[0]?.id);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId) || teams[0];

  const handleTeamClick = (team: Team) => {
    setSelectedTeamId(team.id);
    onSelectTeam(team);
  };

  // Podium order: Left (#2 Rank), Center (#1 Rank), Right (#3 Rank)
  const podiumData = [
    {
      team: rank2Team,
      placeLabel: '2ND',
      rankNum: '#2',
      heightClass: 'h-36 sm:h-40',
      logoSize: 76,
      pillTag: rank2Team?.shortName || 'NSH',
      cylinderColor: 'from-[#05080c] via-[#080d14] to-[#020406]',
      ringColor: 'border-[#B7CEEC]/60',
    },
    {
      team: rank1Team,
      placeLabel: '1ST',
      rankNum: '#1',
      heightClass: 'h-36 sm:h-40',
      logoSize: 76,
      pillTag: rank1Team?.shortName || 'MOMO',
      cylinderColor: 'from-[#080d14] via-[#4C787E]/30 to-[#05080c]',
      ringColor: 'border-[#4C787E]',
    },
    {
      team: rank3Team,
      placeLabel: '3RD',
      rankNum: '#3',
      heightClass: 'h-36 sm:h-40',
      logoSize: 76,
      pillTag: rank3Team?.shortName || 'JHYAP',
      cylinderColor: 'from-[#05080c] via-[#080d14] to-[#020406]',
      ringColor: 'border-[#B7CEEC]/40',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-3 sm:px-6 py-6 relative z-10 select-none overflow-hidden">
      {/* Top Section Tag */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-1 flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/85 backdrop-blur-xl text-xs font-bold text-[#B7CEEC] shadow-xl"
      >
        <Shield className="w-4 h-4 text-[#4C787E]" />
        <span className="f1-header text-[11px] tracking-[0.2em]">PARTICIPATING CLUBS ({sortedTeams.length})</span>
      </motion.div>

      {/* 3D WINNERS PODIUM STAGE */}
      <div className="w-full max-w-lg my-1 flex flex-col items-center">
        <div className="text-center mb-3">
          <h2 className="text-2xl sm:text-3xl font-black text-white f1-header tracking-[0.15em] uppercase flex items-center justify-center gap-2 drop-shadow-lg">
            <Trophy className="w-6 h-6 text-[#B7CEEC] animate-pulse" />
            TOP LEAGUE CONTENDERS
          </h2>
        </div>

        {/* 3D PODIUM CONTAINER */}
        <div className="relative w-full pt-12 pb-4 flex items-end justify-center gap-2 sm:gap-4 px-2">
          {/* Background Ambient Stadium Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#4C787E]/20 rounded-full blur-[90px] pointer-events-none" />

          {podiumData.map((item) => {
            if (!item.team) return null;
            const isSelected = selectedTeamId === item.team.id;

            return (
              <motion.div
                key={`podium-${item.placeLabel}-${item.team.id}`}
                layout
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                onClick={() => handleTeamClick(item.team)}
                className="relative flex flex-col items-center cursor-pointer group z-10 flex-1 max-w-[120px]"
              >
                {/* Shifting Sparkling Light Beam / Spotlight */}
                {isSelected && (
                  <motion.div
                    layoutId="sparkling-spotlight"
                    className="absolute -inset-x-4 -top-8 -bottom-4 pointer-events-none z-0 flex flex-col items-center justify-start"
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                  >
                    {/* Top Cone Spotlight Glow */}
                    <div className="w-full h-full bg-gradient-to-b from-[#B7CEEC]/30 via-[#4C787E]/20 to-transparent rounded-t-full blur-xl" />
                    {/* Floating Animated Sparkles */}
                    <div className="absolute -top-4 inset-x-0 flex justify-between px-2">
                      <Sparkles className="w-4 h-4 text-[#4C787E] animate-pulse" />
                      <Sparkles className="w-5 h-5 text-white animate-bounce" />
                      <Sparkles className="w-4 h-4 text-[#B7CEEC] animate-pulse delay-150" />
                    </div>
                  </motion.div>
                )}

                {/* Floating 3D Team Emblem Logo */}
                <motion.div
                  animate={{
                    y: isSelected ? [0, -8, 0] : [0, -4, 0],
                    scale: isSelected ? 1.12 : 1,
                  }}
                  transition={{
                    y: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
                    scale: { type: 'spring', stiffness: 300, damping: 20 },
                  }}
                  className="relative mb-2 z-20 flex flex-col items-center"
                >
                  {/* 3D Shield Outline and Logo */}
                  <div
                    className={`relative p-2 rounded-2xl transition-all ${
                      isSelected
                        ? 'bg-[#080d14] border-2 border-[#4C787E] shadow-[0_0_25px_rgba(76,120,126,0.6)]'
                        : 'bg-[#05080c]/90 border border-[#B7CEEC]/30 group-hover:border-[#4C787E]'
                    }`}
                  >
                    <TeamLogo teamId={item.team.id} size={item.logoSize} />
                  </div>
                </motion.div>

                {/* 3D CYLINDRICAL PEDESTAL */}
                <div className="relative w-full flex flex-col items-center">
                  {/* Cylinder Top Cap */}
                  <div
                    className={`w-full h-7 rounded-[100%] bg-[#080d14] border-2 ${item.ringColor} shadow-inner flex items-center justify-center relative z-10`}
                  >
                    <div className="w-[85%] h-[60%] rounded-[100%] bg-[#4C787E]/30 blur-[1px]" />
                  </div>

                  {/* Cylinder Body */}
                  <div
                    className={`w-full ${item.heightClass} -mt-3.5 bg-gradient-to-b ${item.cylinderColor} border-x border-b border-[#B7CEEC]/30 shadow-2xl relative flex flex-col items-center justify-center rounded-b-2xl overflow-hidden transition-all ${
                      isSelected ? 'ring-2 ring-[#4C787E] brightness-110' : 'group-hover:brightness-105'
                    }`}
                  >
                    {/* Vertical Metallic Highlight Overlay */}
                    <div className="absolute inset-y-0 left-1/4 w-3 bg-white/10 blur-[2px] pointer-events-none" />
                    <div className="absolute inset-y-0 right-1/4 w-2 bg-black/40 pointer-events-none" />

                    {/* Front 3D Pill Tag Button */}
                    <div className="my-auto z-10">
                      <div
                        className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border shadow-lg transition-all f1-header ${
                          isSelected
                            ? 'bg-[#4C787E] text-white border-[#B7CEEC] shadow-[#4C787E]/50 scale-105'
                            : 'bg-[#05080c]/90 text-[#B7CEEC] border-[#B7CEEC]/30 group-hover:border-[#4C787E]'
                        }`}
                      >
                        {item.pillTag}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* 3D REALISTIC SOCCER BALL IN FOREGROUND */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 translate-y-3 z-30 pointer-events-none">
            <div className="relative w-12 h-12 sm:w-14 sm:h-14">
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/80 rounded-full blur-md" />
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
                <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#222" strokeWidth="2" />
                <radialGradient id="ballShade" cx="30%" cy="30%" r="70%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#d1d5db" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
                </radialGradient>
                <polygon points="50,22 62,31 57,45 43,45 38,31" fill="#111827" />
                <polygon points="50,22 38,31 24,25 28,11 44,10" fill="#374151" />
                <polygon points="62,31 76,25 72,11 56,10 50,22" fill="#374151" />
                <polygon points="57,45 70,52 80,41 76,25 62,31" fill="#111827" />
                <polygon points="43,45 30,52 20,41 24,25 38,31" fill="#111827" />
                <polygon points="43,45 57,45 61,60 50,68 39,60" fill="#374151" />
                <polygon points="50,68 61,60 72,68 68,82 50,85" fill="#111827" />
                <polygon points="50,68 39,60 28,68 32,82 50,85" fill="#111827" />
                <circle cx="50" cy="50" r="46" fill="url(#ballShade)" />
              </svg>
            </div>
          </div>
        </div>

        {/* ALL PARTICIPATING LEAGUE CLUBS LIST */}
        <div className="w-full mt-6 pt-4 border-t border-[#B7CEEC]/20">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-xs font-bold text-[#B7CEEC] uppercase tracking-wider flex items-center gap-1.5 f1-header">
              <Users className="w-3.5 h-3.5 text-[#4C787E]" />
              All League Clubs ({sortedTeams.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#4C787E]/50">
            {sortedTeams.map((team, idx) => {
              const isSelected = selectedTeamId === team.id;
              return (
                <TiltCard
                  key={`club-list-${team.id}-${idx}`}
                  onClick={() => handleTeamClick(team)}
                  maxTilt={8}
                  scale={1.03}
                  glowColor={isSelected ? "rgba(76, 120, 126, 0.4)" : "rgba(183, 206, 236, 0.25)"}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#05080c] border-[#4C787E] shadow-[0_0_15px_rgba(76,120,126,0.4)] ring-1 ring-[#4C787E]'
                      : 'bg-[#05080c]/70 border-[#B7CEEC]/25 hover:border-[#4C787E] hover:bg-[#080d14]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-5 h-5 rounded-full bg-[#080d14] border border-[#4C787E] flex items-center justify-center text-[10px] font-extrabold text-[#B7CEEC] shrink-0 font-mono">
                      #{idx + 1}
                    </div>
                    <div className="shrink-0">
                      <TeamLogo teamId={team.id} size={28} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white truncate leading-tight">
                        {team.name}
                      </p>
                      <p className="text-[10px] font-medium text-[#B7CEEC]/80 font-mono">
                        {team.points} pts • {team.roster?.length || team.squadCount || 0} players
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-[#4C787E] translate-x-0.5' : 'text-[#B7CEEC]/40'}`} />
                  </div>
                </TiltCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Scroll Up Prompt */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        className="mt-4 cursor-pointer group flex flex-col items-center gap-2"
        onClick={onNext}
      >
        <p className="text-[10px] f1-header tracking-[0.22em] text-[#B7CEEC] group-hover:text-white transition-colors">
          SCROLL BACK TO TOP
        </p>
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="p-2.5 rounded-full border border-[#B7CEEC]/40 bg-[#05080c]/80 text-[#B7CEEC] backdrop-blur-md group-hover:border-[#4C787E] group-hover:text-[#4C787E] transition-all"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.div>
      </motion.div>
    </div>
  );
};

