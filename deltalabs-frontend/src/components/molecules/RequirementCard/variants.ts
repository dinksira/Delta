/**
 * RequirementCard.variants
 * Shared Tailwind class maps and the spec-icon registry for `RequirementCard`.
 */

import { Clock, Cpu, Database, Eye, FlaskConical, GraduationCap, Monitor, Package } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { RequirementSpecIcon } from "./RequirementCard.types";

/** Card shell: elevation-lift on hover, per the design spec. */
export const cardClasses =
  "flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-surface-muted transition-transform duration-200 ease-out hover:-translate-y-1 focus-within:-translate-y-1";

/**
 * 16:10 media frame. Inset by 16px to match the card padding, with a 12px
 * radius; the status badge is positioned 12px inside this wrapper.
 */
export const mediaClasses = "relative m-4 aspect-[16/10] overflow-hidden rounded-xl";

/** Title block: 16px above, 12px below, per the design spec. */
export const titleClasses = "mt-4 mb-3 text-lg font-bold text-text-primary";

/** Body column inset, excluding the gap handled by the title margin. */
export const bodyClasses = "flex flex-1 flex-col px-4 pb-4";

/** Bottom-aligned call to action. */
export const ctaClasses = "mt-auto w-full font-semibold";

/** Spec-row glyph. Sized to the 18px specified in the design. */
export const specIconClasses = "size-[18px] shrink-0 text-text-secondary";

/**
 * Maps a serialisable spec key to a glyph. Every entry uses an icon already
 * imported elsewhere in the app, per the shared-library icon policy.
 */
export const specIconMap: Readonly<Record<RequirementSpecIcon, LucideIcon>> = {
  device: Monitor,
  time: Clock,
  level: GraduationCap,
  safety: Eye,
  lab: FlaskConical,
  material: Package,
  storage: Database,
  performance: Cpu,
};
