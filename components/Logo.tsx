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
  // Speech bubble color - bright blue for dark backgrounds, blue-500 for light
  const bubbleColor = variant === 'light' ? 'bg-blue-400' : 'bg-blue-500';
  const bubbleBorderColor = variant === 'light' ? 'border-t-blue-400' : 'border-t-blue-500';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-center leading-none`}>
        {/* Logic part */}
        <span className={`${logicColor} relative inline-block`}>
          Logic
          {/* Speech bubble icon above 'g' */}
          <span 
            className={`absolute -top-1 right-0.5 w-2 h-2 ${bubbleColor} rounded-full`}
            style={{
              transform: 'translate(50%, -50%)',
            }}
          >
            <span 
              className={`absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent ${bubbleBorderColor}`}
              style={{ marginTop: '-1px' }}
            />
          </span>
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
