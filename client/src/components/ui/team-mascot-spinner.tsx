import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// SVG for robot icon (simplified design)
const RobotIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full"
  >
    <rect x="25" y="30" width="50" height="45" rx="5" />
    <circle cx="35" cy="45" r="5" className="robot-eye" />
    <circle cx="65" cy="45" r="5" className="robot-eye" />
    <line x1="40" y1="65" x2="60" y2="65" className="robot-mouth" />
    <line x1="40" y1="20" x2="40" y2="30" />
    <line x1="60" y1="20" x2="60" y2="30" />
    <rect x="35" y="75" width="10" height="10" />
    <rect x="55" y="75" width="10" height="10" />
  </svg>
);

// Define the variants available for the spinner
const teamMascotSpinnerVariants = cva(
  "relative inline-block text-primary animate-spin",
  {
    variants: {
      size: {
        default: "w-16 h-16",
        sm: "w-8 h-8", 
        lg: "w-24 h-24",
        xl: "w-32 h-32",
      },
      variant: {
        default: "opacity-80",
        subtle: "opacity-50",
        primary: "text-primary",
        secondary: "text-secondary",
      },
      speed: {
        slow: "animate-spin-slow", // 3s
        default: "animate-spin", // 1s
        fast: "animate-spin-fast", // 0.5s
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
      speed: "default"
    },
  }
);

// Component props
export interface TeamMascotSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof teamMascotSpinnerVariants> {
  label?: string;
}

// Main component
export function TeamMascotSpinner({
  className,
  size,
  variant,
  speed,
  label,
  ...props
}: TeamMascotSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center" {...props}>
      <div 
        className={cn(
          teamMascotSpinnerVariants({ size, variant, speed }),
          className
        )}
      >
        <RobotIcon />
      </div>
      {label && <p className="mt-3 text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}

export default TeamMascotSpinner;