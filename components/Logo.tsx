'use client';

import { BsChatFill } from 'react-icons/bs';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark'; // light = for dark backgrounds, dark = for light backgrounds
}

export default function Logo({ className = '', size = 'md', variant = 'light' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  // Icon size – slightly larger than the "i" stem (w-5 h-5 base)
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // "Logic" – black on light backgrounds, white on dark backgrounds (for readability)
  const logicColor = variant === 'light' ? 'text-white' : 'text-black';
  // Speech bubble – solid blue (#3B82F6 / blue-500)
  const bubbleColorClass = 'text-blue-500';
  // "DM" – Instagram logo gradient (#f09433 → #e6683c → #dc2743 → #cc2366 → #bc1888)
  const dmGradientStyle = {
    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
  // Dot mask for "i" – match logic color context (dark bg = light dot, light bg = dark dot)
  const dotMaskColor = variant === 'light' ? '#0f172a' : '#000';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none`}>
        {/* "Logic" – black */}
        <span className={logicColor}>Log</span>
        <span className={`relative inline-block ${logicColor}`}>
          i
          {/* Round speech bubble (BsChatFill) – absolute over the "i" dot, tail pointing down towards stem */}
          <BsChatFill
            className={`absolute left-1/2 ${iconSizeClasses[size]} ${bubbleColorClass} pointer-events-none z-[2]`}
            style={{
              top: '-0.6em',
              transform: 'translateX(-50%) rotate(12deg)',
            }}
          />
          {/* Mask the original "i" dot */}
          <span
            className="absolute left-1/2 top-0 h-[0.35em] w-[0.35em] -translate-x-1/2 rounded-full z-[1]"
            style={{
              backgroundColor: dotMaskColor,
            }}
          />
        </span>
        <span className={logicColor}>c</span>

        {/* "DM" – Instagram logo gradient */}
        <span style={dmGradientStyle}>
          DM
        </span>
      </div>
    </div>
  );
}
