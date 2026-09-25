/**
 * IconButton — circular icon-only button for floating controls such as the
 * Live Duel media dock. Round by design; `tone` selects the surface color and
 * `isActive` fills the button to communicate an engaged toggle (e.g. mic on).
 *
 * @example
 * ```tsx
 * <IconButton icon={<Mic />} label="Toggle microphone" isActive={!micMuted} />
 * <IconButton icon={<PhoneOff />} label="Leave" tone="danger" />
 * ```
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type IconButtonTone = "surface" | "primary" | "danger";
export type IconButtonSize = "sm" | "md" | "lg";

export interface IconButtonProps {
  /** Lucide (or any) icon component instance. */
  icon: ReactNode;
  /** Accessible name for the control. */
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  /** Fills the button so an enabled toggle reads visually as active. */
  isActive?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const toneClasses: Record<IconButtonTone, string> = {
  surface: "bg-white/10 text-white hover:bg-white/20",
  primary: "bg-primary-600 text-white hover:bg-primary-700",
  danger: "bg-error-600 text-white hover:bg-error-700",
};

const sizeClasses: Record<IconButtonSize, string> = {
  sm: "size-9",
  md: "size-12",
  lg: "size-14",
};

/**
 * The `primary` tone doubles as the "active" state for surface toggles: on an
 * engaged control (mic unmuted, camera on) we swap to a solid primary fill.
 */
function resolveToneClass(tone: IconButtonTone, isActive: boolean): string {
  if (tone === "surface" && isActive) {
    return toneClasses.primary;
  }
  return toneClasses[tone];
}

export function IconButton({
  icon,
  label,
  tone = "surface",
  size = "md",
  isActive = false,
  disabled = false,
  className,
  onClick,
}: Readonly<IconButtonProps>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive || undefined}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full shadow-md transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        sizeClasses[size],
        resolveToneClass(tone, isActive),
        className,
      )}
    >
      {icon}
    </button>
  );
}

export default IconButton;