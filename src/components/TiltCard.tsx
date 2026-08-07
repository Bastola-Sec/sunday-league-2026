import React, { useState, useRef } from 'react';

interface TiltCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  scale?: number;
  glowColor?: string;
  perspective?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  disabled?: boolean;
}

export const TiltCard: React.FC<TiltCardProps> = ({
  children,
  className = '',
  maxTilt = 10,
  scale = 1.025,
  glowColor = 'rgba(76, 120, 126, 0.25)',
  perspective = 1000,
  onClick,
  disabled = false,
  style,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transformStyle, setTransformStyle] = useState<string>('');
  const [glowStyle, setGlowStyle] = useState<string>('none');
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateXVal = -((y - centerY) / centerY) * maxTilt;
    const rotateYVal = ((x - centerX) / centerX) * maxTilt;

    const mouseXPercent = Math.min(Math.max(Math.round((x / rect.width) * 100), 0), 100);
    const mouseYPercent = Math.min(Math.max(Math.round((y / rect.height) * 100), 0), 100);

    setTransformStyle(
      `perspective(${perspective}px) rotateX(${rotateXVal.toFixed(2)}deg) rotateY(${rotateYVal.toFixed(2)}deg) translateZ(8px) scale3d(${scale}, ${scale}, ${scale})`
    );
    setGlowStyle(
      `radial-gradient(circle at ${mouseXPercent}% ${mouseYPercent}%, ${glowColor}, transparent 75%)`
    );
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setTransformStyle(
      `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)`
    );
    setGlowStyle('none');
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? 'transform 0.1s ease-out, box-shadow 0.2s ease-out, border-color 0.2s ease-out'
          : 'transform 0.4s ease-out, box-shadow 0.4s ease-out, border-color 0.4s ease-out',
        transformStyle: 'preserve-3d',
        boxShadow: isHovered
          ? `0 16px 32px -8px rgba(0, 0, 0, 0.7), 0 0 20px 2px ${glowColor}`
          : undefined,
        ...style,
      }}
      className={`relative overflow-hidden transition-all duration-300 ${className}`}
      {...props}
    >
      {/* 3D Dynamic Cursor Glow / Light Glare Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          background: glowStyle,
          opacity: isHovered ? 1 : 0,
          mixBlendMode: 'screen',
        }}
      />
      {children}
    </div>
  );
};
