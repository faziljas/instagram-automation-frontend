'use client';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark'; // light = for dark backgrounds, dark = for light backgrounds
}

export default function Logo({ className = '', size = 'md', variant = 'light' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  // Color for "Logic" text - white for dark backgrounds, dark blue for light backgrounds
  const logicColor = variant === 'light' ? 'text-white' : 'text-[#1A2044]';
  // Conversation bubble color - bright blue for dark backgrounds, blue-500 for light
  const bubbleColor = variant === 'light' ? 'bg-blue-400' : 'bg-blue-500';
  const bubbleBorderColor = variant === 'light' ? 'border-blue-400' : 'border-blue-500';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none`}>
        {/* Logic part */}
        <span className={`${logicColor} relative inline-block`}>
          Log
          {/* 'i' with conversation bubble instead of dot */}
          <span className="relative inline-block">
            i
            {/* Conversation bubble above 'i' */}
            <span 
              className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-3 h-3 ${bubbleColor} rounded-full`}
              style={{
                boxShadow: `0 0 0 1px ${variant === 'light' ? 'rgba(96, 165, 250, 0.8)' : 'rgba(59, 130, 246, 0.8)'}`
              }}
            >
              {/* Small tail pointing down to 'i' */}
              <span 
                className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[2px] border-r-[2px] border-t-[3px] border-transparent`}
                style={{ 
                  marginTop: '-1px',
                  borderTopColor: variant === 'light' ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)'
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
