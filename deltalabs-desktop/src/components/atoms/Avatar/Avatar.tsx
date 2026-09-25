/**
 * Avatar — circular user avatar that falls back to monogram initials when no
 * image URL is provided. Used across the live stage, participant grid, and
 * chat overlays where host/participant identities are shown.
 *
 * @example
 * ```tsx
 * <Avatar name="Dr. Sarah Martinez" src={host.avatarUrl} size="md" />
 * <Avatar name="Dinksira Elsa" size="lg" />
 * ```
 */

import Image from "next/image";

import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  /** Display name used to derive monogram initials when `src` is absent. */
  name: string;
  /** Optional image source; when null/undefined the monogram fallback renders. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: "size-6 text-[10px]",
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-14 text-lg",
};

/** Two-letter monogram derived from the display name. */
export function getMonogram(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ name, src, size = "md", className }: Readonly<AvatarProps>) {
  if (src) {
    return (
      <Image
        src={src}
        alt={name}
        width={56}
        height={56}
        className={cn(
          "shrink-0 rounded-full object-cover ring-2 ring-white/60",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-primary-700 font-semibold text-white",
        sizeClasses[size],
        className,
      )}
    >
      {getMonogram(name)}
    </span>
  );
}

export default Avatar;