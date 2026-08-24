/**
 * ProgressStepper
 * Atomic Level: Molecule
 *
 * Displays a multi-step progress indicator, commonly used in wizards
 * (e.g. Ask Question, Create Topic Battle). Supports per-step icons,
 * a large badge size for wide wizard headers, and a filled active state.
 */

"use client";

import React from 'react';
import { cx } from '@/components/theme/utils';
import type { ProgressStepperProps } from './ProgressStepper.types';

const badgeSizeClasses = {
  sm: 'w-8 h-8 text-sm',
  lg: 'size-[52px] text-base',
} as const;

const iconSizeClasses = {
  sm: 'w-4 h-4',
  lg: 'w-6 h-6',
} as const;

const labelOffsetClasses = {
  sm: 'top-10',
  lg: 'top-[60px]',
} as const;

const spacerHeightClasses = {
  sm: 'h-16',
  lg: 'h-28',
} as const;

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  steps,
  currentStepId,
  onStepClick,
  size = 'sm',
  filledCurrent = false,
  className = '',
}) => {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  return (
    <div className={cx('w-full', className)}>
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
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <button
                type="button"
                className={cx(
                  'rounded-full flex items-center justify-center font-medium transition-all duration-300 outline-none',
                  badgeSizeClasses[size],
                  isCompleted && 'bg-primary-500 text-white hover:bg-primary-600',
                  isCurrent && !filledCurrent &&
                    'bg-surface-primary border-2 border-primary-500 text-primary-600 shadow-sm',
                  isCurrent && filledCurrent && 'bg-primary-700 text-white shadow-sm',
                  isPending &&
                    'bg-surface-primary border-2 border-border-default text-text-tertiary hover:border-primary-300',
                  !onStepClick && isPending ? 'cursor-default pointer-events-none' : 'cursor-pointer',
                )}
                onClick={() => {
                  if (onStepClick && (isCompleted || isCurrent)) {
                    onStepClick(step.id);
                  }
                }}
                disabled={!onStepClick || isPending}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {step.icon ? (
                  <span className={cx('flex items-center justify-center', iconSizeClasses[size])}>
                    {step.icon}
                  </span>
                ) : isCompleted ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={iconSizeClasses[size]}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </button>

              <div className={cx('absolute flex flex-col items-center w-32 text-center', labelOffsetClasses[size])}>
                <span
                  className={cx(
                    'text-sm',
                    isCurrent ? (filledCurrent ? 'font-bold text-primary-700 underline underline-offset-4' : 'font-bold text-primary-600 underline underline-offset-4') : 'font-medium text-text-secondary',
                  )}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span className="text-xs text-text-secondary mt-0.5 hidden md:block">
                    {step.description}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add bottom padding to account for absolute positioned labels */}
      <div className={spacerHeightClasses[size]} />
    </div>
  );
};

ProgressStepper.displayName = 'ProgressStepper';
