import { Player } from '../types';

/**
 * Returns official team default avatar image path based on teamId.
 */
export function getTeamDefaultAvatar(teamId: string = ''): string {
  const norm = (teamId || '').toLowerCase();
  if (norm.includes('momo')) {
    return '/avatars/momo-strikers.jpg';
  }
  if (norm.includes('jhyap')) {
    return '/avatars/jhyap-warriors.jpg';
  }
  return '/avatars/no-stamina.jpg';
}

/**
 * Resolves player avatar photo. Returns custom uploaded imageUrl if present,
 * otherwise automatically inserts their team's official team avatar image.
 */
export function getPlayerAvatar(player?: Partial<Player> | null, teamId?: string): string {
  if (player?.imageUrl && player.imageUrl.trim() !== '') {
    return player.imageUrl.trim();
  }
  return getTeamDefaultAvatar(teamId || (player as any)?.teamId || '');
}
