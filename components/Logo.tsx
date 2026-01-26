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
    sm: '0.35em',
    md: '0.4em',
    lg: '0.45em',
  };

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-baseline leading-none ${textColor}`}>
        {/* "Logic" as a single continuous word */}
        <span className="relative inline-block">
          Logic
          {/* Conversation bubble positioned over the dot of 'i' */}
          <span
            className="absolute pointer-events-none"
            style={{
              // Position calculation: "Log" is ~3 characters, then 'i' starts
              // The dot of 'i' is typically at ~0.5em from the start of 'i'
              // So: width of "Log" (approximately 2.2em for 3 chars) + 0.5em for 'i' dot position
              left: 'calc(2.2em + 0.5em)',
              top: '-0.05em', // Slightly above to cover/replace the dot
              width: bubbleSize[size],
              height: bubbleSize[size],
              transform: 'translateX(-50%)',
            }}
          >
            {/* SVG conversation bubble - message bubble style with tail */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Main bubble body - rounded rectangle */}
              <rect
                x="3"
                y="2"
                width="18"
                height="14"
                rx="3"
                fill={bubbleColor}
              />
              {/* Bubble highlight/shine */}
              <ellipse
                cx="9"
                cy="7"
                rx="3"
                ry="2"
                fill="white"
                opacity="0.4"
              />
              {/* Small tail pointing down (left side) */}
              <path
                d="M8 16L6 20L10 18L8 16Z"
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
