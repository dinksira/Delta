/**
 * BackButton
 * A reusable button component for navigating back in the application.
 *
 * @example
 * ```tsx
 * <BackButton label="Back to Dashboard" onClick={() => router.back()} />
 * ```
 */

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cx } from '@/components/theme/utils';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Optional label to display next to the icon. */
  label?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BackButton: React.FC<BackButtonProps> = ({
  label = 'Back',
  className = '',
  ...props
}) => {
  return (
    <button
      type="button"
      className={cx(
        'group inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
        className
      )}
      {...props}
    >
      <div className="flex size-7 items-center justify-center rounded-full bg-surface-muted transition-colors group-hover:bg-surface-default group-hover:shadow-sm">
        <ChevronLeft className="size-4" />
      </div>
      <span>{label}</span>
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default BackButton;
