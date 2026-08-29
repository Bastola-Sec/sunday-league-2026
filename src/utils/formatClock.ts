export const formatClockTime = (
  minute: number = 0,
  matchSeconds?: number,
  kickoffTime?: string,
  status?: string,
  halfDurationMinutes: number = 20
): string => {
  if (status === 'halftime') {
    return `${halfDurationMinutes.toString().padStart(2, '0')}:00`;
  }
  if (status === 'ended' || status === 'fulltime') {
    return `${(halfDurationMinutes * 2).toString().padStart(2, '0')}:00`;
  }

  // If match is live and kickoffTime timestamp is present, calculate exact elapsed seconds from wall clock time
  if ((status === '1st_half' || status === '2nd_half') && kickoffTime) {
    const kickoffMs = new Date(kickoffTime).getTime();
    if (!isNaN(kickoffMs)) {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - kickoffMs) / 1000));
      const baseSec = status === '2nd_half' ? halfDurationMinutes * 60 : 0;
      const totalSec = baseSec + elapsedSec;
      const mm = Math.floor(totalSec / 60);
      const ss = totalSec % 60;
      return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
    }
  }

  if (typeof matchSeconds === 'number' && matchSeconds > 0) {
    const mm = Math.floor(matchSeconds / 60);
    const ss = matchSeconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  }

  if (typeof matchSeconds === 'number' && matchSeconds === 0 && minute > 0) {
    return `${minute.toString().padStart(2, '0')}:00`;
  }

  return `${(minute || 0).toString().padStart(2, '0')}:00`;
};

export const getLiveMatchMinute = (
  match: { status?: string; kickoffTime?: string; kickoffTime2nd?: string; minute?: number },
  halfDurationMinutes: number = 20
): number => {
  if (match.status === 'scheduled') return 0;
  if (match.status === 'halftime') return halfDurationMinutes;
  if (match.status === 'ended' || match.status === 'fulltime') return halfDurationMinutes * 2;
  
  const status = match.status;
  const kickoffTime = status === '2nd_half' ? (match.kickoffTime2nd || match.kickoffTime) : match.kickoffTime;
  
  if ((status === '1st_half' || status === '2nd_half') && kickoffTime) {
    const kickoffMs = new Date(kickoffTime).getTime();
    if (!isNaN(kickoffMs)) {
      const elapsedSec = Math.max(0, Math.floor((Date.now() - kickoffMs) / 1000));
      const baseSec = status === '2nd_half' ? halfDurationMinutes * 60 : 0;
      const totalSec = baseSec + elapsedSec;
      return Math.max(1, Math.floor(totalSec / 60)); 
    }
  }

  return Math.max(1, match.minute || 1);
};
