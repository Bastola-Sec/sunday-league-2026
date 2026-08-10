export const formatClockTime = (minute: number = 0, matchSeconds?: number): string => {
  if (typeof matchSeconds === 'number' && matchSeconds >= 0) {
    const mm = Math.floor(matchSeconds / 60);
    const ss = matchSeconds % 60;
    return `${mm.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  }
  return `${minute.toString().padStart(2, '0')}:00`;
};
