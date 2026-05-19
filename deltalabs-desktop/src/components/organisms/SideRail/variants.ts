/**
 * SideRail Variants
 */

// ============================================================================
// VARIANT CLASSES
// ============================================================================

export const sideRailClasses = {
  container: "flex h-full flex-col bg-surface-primary border-r border-border-primary transition-all duration-300",
  expanded: "w-64",
  collapsed: "w-20",
  item: {
    base: "flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors cursor-pointer",
    active: "bg-primary-50 text-primary-600 border-r-4 border-primary-600",
    inactive: "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
    collapsed: "justify-center px-0",
  }
};
