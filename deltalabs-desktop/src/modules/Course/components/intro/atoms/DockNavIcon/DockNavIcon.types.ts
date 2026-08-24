/**
 * DockNavIcon.types
 * Types and interfaces for the DockNavIcon component.
 */

import React from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DockNavIconProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Icon path string (SVG url) */
  icon: string;
  /** Accessible label for the icon */
  label: string;
  /** Whether this dock item is currently active */
  isActive: boolean;
  /** Click handler for dock item selection */
  onClick: () => void;
}
