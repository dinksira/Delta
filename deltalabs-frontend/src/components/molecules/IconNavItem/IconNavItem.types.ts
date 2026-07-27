import { HTMLAttributes, ReactNode } from 'react';

export type IconNavItemVariant = 'default' | 'action';

export interface IconNavItemProps extends HTMLAttributes<HTMLButtonElement> {
  /** Icon element to display */
  icon: ReactNode;
  
  /** Text label */
  label?: string;
  
  /** Active state */
  active?: boolean;
  
  /** Disabled state */
  disabled?: boolean;
  
  /** Visual variant */
  variant?: IconNavItemVariant;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Additional CSS classes */
  className?: string;
}
