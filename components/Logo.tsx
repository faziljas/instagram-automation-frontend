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

  // Font weight and sizing for custom "i" stem to match other letters
  const stemStyles = {
    sm: { width: '0.15em', height: '0.8em' },
    md: { width: '0.15em', height: '0.8em' },
    lg: { width: '0.15em', height: '0.8em' },
  };

  // Bubble size based on logo size
  const bubbleSizes = {
    sm: { width: '0.5em', height: '0.5em' },
    md: { width: '0.6em', height: '0.6em' },
    lg: { width: '0.7em', height: '0.7em' },
  };

  // Color for text - white for dark backgrounds, dark blue for light backgrounds
  const textColor = variant === 'light' ? 'text-white' : 'text-[#1A2044]';
  const stemColor = variant === 'light' ? 'bg-white' : 'bg-[#1A2044]';
  // Conversation bubble color - blue
  const bubbleColor = variant === 'light' ? '#60A5FA' : '#3B82F6';

  return (
    <div className={`flex items-center ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} flex items-baseline leading-none ${textColor}`}>
        {/* "Log" */}
        <span className="inline-block">Log</span>
        
        {/* Custom "i" element */}
        <span className="relative inline-flex flex-col items-center mx-0.5" style={{ width: '0.5em' }}>
          {/* Conversation bubble - floating above, slightly rotated */}
          <span
            className="absolute"
            style={{
              top: '-0.7em',
              transform: 'rotate(-5deg)',
              width: bubbleSizes[size].width,
              height: bubbleSizes[size].height,
            }}
          >
            {/* SVG conversation bubble */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: '100%', height: '100%' }}
            >
              {/* Main bubble body */}
              <path
                d="M12 2C7.58 2 4 5.58 4 10C4 12.5 5.2 14.7 7.1 16.1L6 20L10.1 18.9C11.3 19.3 12.6 19.5 14 19.5C18.42 19.5 22 15.92 22 11.5C22 7.08 18.42 3.5 14 3.5C13.4 3.5 12.8 3.6 12.2 3.7C11.6 2.9 10.8 2.2 10 1.7C10.7 1.9 11.3 2 12 2Z"
                fill={bubbleColor}
                opacity="0.9"
              />
              {/* Bubble highlight/shine */}
              <ellipse
                cx="9"
                cy="8"
                rx="2"
                ry="1.5"
                fill="white"
                opacity="0.4"
              />
              {/* Small tail pointing down */}
              <path
                d="M10 16L8 18L10 17L12 18L10 16Z"
                fill={bubbleColor}
                opacity="0.9"
              />
            </svg>
          </span>
          
          {/* Vertical stem of "i" */}
          <span
            className={stemColor}
            style={{
              width: stemStyles[size].width,
              height: stemStyles[size].height,
              marginTop: 'auto',
            }}
          />
        </span>
        
        {/* "c" */}
        <span className="inline-block">c</span>
        
        {/* "DM" with gradient */}
        <span 
          className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 bg-clip-text text-transparent ml-0"
        >
          DM
        </span>
      </div>
    </div>
  );
}
