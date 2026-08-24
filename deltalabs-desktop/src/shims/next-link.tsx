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
  /** Accepted for Next.js parity; no-op in the desktop (everything is local). */
  prefetch?: boolean;
  /** Accepted for Next.js parity; no-op in the desktop. */
  replace?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Link: React.FC<LinkProps> = ({
  href,
  children,
  className = '',
  onClick,
  replace = false,
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  prefetch,
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
    if (replace) {
      window.history.replaceState(null, '', `#${href}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    } else {
      window.location.hash = href;
    }
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
