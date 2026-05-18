import React from 'react';
import { cx } from '@/components/theme/utils';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-[#1C9E45] text-white',
  warning: 'bg-[#F5A623] text-white',
  error: 'bg-error-500 text-white',
  info: 'bg-primary-500 text-white',
  default: 'bg-surface-muted text-text-secondary',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  children,
  className,
  ...props
}) => {
  return (
    <span
      className={cx(
        'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
