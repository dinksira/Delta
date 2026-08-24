/**
 * IconNavItem
 * Atomic Level: Molecule
 * 
 * Navigation item with an inline icon and label, matching the Course Home
 * top-bar design: small icon + text, no circular background.
 * The "action" variant renders a filled dark rounded button (e.g. edit pencil).
 */

import React from 'react';
import type { IconNavItemProps } from './IconNavItem.types';

// ============================================================================
// COMPONENT
// ============================================================================

export const IconNavItem: React.FC<IconNavItemProps> = ({
  icon,
  label,
  active = false,
  disabled = false,
  variant = 'default',
  onClick,
  className = '',
  ...props
}) => {
  const isAction = variant === 'action';

  // --- Action variant (dark filled rounded-xl button, no label) ---
  if (isAction) {
    return (
      <button
        className={`
          flex items-center justify-center
          w-10 h-10 rounded-xl
          bg-primary-800 text-white
          transition-all duration-200
          hover:bg-primary-900
          focus:outline-none
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}
        `}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
        {...props}
      >
        {icon}
      </button>
    );
  }

  // --- Default variant (inline icon + label, no background) ---
  return (
    <button
      className={`
        flex items-center gap-2 py-2 px-1
        transition-all duration-200
        focus:outline-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${active ? 'opacity-100' : ''}
        ${className}
      `}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...props}
    >
      <span className="shrink-0 text-text-secondary">
        {icon}
      </span>
      {label && (
        <span className="text-[13px] font-medium text-text-primary whitespace-nowrap">
          {label}
        </span>
      )}
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

IconNavItem.displayName = 'IconNavItem';

export default IconNavItem;
