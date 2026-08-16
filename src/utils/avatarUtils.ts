import { Player } from '../types';

const GK_AVATARS = [
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=500&q=80',
];

const DEF_AVATARS = [
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80',
];

const MID_AVATARS = [
  'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=500&q=80',
];

const FWD_AVATARS = [
  'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=500&q=80',
  'https://images.unsplash.com/photo-1543351611-58f69d7c1781?auto=format&fit=crop&w=500&q=80',
];

/**
 * Resolves player avatar photo. Returns uploaded imageUrl if present,
 * otherwise automatically selects a position-based default avatar image.
 */
export function getPlayerAvatar(player?: Partial<Player> | null, teamId?: string): string {
  if (player?.imageUrl && player.imageUrl.trim() !== '') {
    return player.imageUrl.trim();
  }

  const nameKey = player?.id || player?.name || 'player-avatar';
  let hash = 0;
  for (let i = 0; i < nameKey.length; i++) {
    hash += nameKey.charCodeAt(i);
  }

  const pos = (player?.position || 'MID').toUpperCase();
  let pool = MID_AVATARS;
  if (pos === 'GK') pool = GK_AVATARS;
  else if (pos === 'DEF') pool = DEF_AVATARS;
  else if (pos === 'FWD' || pos === 'ST') pool = FWD_AVATARS;

  return pool[hash % pool.length];
}
