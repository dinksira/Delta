/**
 * NativeTitleBar Types
 */

import type { HTMLAttributes } from "react";

// ============================================================================
// VARIANT TYPES
// ============================================================================

export type TitleBarVariant = "default" | "translucent" | "solid";

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface NativeTitleBarProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual style variant */
  variant?: TitleBarVariant;
  
  /** Title text to display (optional) */
  title?: string;
  
  /** Whether to show window controls (minimize, maximize, close) */
  showControls?: boolean;
}
