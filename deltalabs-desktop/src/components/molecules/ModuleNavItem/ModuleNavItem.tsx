/**
 * ModuleNavItem
 * Atomic Level: Molecule
 *
 * A single selectable pill button in a competition workspace "Modules" rail.
 * Renders an icon + label with hover tint and an active (filled primary) state.
 * Built from theme atoms only; used by the ModuleRail organism.
 * @example <ModuleNavItem id="question" label="Question Builder" icon={Braces} active onSelect={handleSelect} />
 */

import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ModuleNavItemProps {
  /** Stable identifier passed back via `onSelect`. */
  id: string;
  label: string;
  /** lucide-react icon for the module's nav tile. */
  icon: LucideIcon;
  active?: boolean;
  disabled?: boolean;
  onSelect: (id: string) => void;
  className?: string;
}

export const moduleNavItem = (active: boolean, disabled: boolean) =>
  cn(
    "flex w-full items-center gap-2.5 rounded-md px-3 py-3 text-sm font-medium transition-colors duration-150",
    disabled && "cursor-not-allowed opacity-50",
    active
      ? "bg-primary-700 text-text-inverse"
      : "border border-border-default bg-surface-default text-text-secondary hover:border-primary-400 hover:bg-primary-50 hover:text-text-primary",
  );

export function ModuleNavItem({
  id,
  label,
  icon: Icon,
  active = false,
  disabled = false,
  onSelect,
  className,
}: Readonly<ModuleNavItemProps>) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      disabled={disabled}
      aria-pressed={active}
      aria-current={active ? "step" : undefined}
      className={cn(moduleNavItem(active, disabled), className)}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

export default ModuleNavItem;