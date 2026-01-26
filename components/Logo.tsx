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

  // Color for text - white for dark backgrounds, dark blue for light backgrounds
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1A2044]';
  // Conversation bubble color - blue
  const bubbleColor = variant === 'light' ? '#60A5FA' : '#3B82F6';

  // Bubble size relative to font size
  const bubbleSize = {
    sm: '0.4em',
    md: '0.45em',
    lg: '0.5em',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-baseline leading-none ${textColor}`}>
        {/* "Logic" as a single continuous word */}
        <span className="relative inline-block">
          Logic
          {/* Cover the original dot of 'i' with background color - larger to ensure complete coverage */}
          <span
            className="absolute"
            style={{
              // Position exactly over the 'i' dot
              left: 'calc(2.2em + 0.5em)',
              top: '0',
              width: '0.25em',
              height: '0.25em',
              backgroundColor: variant === 'light' ? '#0f172a' : 'white',
              transform: 'translateX(-50%)',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
          
          {/* Conversation bubble positioned exactly at the top where the dot would be */}
          <span
            className="absolute pointer-events-none"
            style={{
              // Position calculation: "Log" is ~2.2em, then 'i' dot is at ~0.5em into 'i'
              left: 'calc(2.2em + 0.5em)',
              top: '-0.15em', // Moved higher to be at the top of where dot would be
              width: bubbleSize[size],
              height: bubbleSize[size],
              transform: 'translateX(-50%)',
              zIndex: 2,
            }}
          >
            {/* SVG conversation bubble - oval/ellipse shape with tail */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Main bubble body - oval/ellipse */}
              <ellipse
                cx="12"
                cy="10"
                rx="9"
                ry="7"
                fill={bubbleColor}
              />
              {/* Bubble highlight/shine */}
              <ellipse
                cx="9"
                cy="8"
                rx="3"
                ry="2"
                fill="white"
                opacity="0.5"
              />
              {/* Small tail pointing down (left side) */}
              <path
                d="M7 16L5 20L9 18L7 16Z"
                fill={bubbleColor}
              />
            </svg>
          </span>
        </span>
        
        {/* "DM" with gradient - immediately following Logic */}
        <span 
          className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent"
        >
          DM
        </span>
      </div>
    </div>
  );
}
