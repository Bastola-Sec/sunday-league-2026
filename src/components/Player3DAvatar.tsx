import React from 'react';
import { SecurePlayerVideo } from '../utils/videoSecurity';

export interface Player3DAvatarProps {
  player: {
    id?: string;
    name: string;
    number: number;
    isCaptain?: boolean;
    position?: string;
    imageUrl?: string;
    videoUrl?: string;
    overallRating?: number;
  };
  teamId: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  className?: string;
}

export const getTeamDefaultAvatar = (teamId: string = ''): string => {
  const norm = (teamId || '').toLowerCase();
  if (norm.includes('momo')) {
    return 'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=400&q=80';
  } else if (norm.includes('jhyap')) {
    return 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=400&q=80';
  }
  return 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80';
};

export const Player3DAvatar: React.FC<Player3DAvatarProps> = ({
  player,
  teamId,
  size = 'md',
  className = '',
}) => {
  const safePlayer = {
    name: player?.name || 'Player',
    number: player?.number || 10,
    isCaptain: Boolean(player?.isCaptain),
    position: player?.position || 'MID',
    imageUrl: player?.imageUrl,
    videoUrl: player?.videoUrl,
    overallRating: player?.overallRating || 80,
  };

  const defaultAvatar = getTeamDefaultAvatar(teamId);
  const activePhoto = safePlayer.imageUrl && safePlayer.imageUrl.trim() !== '' ? safePlayer.imageUrl : defaultAvatar;
  const hasVideo = Boolean(safePlayer.videoUrl && safePlayer.videoUrl.trim() !== '');

  let badgeGradient = 'from-rose-600 via-red-600 to-rose-950';
  let borderGlowColor = 'border-rose-500/40 shadow-[0_0_20px_rgba(225,29,72,0.3)]';

  const normalizedTeam = (teamId || '').toLowerCase();
  if (normalizedTeam.includes('momo')) {
    badgeGradient = 'from-teal-600 via-sky-600 to-indigo-950';
    borderGlowColor = 'border-teal-400/40 shadow-[0_0_20px_rgba(45,212,191,0.3)]';
  } else if (normalizedTeam.includes('jhyap')) {
    badgeGradient = 'from-purple-600 via-purple-700 to-indigo-950';
    borderGlowColor = 'border-purple-400/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]';
  }

  // Hero Showcase Card View (for Player Profile Modal / Full Cards)
  if (size === 'hero' || size === 'lg') {
    return (
      <div className={`relative flex items-center justify-center select-none group w-full ${className}`}>
        <div className={`relative w-full aspect-[3/4] rounded-3xl overflow-hidden border-2 ${borderGlowColor} bg-[#060b13] flex flex-col items-center justify-end p-2 transition-transform duration-300 group-hover:scale-[1.01]`}>
          
          {/* Ambient Image/Video Background Blur */}
          <div
            className="absolute inset-0 opacity-30 bg-center bg-cover mix-blend-overlay filter blur-md"
            style={{ backgroundImage: `url(${activePhoto})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#040810] via-transparent to-[#040810]/60" />

          {/* Player Media (Direct Video Reel or Photo Avatar) */}
          {hasVideo && safePlayer.videoUrl ? (
            <div className="absolute inset-0 z-10 w-full h-full rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              <SecurePlayerVideo videoUrl={safePlayer.videoUrl} />
            </div>
          ) : (
            <img
              src={activePhoto}
              alt={safePlayer.name}
              className="relative z-10 w-full h-full object-cover object-top rounded-2xl drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)] transition-transform duration-500 group-hover:scale-105"
            />
          )}

          {/* Top Left Shirt Number Badge */}
          <div className={`absolute top-3 left-3 z-20 px-2.5 py-1 rounded-xl bg-gradient-to-r ${badgeGradient} border border-white/30 text-white font-black text-xs shadow-lg backdrop-blur-md flex items-center gap-1`}>
            <span className="text-[10px] text-white/70">#</span>
            <span>{safePlayer.number}</span>
          </div>

          {/* Captain Armband Tag */}
          {safePlayer.isCaptain && (
            <div className="absolute top-3 right-3 z-20 px-2 py-0.5 rounded-lg bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider shadow-lg border border-amber-200">
              CAPTAIN
            </div>
          )}

          {/* Position Badge */}
          {safePlayer.position && (
            <div className="absolute bottom-3 right-3 z-20 px-2 py-0.5 rounded-lg bg-black/75 border border-white/20 text-teal-300 font-black text-[10px] uppercase tracking-wider backdrop-blur-sm shadow">
              {safePlayer.position}
            </div>
          )}
        </div>
      </div>
    );
  }

  // List & Thumbnail View (sm / md)
  const sizeClasses = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  return (
    <div className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none border-2 border-white/30 shadow-md ${sizeClasses} ${className}`}>
      <img
        src={activePhoto}
        alt={safePlayer.name}
        className="w-full h-full object-cover object-top"
      />
      {safePlayer.isCaptain && (
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 text-black font-black text-[8px] flex items-center justify-center border border-black shadow">
          C
        </span>
      )}
    </div>
  );
};
