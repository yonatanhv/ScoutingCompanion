import { useEffect, useState } from 'react';

// Team color palettes (expanded from alliance colors)
const TEAM_COLORS = {
  red: {
    primary: '#E53E3E',
    secondary: '#FEB2B2',
    accent: '#C53030'
  },
  blue: {
    primary: '#3182CE',
    secondary: '#BEE3F8',
    accent: '#2B6CB0'
  },
  default: {
    primary: '#4A5568',
    secondary: '#CBD5E0',
    accent: '#2D3748'
  }
};

type TeamMascotSpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  teamColor?: 'red' | 'blue' | 'default';
  message?: string;
};

/**
 * Animated Team Mascot Spinner
 * 
 * This component displays an animated robot mascot with spinning gears
 * in team colors for loading states.
 */
export function TeamMascotSpinner({ 
  size = 'md', 
  teamColor = 'default',
  message = 'Loading...'
}: TeamMascotSpinnerProps) {
  // Size mapping in pixels
  const sizeMap = {
    sm: { container: 100, robot: 60, gear: 20 },
    md: { container: 150, robot: 90, gear: 30 },
    lg: { container: 200, robot: 120, gear: 40 }
  };
  
  const colors = TEAM_COLORS[teamColor];
  const dimensions = sizeMap[size];
  
  // Animated robot parts that change slightly
  const [eyeAngle, setEyeAngle] = useState(0);
  
  // Simple animation for robot eyes
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setEyeAngle((prev) => (prev + 5) % 360);
    }, 500);
    
    return () => clearInterval(animationInterval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: dimensions.container, height: dimensions.container }}>
      {/* Robot SVG with spinning gears */}
      <div className="relative">
        {/* Main robot body */}
        <svg width={dimensions.robot} height={dimensions.robot} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Robot Body */}
          <rect x="25" y="30" width="50" height="60" rx="5" fill={colors.primary} />
          
          {/* Robot Head */}
          <rect x="35" y="10" width="30" height="25" rx="3" fill={colors.accent} />
          
          {/* Robot Eyes */}
          <circle cx="45" cy="20" r="5" fill={colors.secondary}>
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from={`0 45 20`} 
              to={`360 45 20`} 
              dur="3s" 
              repeatCount="indefinite" 
            />
          </circle>
          <circle cx="55" cy="20" r="5" fill={colors.secondary}>
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from={`0 55 20`} 
              to={`360 55 20`} 
              dur="3s" 
              repeatCount="indefinite" 
            />
          </circle>
          
          {/* Robot Mouth */}
          <rect x="40" y="30" width="20" height="3" rx="1" fill={colors.secondary} />
          
          {/* Robot Arms */}
          <rect x="15" y="40" width="10" height="30" rx="2" fill={colors.accent} />
          <rect x="75" y="40" width="10" height="30" rx="2" fill={colors.accent} />
          
          {/* Robot Legs */}
          <rect x="30" y="90" width="15" height="10" rx="2" fill={colors.accent} />
          <rect x="55" y="90" width="15" height="10" rx="2" fill={colors.accent} />
        </svg>
        
        {/* Spinning gears around the robot */}
        <svg 
          className="absolute" 
          style={{ top: -dimensions.gear/2, left: -dimensions.gear/2 }} 
          width={dimensions.gear} 
          height={dimensions.gear} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M20 0L23 5.5L29 2.5L28 9.5L35 10L30 15L35 20L28 19.5L29 26.5L23 23.5L20 30L17 23.5L11 26.5L12 19.5L5 20L10 15L5 10L12 9.5L11 2.5L17 5.5L20 0Z" 
            fill={colors.secondary}
          >
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from="0 20 20" 
              to="360 20 20" 
              dur="5s" 
              repeatCount="indefinite" 
            />
          </path>
          <circle cx="20" cy="20" r="5" fill={colors.primary} />
        </svg>
        
        <svg 
          className="absolute" 
          style={{ top: -dimensions.gear/2, right: -dimensions.gear/2 }} 
          width={dimensions.gear} 
          height={dimensions.gear} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M20 0L23 5.5L29 2.5L28 9.5L35 10L30 15L35 20L28 19.5L29 26.5L23 23.5L20 30L17 23.5L11 26.5L12 19.5L5 20L10 15L5 10L12 9.5L11 2.5L17 5.5L20 0Z" 
            fill={colors.secondary}
          >
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from="360 20 20" 
              to="0 20 20" 
              dur="3s" 
              repeatCount="indefinite" 
            />
          </path>
          <circle cx="20" cy="20" r="5" fill={colors.primary} />
        </svg>
        
        <svg 
          className="absolute" 
          style={{ bottom: -dimensions.gear/2, left: dimensions.robot/2 - dimensions.gear/2 }} 
          width={dimensions.gear} 
          height={dimensions.gear} 
          viewBox="0 0 40 40" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            d="M20 0L23 5.5L29 2.5L28 9.5L35 10L30 15L35 20L28 19.5L29 26.5L23 23.5L20 30L17 23.5L11 26.5L12 19.5L5 20L10 15L5 10L12 9.5L11 2.5L17 5.5L20 0Z" 
            fill={colors.secondary}
          >
            <animateTransform 
              attributeName="transform" 
              type="rotate" 
              from="0 20 20" 
              to="360 20 20" 
              dur="4s" 
              repeatCount="indefinite" 
            />
          </path>
          <circle cx="20" cy="20" r="5" fill={colors.primary} />
        </svg>
      </div>
      
      {/* Loading text */}
      <div className="mt-4 text-center font-medium">
        <p>{message}</p>
        <div className="flex mt-1 justify-center space-x-1">
          <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 bg-current rounded-full animate-bounce"></span>
        </div>
      </div>
    </div>
  );
}