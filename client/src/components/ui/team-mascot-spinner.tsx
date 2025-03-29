import React from 'react';
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeamMascotSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export default function TeamMascotSpinner({ 
  size = 'md', 
  className,
  message 
}: TeamMascotSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12"
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2",
      className
    )}>
      <Loader2 
        className={cn(
          "animate-spin text-primary", 
          sizeClasses[size]
        )} 
      />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}