/**
 * Link Shim
 * Shim to replace next/link in the desktop build environment.
 *
 * @example
 * ```tsx
 * <Link href="/dashboard" className="text-blue-500">Go to Dashboard</Link>
 * ```
 */

import React from 'react';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  className = '',
  onClick,
  ...props
}) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    if (onClick) {
      onClick(event);
    }
    
    // Check if event was default-prevented
    if (event.isDefaultPrevented()) {
      return;
    }
    
    // Captured route to navigate to locally
    event.preventDefault();
    
    // Set hash state to trigger routers or load page locally
    window.location.hash = href;
  };

  return (
    <a 
      href={`#${href}`} 
      onClick={handleClick} 
      className={className} 
      {...props}
    >
      {children}
    </a>
  );
};

Link.displayName = 'Link';

// ============================================================================
// EXPORTS
// ============================================================================

export default Link;
