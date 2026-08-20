import React from 'react';

interface TeamLogoProps {
  teamId: 'no-stamina' | 'momo-strikers' | 'jhyap-warriors' | string;
  className?: string;
  size?: number;
}

export const TeamLogo: React.FC<TeamLogoProps> = ({ teamId, className = '', size = 48 }) => {
  if (teamId === '1st Place' || teamId === '1st-place' || teamId === '1st') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" className={`inline-block drop-shadow-md ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 10 L170 35 L160 145 Q100 195 100 195 Q100 195 40 145 L30 35 Z" fill="#D4AF37" stroke="#F1C40F" strokeWidth="6" />
        <path d="M100 18 L162 40 L153 138 Q100 185 100 185 Q100 185 47 138 L38 40 Z" fill="#9A7B1C" />
        <path d="M70 70 L130 70 L120 110 Q100 135 100 135 Q100 135 80 110 Z" fill="#F1C40F" stroke="#FFF" strokeWidth="2" />
        <text x="100" y="105" textAnchor="middle" fill="#000" fontSize="32" fontWeight="900" fontFamily="sans-serif">1st</text>
        <text x="100" y="165" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">LEAGUE #1</text>
      </svg>
    );
  }

  if (teamId === '2nd Place' || teamId === '2nd-place' || teamId === '2nd') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" className={`inline-block drop-shadow-md ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 10 L170 35 L160 145 Q100 195 100 195 Q100 195 40 145 L30 35 Z" fill="#7F8C8D" stroke="#BDC3C7" strokeWidth="6" />
        <path d="M100 18 L162 40 L153 138 Q100 185 100 185 Q100 185 47 138 L38 40 Z" fill="#34495E" />
        <path d="M70 70 L130 70 L120 110 Q100 135 100 135 Q100 135 80 110 Z" fill="#BDC3C7" stroke="#FFF" strokeWidth="2" />
        <text x="100" y="105" textAnchor="middle" fill="#000" fontSize="32" fontWeight="900" fontFamily="sans-serif">2nd</text>
        <text x="100" y="165" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">LEAGUE #2</text>
      </svg>
    );
  }

  if (teamId === '3rd Place' || teamId === '3rd-place' || teamId === '3rd') {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" className={`inline-block drop-shadow-md ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M100 10 L170 35 L160 145 Q100 195 100 195 Q100 195 40 145 L30 35 Z" fill="#CD7F32" stroke="#E5A059" strokeWidth="6" />
        <path d="M100 18 L162 40 L153 138 Q100 185 100 185 Q100 185 47 138 L38 40 Z" fill="#8C531B" />
        <path d="M70 70 L130 70 L120 110 Q100 135 100 135 Q100 135 80 110 Z" fill="#E5A059" stroke="#FFF" strokeWidth="2" />
        <text x="100" y="105" textAnchor="middle" fill="#000" fontSize="32" fontWeight="900" fontFamily="sans-serif">3rd</text>
        <text x="100" y="165" textAnchor="middle" fill="#FFF" fontSize="14" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">LEAGUE #3</text>
      </svg>
    );
  }

  const logoMap: Record<string, { src: string; alt: string }> = {
    'momo-strikers': {
      src: '/logos/momo-strikers.png',
      alt: 'MoMo Strikers Official Logo',
    },
    'jhyap-warriors': {
      src: '/logos/jhyap-warriors.png',
      alt: 'Jhyap Warriors Official Logo',
    },
    'no-stamina': {
      src: '/logos/no-stamina.png',
      alt: 'No Stamina Hustlers Official Logo',
    },
  };

  const logoInfo = logoMap[teamId];

  if (logoInfo) {
    return (
      <img
        src={logoInfo.src}
        alt={logoInfo.alt}
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`inline-block object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)] shrink-0 ${className}`}
      />
    );
  }

  // TBD Placeholder Shield SVG for unassigned/unqualified cup slots
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={`inline-block drop-shadow-md ${className}`} fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 10 L170 35 L160 145 Q100 195 100 195 Q100 195 40 145 L30 35 Z" fill="#0c1926" stroke="#4C787E" strokeWidth="6" />
      <path d="M100 18 L162 40 L153 138 Q100 185 100 185 Q100 185 47 138 L38 40 Z" fill="#060c14" />
      <path d="M70 70 L130 70 L120 110 Q100 135 100 135 Q100 135 80 110 Z" fill="#122c38" stroke="#B7CEEC" strokeWidth="2" />
      <text x="100" y="105" textAnchor="middle" fill="#B7CEEC" fontSize="36" fontWeight="900" fontFamily="sans-serif">?</text>
      <text x="100" y="165" textAnchor="middle" fill="#B7CEEC" fontSize="14" fontWeight="800" fontFamily="sans-serif" letterSpacing="1">CUP TBD</text>
    </svg>
  );
};
