import type { ReactNode } from "react";

import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";

export interface GameModeCardProps {
  title: string;
  description: string;
  icon?: ReactNode;
  accentTone?: "primary" | "secondary" | "info";
  /** Icon chip shape: `"square"` (default) or `"circle"` for rounded medallions. */
  iconShape?: "square" | "circle";
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

interface AccentStyle {
  chip: string;
  chipHover: string;
  borderHover: string;
  ringHover: string;
  titleHover: string;
}

const accentStyles: Record<NonNullable<GameModeCardProps["accentTone"]>, AccentStyle> = {
  primary: {
    chip: "bg-primary-600 text-white dark:bg-primary-500 dark:text-white",
    chipHover: "group-hover:bg-primary-700 dark:group-hover:bg-primary-400",
    borderHover: "hover:border-primary-600",
    ringHover: "hover:ring-primary-600/20",
    titleHover: "group-hover:text-primary-700 dark:group-hover:text-primary-400",
  },
  secondary: {
    chip: "bg-secondary-600 text-white dark:bg-secondary-500 dark:text-white",
    chipHover: "group-hover:bg-secondary-700 dark:group-hover:bg-secondary-400",
    borderHover: "hover:border-secondary-600",
    ringHover: "hover:ring-secondary-600/20",
    titleHover: "group-hover:text-secondary-700 dark:group-hover:text-secondary-400",
  },
  info: {
    chip: "bg-info-600 text-white dark:bg-info-500 dark:text-white",
    chipHover: "group-hover:bg-info-700 dark:group-hover:bg-info-400",
    borderHover: "hover:border-info-600",
    ringHover: "hover:ring-info-600/20",
    titleHover: "group-hover:text-info-700 dark:group-hover:text-info-400",
  },
};

export function GameModeCard({
  title,
  description,
  icon,
  accentTone = "primary",
  iconShape = "square",
  actionLabel,
  onAction,
  className,
}: Readonly<GameModeCardProps>) {
  const accent = accentStyles[accentTone];

  return (
    <div
      className={cn(
        "group flex flex-col items-center gap-3 rounded-2xl border border-border-default bg-surface-default p-5 text-center shadow-sm",
        "transition-all duration-200 hover:bg-surface-muted hover:shadow-md hover:ring-2",
        accent.borderHover,
        accent.ringHover,
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex size-12 items-center justify-center transition-transform duration-200 group-hover:scale-105",
            iconShape === "circle" ? "rounded-full" : "rounded-xl",
            accent.chip,
            accent.chipHover,
          )}
        >
          {icon}
        </div>
      )}
      <div>
        <h3
          className={cn(
            "text-base font-semibold text-text-primary transition-colors duration-200",
            accent.titleHover,
          )}
        >
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-text-secondary">
          {description}
        </p>
      </div>
      {actionLabel && onAction && (
        <Button
          type="button"
          variant="primary"
          size="md"
          onClick={onAction}
          className="mt-auto w-full"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export default GameModeCard;
