import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Bell,
  User,
  Search,
  Heart,
  Play,
  Rotate3D,
  Sparkles,
  Flame,
  Share2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Copy,
  Check,
  ExternalLink,
  Send,
  Edit2,
  Lock,
  Shield,
  Star,
  Award,
  Footprints,
  ShieldAlert,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Player, Team } from '../types';
import { TeamLogo } from './TeamLogos';
import { Player3DAvatar } from './Player3DAvatar';
import { TiltCard } from './TiltCard';
import { PlayerFormModal } from './PlayerFormModal';

interface PlayerProfileModalProps {
  player: Player | null;
  team: Team | null;
  onClose: () => void;
  isSoundEnabled?: boolean;
  activeAdminTeamId?: string | null;
  isCommish?: boolean;
  onUpdateRoster?: (teamId: string, updatedRoster: Player[]) => void;
  onSelectAdminTeam?: (teamId: string | null) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  team,
  onClose,
  isSoundEnabled = false,
  activeAdminTeamId,
  isCommish = false,
  onUpdateRoster,
  onSelectAdminTeam,
}) => {
  const roster = team?.roster && team.roster.length > 0 ? team.roster : player ? [player] : [];
  const initialIndex = player ? roster.findIndex((p) => p.id === player.id) : 0;
  const [activePlayerIndex, setActivePlayerIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [localPlayerOverride, setLocalPlayerOverride] = useState<Player | null>(null);

  useEffect(() => {
    setLocalPlayerOverride(null);
    if (player && team?.roster) {
      const idx = team.roster.findIndex((p) => p.id === player.id);
      if (idx >= 0) setActivePlayerIndex(idx);
    }
  }, [player, team]);

  const currentPlayer = localPlayerOverride || roster[activePlayerIndex] || player;

  const [isLiked, setIsLiked] = useState(false);
  const [showTacticalFlip, setShowTacticalFlip] = useState(false);
  const [hypeCount, setHypeCount] = useState(currentPlayer?.hypeVotes || 120);
  const [hasHyped, setHasHyped] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);

  // Edit & Auth Modal States
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const canEdit = Boolean(
    isCommish || (activeAdminTeamId && team && activeAdminTeamId === team.id)
  );

  const handleTriggerEdit = () => {
    if (canEdit) {
      setIsPlayerFormOpen(true);
    } else {
      setShowAuthModal(true);
      setPasscodeAttempt('');
      setPasscodeError(null);
    }
  };

  const handlePasscodeAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;

    const clean = passcodeAttempt.trim().toUpperCase();
    const isTeamValid = team.adminCode ? clean === team.adminCode.toUpperCase() : clean === `${team.id.toUpperCase()}2026`;
    const isCommishValid = clean === 'COMMISH2026' || clean === 'COMMISH' || clean === 'SL2026';

    if (isTeamValid || isCommishValid) {
      if (onSelectAdminTeam) {
        onSelectAdminTeam(isCommishValid ? 'all' : team.id);
      }
      setShowAuthModal(false);
      setIsPlayerFormOpen(true);
    } else {
      setPasscodeError('Invalid passcode. Please verify your credentials and try again.');
    }
  };

  useEffect(() => {
    if (currentPlayer) {
      setHypeCount(currentPlayer.hypeVotes || Math.floor(Math.random() * 80) + 120);
      setHasHyped(false);
      setShowShareSheet(false);
    }
  }, [currentPlayer?.id]);

  // Stats calculation fallback
  const pace = currentPlayer?.pace || 75;
  const shooting = currentPlayer?.shooting || (currentPlayer?.position === 'FWD' ? 88 : currentPlayer?.position === 'MID' ? 80 : 55);
  const passing = currentPlayer?.passing || (currentPlayer?.position === 'MID' ? 89 : 78);
  const dribbling = currentPlayer?.dribbling || (currentPlayer?.position === 'FWD' ? 86 : 82);
  const defending = currentPlayer?.defending || (currentPlayer?.position === 'DEF' ? 87 : currentPlayer?.position === 'GK' ? 90 : 58);
  const physical = currentPlayer?.physical || 82;
  const overall = currentPlayer?.overallRating || Math.max(pace, shooting, passing, dribbling, defending, physical);

  const getFullPositionName = (pos?: string) => {
    switch (pos) {
      case 'FWD':
        return 'Forward';
      case 'MID':
        return 'Midfielder';
      case 'DEF':
        return 'Defender';
      case 'GK':
        return 'Goalkeeper';
      default:
        return 'Player';
    }
  };

  const handleNextPlayer = () => {
    if (roster.length > 0) {
      setActivePlayerIndex((prev) => (prev + 1) % roster.length);
    }
  };

  const handlePrevPlayer = () => {
    if (roster.length > 0) {
      setActivePlayerIndex((prev) => (prev - 1 + roster.length) % roster.length);
    }
  };

  const handleHype = () => {
    if (hasHyped) return;
    setHypeCount((prev) => prev + 1);
    setHasHyped(true);
  };

  const getShareText = () => {
    if (!currentPlayer || !team) return '';
    return `🔥 Sunday League Scout Spotlight: ${currentPlayer.name} (#${currentPlayer.number}) from ${team.name}!
⚡ Position: ${getFullPositionName(currentPlayer.position)} | Rating: ${overall} OVR
⚽ Goals: ${currentPlayer.goals || 0} | Assists: ${currentPlayer.assists || 0}`;
  };

  const handleShare = () => {
    const text = getShareText();
    const url = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: `${currentPlayer?.name} - ${team?.name} Player Card`,
          text: text,
          url: url,
        })
        .catch(() => {
          setShowShareSheet(true);
        });
    } else {
      setShowShareSheet(true);
    }
  };

  const handleCopyShareText = () => {
    const text = `${getShareText()}\n\nCheck profile: ${window.location.href}`;
    navigator.clipboard.writeText(text);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`${getShareText()}\n\nCheck profile: ${window.location.href}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleSmsShare = () => {
    const text = encodeURIComponent(`${getShareText()}\nCheck profile: ${window.location.href}`);
    window.open(`sms:?body=${text}`, '_self');
  };

  // Last 5 matches chart data default fallback
  const matchStats = currentPlayer?.lastMatchesStats || [0, 1, 12, 3, 15, 7];

  return (
    <AnimatePresence>
      {(player || currentPlayer) && currentPlayer && (
        <motion.div
          key={`profile-modal-${player?.id || currentPlayer?.id || 'modal'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ paddingTop: 'calc(1.25rem + env(safe-area-inset-top, 24px))' }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-xl overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 320 }}
            className="relative w-full max-w-sm sm:max-w-md my-auto bg-[#cddbe8] text-slate-900 rounded-[2.2rem] shadow-2xl overflow-hidden border border-white/60 flex flex-col max-h-[92vh]"
          >
          {/* Top Mobile Bar Header */}
          <div className="pt-4 px-5 pb-2 flex items-center justify-between bg-[#cddbe8] shrink-0">
            <h2 className="text-xl font-extrabold text-[#1a2e3d] tracking-tight">
              Player Profile
            </h2>

            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button className="relative p-2 rounded-full bg-white/60 hover:bg-white text-[#1a2e3d] shadow-sm transition-all cursor-pointer">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
              </button>

              {/* User Avatar Icon */}
              <button className="relative p-2 rounded-full bg-white/60 hover:bg-white text-[#1a2e3d] shadow-sm transition-all cursor-pointer">
                <User className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 border border-white" />
              </button>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#1a2e3d] text-white hover:bg-black transition-all cursor-pointer ml-1"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Container for Card & Stats */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
            {/* MAIN SHOWCASE HERO CARD */}
            <TiltCard
              maxTilt={12}
              scale={1.03}
              glowColor="rgba(255, 255, 255, 0.25)"
              className="relative w-full rounded-[2rem] bg-gradient-to-b from-[#284855] via-[#223f4b] to-[#1c333e] text-white p-4 shadow-xl overflow-hidden min-h-[280px] flex flex-col justify-between group"
            >
              {/* Card Header Row: Team Crest & Name + Search Button */}
              <div className="flex items-start justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-1 rounded-full bg-white shadow-md border border-white/80">
                    <TeamLogo teamId={team?.id || currentPlayer?.teamId || ''} size={42} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase text-white leading-tight drop-shadow-sm">
                      {currentPlayer.name.split(' ')[0]}
                    </h3>
                    <p className="text-[10px] font-extrabold tracking-widest text-[#B7CEEC] uppercase">
                      {team?.shortName || team?.name || 'Sunday League'}
                    </p>
                  </div>
                </div>

                <button className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white transition-all cursor-pointer border border-white/20 shadow-sm">
                  <Search className="w-4 h-4" />
                </button>
              </div>

              {/* Player Image / 3D Character Presentation */}
              <div className="relative my-2 flex items-center justify-center w-full flex-1">
                <Player3DAvatar
                  player={currentPlayer}
                  teamId={team?.id || currentPlayer?.teamId || ''}
                  size="hero"
                  className="w-full max-w-full"
                />
              </div>

              {/* Tactical Flip Action Toggle */}
              <div className="flex items-center justify-between text-[10px] text-[#B7CEEC] font-bold z-10 pt-1 border-t border-white/10">
                <span className="uppercase tracking-wider">
                  Overall: <span className="text-amber-300 font-black text-xs">{overall} OVR</span>
                </span>
                <button
                  onClick={() => setShowTacticalFlip(!showTacticalFlip)}
                  className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold flex items-center gap-1 transition-all cursor-pointer border border-white/20"
                >
                  <Rotate3D className="w-3 h-3 text-amber-300" />
                  <span>{showTacticalFlip ? 'Standard View' : 'Tactical Radar'}</span>
                </button>
              </div>
            </TiltCard>

            {/* PLAYER NAME, POSITION & CAROUSEL DOTS ROW */}
            <div className="px-1 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-black text-[#152a38] tracking-tight leading-none">
                      {currentPlayer.name} #{currentPlayer.number}
                    </h1>
                    {currentPlayer.isCaptain && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center gap-1 shadow-sm shrink-0">
                        <Star className="w-3 h-3 fill-slate-950" /> CAPTAIN
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#425a6c] mt-1 flex items-center gap-2 flex-wrap">
                    <span>{getFullPositionName(currentPlayer.position)}</span>
                    {currentPlayer.preferredFoot && (
                      <span className="text-[11px] px-2 py-0.5 rounded-lg bg-[#152a38]/10 text-[#152a38] font-bold">
                        Foot: {currentPlayer.preferredFoot}
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Edit Player Profile Button */}
                  <button
                    onClick={handleTriggerEdit}
                    className="p-2.5 rounded-full bg-[#152a38] hover:bg-[#203a4d] text-amber-300 shadow-md transition-transform active:scale-95 cursor-pointer border border-amber-300/30 flex items-center justify-center"
                    title={canEdit ? 'Edit Player Profile (Popup Form)' : 'Authenticate to Edit Player'}
                  >
                    <Edit2 className="w-5 h-5 text-amber-300" />
                  </button>

                  {/* Heart Favorite Button */}
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className="p-2.5 rounded-full bg-white shadow-md text-[#152a38] hover:scale-110 transition-transform cursor-pointer border border-white/80"
                  >
                    <Heart
                      className={`w-6 h-6 transition-colors ${
                        isLiked ? 'fill-rose-500 text-rose-500' : 'text-[#152a38]'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Signature Trait & Discipline Row */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold">
                {currentPlayer.signatureTrait && (
                  <span className="px-2.5 py-1 rounded-xl bg-amber-400/20 text-amber-900 border border-amber-400/40 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Trait: {currentPlayer.signatureTrait}</span>
                  </span>
                )}

                <span className="px-2.5 py-1 rounded-xl bg-white/70 text-[#152a38] border border-white flex items-center gap-1.5">
                  <span>🟨 {currentPlayer.yellowCards || 0} Yellows</span>
                  <span>•</span>
                  <span>🟥 {currentPlayer.redCards || 0} Reds</span>
                </span>
              </div>

              {/* Scouting Bio / Notes */}
              {currentPlayer.bio && (
                <div className="p-3 rounded-2xl bg-[#152a38]/10 border border-[#152a38]/20 text-xs text-[#152a38]">
                  <p className="font-extrabold uppercase tracking-wider text-[10px] text-[#2a485c] mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-[#152a38]" /> Player Scouting Bio & Notes
                  </p>
                  <p className="font-medium italic leading-relaxed text-[11px]">"{currentPlayer.bio}"</p>
                </div>
              )}

              {/* Roster Carousel Pagination Indicators */}

              {/* Roster Carousel Pagination Indicators */}
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {roster.length > 1 && (
                  <button
                    onClick={handlePrevPlayer}
                    className="p-1 text-[#152a38]/60 hover:text-[#152a38] cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div className="flex items-center gap-1.5">
                  {roster.map((p, idx) => (
                    <button
                      key={`roster-dot-${p.id || idx}-${idx}`}
                      onClick={() => setActivePlayerIndex(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activePlayerIndex
                          ? 'w-6 bg-[#1a3244]'
                          : 'w-2 bg-[#1a3244]/30 hover:bg-[#1a3244]/60'
                      }`}
                    />
                  ))}
                </div>
                {roster.length > 1 && (
                  <button
                    onClick={handleNextPlayer}
                    className="p-1 text-[#152a38]/60 hover:text-[#152a38] cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* STATS SECTION CARD (MATCHING IMAGE 2) */}
            {!showTacticalFlip ? (
              <div className="p-4 rounded-[1.75rem] bg-[#7d9cb8]/40 backdrop-blur-xl border border-white/60 shadow-lg text-[#152a38] space-y-4">
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-4 text-center py-2 bg-[#ffffff]/20 rounded-2xl border border-white/30 backdrop-blur-md">
                  <div>
                    <span className="block text-[11px] font-bold text-[#304859] mb-0.5">Goals</span>
                    <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {currentPlayer.goals}
                    </span>
                    <span className="block text-[8px] font-bold text-[#304859]/80 font-mono">Total</span>
                  </div>

                  <div className="border-x border-[#1a3244]/20 px-1">
                    <span className="block text-[11px] font-bold text-[#304859] mb-0.5">Assists</span>
                    <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {currentPlayer.assists}
                    </span>
                    <span className="block text-[8px] font-bold text-[#304859]/80 font-mono">Total</span>
                  </div>

                  <div className="border-r border-[#1a3244]/20 px-1">
                    <span className="block text-[11px] font-bold text-[#304859] mb-0.5">MOTM</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-md flex items-center justify-center gap-0.5">
                      ⭐ {currentPlayer.motmAwards || 0}
                    </span>
                    <span className="block text-[8px] font-bold text-[#304859]/80 font-mono">Awards</span>
                  </div>

                  <div>
                    <span className="block text-[11px] font-bold text-[#304859] mb-0.5">Matches</span>
                    <span className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {currentPlayer.matchesPlayed ?? 0}
                    </span>
                    <span className="block text-[8px] font-bold text-[#304859]/80 font-mono">Played</span>
                  </div>
                </div>

                {/* Last 5 Matches Bar Chart Section */}
                <div className="pt-2 border-t border-[#1a3244]/15">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-black text-[#152a38] uppercase tracking-wider">
                      Last 5 matches
                    </h4>
                    <span className="text-[10px] font-bold text-[#2a455a]">Recent Form</span>
                  </div>

                  {/* Chart Bars Graphic */}
                  <div className="h-20 bg-[#ffffff]/30 rounded-2xl p-3 border border-white/40 flex items-end justify-between gap-2">
                    {matchStats.slice(0, 6).map((val, idx) => {
                      const heights = ['h-6', 'h-10', 'h-16', 'h-12', 'h-16', 'h-8'];
                      const isHighlight = idx === 2 || idx === 4;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-t-md transition-all ${
                              isHighlight
                                ? 'bg-[#4B7CEC] shadow-md shadow-[#4B7CEC]/40'
                                : 'bg-[#4C787E] opacity-75'
                            } ${heights[idx % heights.length]}`}
                          />
                          <span className="text-[10px] font-black text-[#152a38]">{val}</span>
                        </div>
                      );
                    })}
                  </div>


                </div>

                {/* Bottom Card Page Dots */}
                <div className="flex items-center justify-center gap-1 pt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a3244]/40" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1a3244]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1a3244]/40" />
                </div>
              </div>
            ) : (
              /* TACTICAL ATTRIBUTE RADAR VIEW */
              <div className="p-4 rounded-[1.75rem] bg-[#1a3244] text-white space-y-3 border border-white/20 shadow-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#B7CEEC]">
                    Tactical Ratings
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4C787E]/40 text-[#B7CEEC] font-bold">
                    FIFA Scout Specs
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Pace (PAC)</span>
                      <span className="text-amber-300">{pace}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${pace}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Shooting (SHO)</span>
                      <span className="text-amber-300">{shooting}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${shooting}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Passing (PAS)</span>
                      <span className="text-amber-300">{passing}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${passing}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Dribbling (DRI)</span>
                      <span className="text-amber-300">{dribbling}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${dribbling}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Defense (DEF)</span>
                      <span className="text-amber-300">{defending}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${defending}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] mb-1 font-bold">
                      <span className="text-gray-300">Physical (PHY)</span>
                      <span className="text-amber-300">{physical}</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#4C787E] to-[#4B7CEC]" style={{ width: `${physical}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom Actions: Cheer & Share */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                onClick={handleHype}
                className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                  hasHyped
                    ? 'bg-[#152a38] text-amber-300'
                    : 'bg-white text-[#152a38] hover:bg-white/80'
                }`}
              >
                <Flame className={`w-4 h-4 ${hasHyped ? 'text-amber-400 fill-amber-400' : 'text-amber-500'}`} />
                <span>{hasHyped ? 'Hyped!' : 'Fan Cheer'} ({hypeCount})</span>
              </button>

              <button
                onClick={handleShare}
                className="py-2.5 px-4 rounded-2xl bg-white text-[#152a38] hover:bg-white/80 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Share2 className="w-4 h-4 text-[#152a38]" />
                <span>{copiedShare ? 'Copied Link!' : 'Share'}</span>
              </button>
            </div>

            {/* Share Sheet Overlay */}
            <AnimatePresence>
              {showShareSheet && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 30 }}
                  className="absolute inset-0 z-50 bg-[#0c1a26]/95 backdrop-blur-xl p-5 flex flex-col justify-between text-white rounded-[2.2rem]"
                >
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-amber-400" />
                        <h3 className="font-extrabold text-sm text-white">Share Player Profile</h3>
                      </div>
                      <button
                        onClick={() => setShowShareSheet(false)}
                        className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-2xl">
                      <p className="text-xs font-semibold text-gray-200 line-clamp-3">
                        {getShareText()}
                      </p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <p className="text-[10px] uppercase font-black tracking-wider text-gray-400 px-1">
                        Select Share Channel
                      </p>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={handleWhatsAppShare}
                          className="p-3 rounded-2xl bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          onClick={handleTwitterShare}
                          className="p-3 rounded-2xl bg-[#1DA1F2]/20 border border-[#1DA1F2]/40 text-[#1DA1F2] hover:bg-[#1DA1F2]/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Twitter / X</span>
                        </button>

                        <button
                          onClick={handleSmsShare}
                          className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>SMS / Text</span>
                        </button>

                        <button
                          onClick={handleCopyShareText}
                          className="p-3 rounded-2xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          {copiedShare ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedShare ? 'Copied!' : 'Copy Text'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowShareSheet(false)}
                    className="w-full py-2.5 rounded-2xl bg-white/10 text-gray-300 hover:text-white hover:bg-white/15 text-xs font-bold transition-all cursor-pointer mt-3"
                  >
                    Close Sheet
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Inline Auth Prompt Modal if not logged in as team admin/commish */}
          <AnimatePresence>
            {showAuthModal && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute inset-0 z-50 bg-[#091420]/95 backdrop-blur-xl p-5 flex flex-col justify-center text-white rounded-[2.2rem]"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2 text-amber-300">
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                      <h3 className="font-extrabold text-sm text-white">
                        Admin Login Required
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAuthModal(false)}
                      className="p-1.5 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-gray-300 leading-relaxed">
                    Only <strong>{team?.name} Club Admin</strong> or the <strong>League Commissioner</strong> can edit player profiles and squad rosters for this team.
                  </p>

                  <form onSubmit={handlePasscodeAuth} className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-bold text-amber-300 block">
                          Enter Secret Admin Passcode
                        </label>
                        {passcodeAttempt && (
                          <button
                            type="button"
                            onClick={() => {
                              setPasscodeAttempt('');
                              setPasscodeError(null);
                            }}
                            className="text-[10px] text-teal-400 hover:underline cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="password"
                        required
                        placeholder="Enter secret passcode"
                        value={passcodeAttempt}
                        onChange={(e) => {
                          setPasscodeAttempt(e.target.value);
                          setPasscodeError(null);
                        }}
                        className="w-full p-2.5 rounded-xl bg-[#03080e] border border-amber-400/40 text-amber-300 font-bold text-center tracking-widest text-sm focus:outline-none focus:border-amber-300"
                      />
                    </div>



                    {passcodeError && (
                      <p className="text-[11px] text-rose-400 font-bold text-center">
                        {passcodeError}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAuthModal(false)}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-gray-300 hover:text-white font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs hover:brightness-110 shadow-lg shadow-amber-500/20"
                      >
                        Authenticate
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* DEDICATED PLAYER FORM POPUP MODAL */}
          <PlayerFormModal
            isOpen={isPlayerFormOpen}
            onClose={() => setIsPlayerFormOpen(false)}
            onSave={(savedPlayer) => {
              setLocalPlayerOverride(savedPlayer);
              if (!team || !onUpdateRoster) return;
              const exists = roster.some((p) => p.id === savedPlayer.id);
              let updatedRoster: Player[];
              if (exists) {
                updatedRoster = roster.map((p) => (p.id === savedPlayer.id ? savedPlayer : p));
              } else {
                updatedRoster = [...roster, savedPlayer];
              }
              onUpdateRoster(team.id, updatedRoster);
            }}
            playerToEdit={currentPlayer}
            teamName={team?.name}
          />
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
};
