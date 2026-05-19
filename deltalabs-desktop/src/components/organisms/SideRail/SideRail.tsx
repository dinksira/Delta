/**
 * SideRail
 * Atomic Level: Organism
 * 
 * A persistent vertical navigation sidebar designed for desktop layouts.
 * Supports collapsed and expanded states with smooth transitions.
 */

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { SideRailProps } from "./SideRail.types";
import { sideRailClasses } from "./variants";

// ============================================================================
// COMPONENT
// ============================================================================

export const SideRail: React.FC<SideRailProps> = ({
  items,
  collapsed = false,
  activeId,
  onItemClick,
  header,
  footer,
  className,
  ...props
}) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        sideRailClasses.container,
        collapsed ? sideRailClasses.collapsed : sideRailClasses.expanded,
        className
      )}
      {...props}
    >
      {/* Header Slot */}
      {header && (
        <div className={cn(
          "flex h-16 shrink-0 items-center border-b border-border-secondary px-4",
          collapsed && "justify-center px-0"
        )}>
          {header}
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = activeId === item.id || pathname === item.href || pathname.startsWith(`${item.href}/`);
            
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  onClick={() => onItemClick?.(item.id)}
                  className={cn(
                    sideRailClasses.item.base,
                    isActive ? sideRailClasses.item.active : sideRailClasses.item.inactive,
                    collapsed && sideRailClasses.item.collapsed
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={cn("shrink-0", isActive ? "text-primary-600" : "text-text-secondary")}>
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Slot */}
      {footer && (
        <div className={cn(
          "shrink-0 border-t border-border-secondary p-4",
          collapsed && "flex justify-center p-2"
        )}>
          {footer}
        </div>
      )}
    </aside>
  );
};

SideRail.displayName = "SideRail";

// ============================================================================
// EXPORTS
// ============================================================================

export default SideRail;
