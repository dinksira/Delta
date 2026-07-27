/**
 * ProgressStepper
 * Atomic Level: Molecule
 * 
 * Displays a multi-step progress indicator, commonly used in wizards (e.g. Ask Question).
 */

"use client";

import React from 'react';
import type { ProgressStepperProps } from './ProgressStepper.types';

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStepId,
  onStepClick,
  className = '',
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between relative">
        {/* Background Track */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-muted rounded-full" />
        
        {/* Active Track */}
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-500 rounded-full transition-all duration-500 ease-in-out"
          style={{ width: `${(Math.max(0, currentIndex) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div 
              key={step.id} 
              className="relative z-10 flex flex-col items-center"
            >
              <button
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-all duration-300 outline-none
                  ${isCompleted ? 'bg-primary-500 text-white hover:bg-primary-600' : ''}
                  ${isCurrent ? 'bg-surface-primary border-2 border-primary-500 text-primary-600 shadow-sm' : ''}
                  ${isPending ? 'bg-surface-primary border-2 border-border-default text-text-secondary hover:border-primary-300' : ''}
                  ${!onStepClick && isPending ? 'cursor-default pointer-events-none' : 'cursor-pointer'}
                `}
                onClick={() => {
                  if (onStepClick && (isCompleted || isCurrent)) {
                     onStepClick(step.id);
                  }
                }}
                disabled={!onStepClick || isPending}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>
              
              <div className="absolute top-10 flex flex-col items-center w-32 text-center">
                <span className={`text-sm font-medium ${isCurrent ? 'text-primary-600' : 'text-text-secondary'}`}>
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-text-muted mt-0.5 hidden md:block">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Add bottom padding to account for absolute positioned labels */}
      <div className="h-16" />
    </div>
  );
};

ProgressStepper.displayName = 'ProgressStepper';
