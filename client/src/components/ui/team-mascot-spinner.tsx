import React from 'react';
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMascotSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
  label?: string;
  variant?: 'primary' | 'secondary';
  speed?: 'slow' | 'default' | 'fast';
}

export default function TeamMascotSpinner({ 
  size = 'md', 
  className,
  message,
  label,
  variant = 'primary',
  speed = 'default'
}: TeamMascotSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };
  
  const variantClasses = {
    primary: "text-primary",
    secondary: "text-secondary"
  };
  
  const speedClasses = {
    slow: "animate-spin-slow",
    default: "animate-spin",
    fast: "animate-spin-fast"
  };

  // Use label if provided, otherwise use message
  const displayText = label || message;

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2",
      className
    )}>
      <Loader2 
        className={cn(
          speedClasses[speed],
          variantClasses[variant], 
          sizeClasses[size]
        )} 
      />
      {displayText && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {displayText}
        </p>
      )}
    </div>
  );
}