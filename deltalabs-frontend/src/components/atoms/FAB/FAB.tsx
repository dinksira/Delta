import React from 'react';
import { LucideIcon } from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface FABProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  iconSize?: number;
  iconStrokeWidth?: number;
  isStatic?: boolean; // New prop to disable all interactive effects
}

export const FAB: React.FC<FABProps> = ({ 
  icon: Icon, 
  size = 'md', 
  variant = 'primary',
  iconSize,
  iconStrokeWidth = 2.5,
  isStatic = false,
  className,
  ...props 
}) => {
  const sizeClasses = {
    sm: "w-10 h-10 rounded-lg",
    md: "w-12 h-12 rounded-xl",
    lg: "w-14 h-14 rounded-2xl",
  };

  const variantClasses = {
    primary: "bg-[#0E4B5E] text-white shadow-[0_4px_12px_rgba(0,0,0,0.25)]",
    secondary: "bg-surface-default text-text-primary border border-border-default shadow-sm",
  };

  return (
    <button
      className={cn(
        "flex items-center justify-center transition-all",
        !isStatic && "active:scale-95 hover:brightness-110", // Only add effects if not static
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <Icon 
        size={iconSize || (size === 'sm' ? 18 : size === 'lg' ? 24 : 22)} 
        strokeWidth={iconStrokeWidth} 
        fill={variant === 'primary' ? 'currentColor' : 'none'}
      />
    </button>
  );
};

export default FAB;
