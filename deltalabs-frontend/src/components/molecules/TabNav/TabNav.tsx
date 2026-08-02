import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabNavItem {
  id: string;
  label: string;
  icon?: ReactNode;
}

export interface TabNavProps {
  items: TabNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  /** `"pills"` renders a segmented control; `"text"` renders bare text tabs with dividers. */
  variant?: "pills" | "text";
  className?: string;
}

export function TabNav({
  items,
  activeId,
  onSelect,
  variant = "pills",
  className,
}: Readonly<TabNavProps>) {
  if (variant === "text") {
    return (
      <div
        role="tablist"
        aria-label="View sections"
        className={cn("inline-flex items-center", className)}
      >
        {items.map((item, index) => {
          const active = item.id === activeId;
          return (
            <span key={item.id} className="inline-flex items-center">
              {index > 0 && (
                <span aria-hidden className="mx-1 h-4 w-px bg-border-default" />
              )}
              <button
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                  active
                    ? "bg-primary-600 text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {item.icon && <span className="size-4">{item.icon}</span>}
                <span>{item.label}</span>
              </button>
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="View sections"
      className={cn(
        "inline-flex items-center gap-1 rounded-2xl border border-border-default bg-surface-default p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(item.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "text-text-secondary hover:bg-surface-muted hover:text-text-primary",
            )}
          >
            {item.icon && <span className="size-4">{item.icon}</span>}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
