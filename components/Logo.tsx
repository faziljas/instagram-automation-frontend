'use client';

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

  // Bubble size based on logo size
  const bubbleSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  // Color for "Logic" text - white for dark backgrounds, dark blue for light backgrounds
  const logicColor = variant === 'light' ? 'text-white' : 'text-[#1A2044]';
  // Conversation bubble color - light blue for dark backgrounds, blue-500 for light
  const bubbleBgColor = variant === 'light' ? 'bg-blue-400' : 'bg-blue-500';
  const bubbleHighlightColor = variant === 'light' ? 'bg-blue-300' : 'bg-blue-400';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none`}>
        {/* Logic part */}
        <span className={`${logicColor} relative inline-block`}>
          Log
          {/* 'i' with conversation bubble instead of dot */}
          <span className="relative inline-block">
            i
            {/* Conversation bubble above 'i' - balloon style */}
            <span 
              className={`absolute left-1/2 -translate-x-1/2 ${bubbleSizes[size]} ${bubbleBgColor} rounded-full relative`}
              style={{
                top: size === 'sm' ? '-0.5rem' : size === 'md' ? '-0.6rem' : '-0.7rem',
                boxShadow: variant === 'light' 
                  ? '0 2px 4px rgba(0, 0, 0, 0.2), inset 0 -1px 2px rgba(0, 0, 0, 0.1)' 
                  : '0 2px 4px rgba(0, 0, 0, 0.3), inset 0 -1px 2px rgba(0, 0, 0, 0.2)',
              }}
            >
              {/* Highlight/shine effect on top-right */}
              <span 
                className={`absolute top-1 right-1 w-1.5 h-1.5 ${bubbleHighlightColor} rounded-full opacity-60`}
                style={{
                  filter: 'blur(2px)',
                }}
              />
              {/* Thin line/string connecting to 'i' */}
              <span 
                className="absolute top-full left-1/2 -translate-x-1/2 w-px bg-blue-400 opacity-40"
                style={{ 
                  height: size === 'sm' ? '0.25rem' : size === 'md' ? '0.3rem' : '0.35rem',
                }}
              />
            </span>
          </span>
          c
        </span>
        
        {/* DM part - gradient from orange to purple */}
        <span 
          className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent ml-0"
        >
          DM
        </span>
      </div>
    </div>
  );
}
