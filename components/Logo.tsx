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

  // Color for text - white for dark backgrounds, dark blue for light backgrounds
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1A2044]';
  // Speech bubble – solid blue (#3B82F6 / blue-500)
  const bubbleColorClass = 'text-blue-500';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none ${textColor}`}>
        {/* "Logic" – render as one word, wrap only "i" */}
        <span className={textColor}>Log</span>
        <span className="relative inline-block">
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
              backgroundColor: variant === 'light' ? '#0f172a' : 'white',
            }}
          />
        </span>
        <span className={textColor}>c</span>

        {/* "DM" with gradient – immediately after Logic */}
        <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
          DM
        </span>
      </div>
    </div>
  );
}
