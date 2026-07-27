/**
 * NativeTitleBar Variants
 */

import type { TitleBarVariant } from "./NativeTitleBar.types";

// ============================================================================
// VARIANT CLASSES
// ============================================================================

export const variantClasses: Record<TitleBarVariant, string> = {
  default: "bg-surface-canvas border-b border-border-default",
  translucent: "bg-surface-canvas/80 backdrop-blur-md border-b border-border-default/50",
  solid: "bg-surface-default border-b border-border-subtle",
};
