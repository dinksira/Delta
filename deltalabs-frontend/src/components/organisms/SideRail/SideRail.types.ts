/**
 * SideRail Types
 */

import type { HTMLAttributes, ReactNode } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface SideRailItem {
  id: string;
  label: string;
  icon: ReactNode;
  href: string;
  active?: boolean;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface SideRailProps extends HTMLAttributes<HTMLDivElement> {
  /** Navigation items to display */
  items: SideRailItem[];
  
  /** Whether the sidebar is collapsed to icons only */
  collapsed?: boolean;
  
  /** Active item ID for highlighting */
  activeId?: string;
  
  /** Handler for item clicks */
  onItemClick?: (id: string) => void;
  
  /** Header slot for logo/branding */
  header?: ReactNode;
  
  /** Footer slot for user profile/settings */
  footer?: ReactNode;
}
