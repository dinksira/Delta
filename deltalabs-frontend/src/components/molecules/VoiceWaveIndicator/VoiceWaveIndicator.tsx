/**
 * VoiceWaveIndicator — Zoom-style circular voice indicator for Live Duel
 * speaking tiles. Renders a mic glyph in the centre surrounded by concentric
 * "ocean ripples": rings that expand outward radially and fade, exactly like
 * the audio pulse Google Meet / Zoom draw around a speaking person's tile.
 *
 * The `level` prop (0–1) drives `--dl-ripple-scale` / `--dl-ripple-opacity` CSS
 * custom properties, so the ripples swell out proportionate to the speaker's
 * actual volume (a soft whisper produces a small, faint ripple; loud speech a
 * wide, bold wave). `active` selects the speaking pulse animation; when idle
 * the rings settle into a slow breathing ripple so the tile still reads as
 * "live mic".
 *
 * @example
 * ```tsx
 * <VoiceWaveIndicator active={isSpeaking} level={voiceLevel} size="sm" />
 * ```
 */

import { Mic } from "lucide-react";

import { cn } from "@/lib/utils";

export type VoiceWaveIndicatorSize = "sm" | "md" | "lg";

export interface VoiceWaveIndicatorProps {
  /** True while the speaker's voice is above the activity threshold. */
  active: boolean;
  /** Voice level 0–1: grows the ripple scale + opacity. Default 0. */
  level?: number;
  /** Display scale. */
  size?: VoiceWaveIndicatorSize;
  className?: string;
}

const containerSizes: Record<VoiceWaveIndicatorSize, string> = {
  sm: "size-14",
  md: "size-24",
  lg: "size-44",
};

const micButtonSizes: Record<VoiceWaveIndicatorSize, string> = {
  sm: "size-8",
  md: "size-12",
  lg: "size-16",
};

const micIconSizes: Record<VoiceWaveIndicatorSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
};

/** Expand factor per ring beyond the mic button, scaled by voice level. */
const RING_BASE_SCALE = 1.6;

function ringStyle(level: number, index: number): React.CSSProperties | undefined {
  const normalized = Math.max(0, Math.min(1, level));
  const spread = RING_BASE_SCALE + index * 0.7;
  const scale = 1 + spread * (0.35 + normalized * 0.65);
  const opacity = Math.max(0.15, 0.55 - index * 0.16) * (0.45 + normalized * 0.55);
  return {
    "--dl-ripple-scale": String(scale),
    "--dl-ripple-opacity": String(opacity),
    // Position the ring just outside the mic button so it reads as a ripple.
    inset: `${index * 0.5 + 1.5}em`,
  } as React.CSSProperties;
}

export function VoiceWaveIndicator({
  active,
  level = 0,
  size = "md",
  className,
}: Readonly<VoiceWaveIndicatorProps>) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative flex items-center justify-center",
        containerSizes[size],
        className,
      )}
    >
      {/* Concentric ocean ripples — expand with voice level */}
      {[0, 1, 2].map((index) => (
        <span
          key={`ring-${index}`}
          aria-hidden
          className={cn(
            "absolute rounded-full border-2 border-primary-400/60",
            active ? "dl-ripple-pulse" : "dl-ripple-breathe",
          )}
          style={ringStyle(level, index)}
        />
      ))}
      <span
        className={cn(
          "relative z-10 flex items-center justify-center rounded-full text-white shadow-inner transition-colors",
          active
            ? "bg-primary-500 shadow-primary-500/30"
            : "bg-primary-700 shadow-primary-900/20",
          micButtonSizes[size],
        )}
      >
        <Mic className={micIconSizes[size]} />
      </span>
    </div>
  );
}

export default VoiceWaveIndicator;
