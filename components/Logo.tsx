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

  // Bubble size relative to font size - sized to be slightly larger than a typical dot
  const bubbleSize = {
    sm: '0.5em',
    md: '0.6em',
    lg: '0.7em',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none ${textColor}`}>
        {/* "Logic" - render as one word, but wrap only "i" */}
        <span className={textColor}>Log</span>
        <span className="relative inline-block">
          i
          {/* Conversation bubble positioned exactly over the "i" dot */}
          <span
            className="absolute pointer-events-none"
            style={{
              top: '-0.55em',
              left: '50%',
              transform: 'translateX(-50%)',
              width: bubbleSize[size],
              height: bubbleSize[size],
              zIndex: 2,
            }}
          >
            {/* SVG conversation bubble - circular with downward tail */}
            <svg
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Main bubble body - circular */}
              <circle
                cx="10"
                cy="8"
                r="6"
                fill={bubbleColor}
              />
              {/* Small triangular tail pointing down, centered - touches top of stem */}
              <path
                d="M10 14 L7.5 18 L12.5 18 Z"
                fill={bubbleColor}
              />
            </svg>
          </span>
          {/* Cover the original dot of 'i' completely */}
          <span
            className="absolute"
            style={{
              top: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0.35em',
              height: '0.35em',
              backgroundColor: variant === 'light' ? '#0f172a' : 'white',
              borderRadius: '50%',
              zIndex: 1,
            }}
          />
        </span>
        <span className={textColor}>c</span>
        
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
