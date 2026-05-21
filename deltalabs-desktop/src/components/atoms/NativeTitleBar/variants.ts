/**
 * NativeTitleBar Variants
 */

import type { TitleBarVariant } from "./NativeTitleBar.types";

// ============================================================================
// VARIANT CLASSES
// ============================================================================

export const variantClasses: Record<TitleBarVariant, string> = {
  default: "bg-surface-canvas border-b border-border-primary",
  translucent: "bg-surface-canvas/80 backdrop-blur-md border-b border-border-primary/50",
  solid: "bg-surface-primary border-b border-border-secondary",
};
