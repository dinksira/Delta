/**
 * LiveVideoFeed — a self-contained live `<video>` tile that renders a shared
 * camera `MediaStream`. Each instance owns its own local `<video>` ref and
 * attaches the stream in an effect, so the same acquired stream can be shown in
 * *multiple* places at once (a participant's full-bleed rectangle tile, the
 * host stage, a small corner preview) without the single-ref collision that
 * your old `videoRef`-shared approach hit.
 *
 * `mirror` flips the feed horizontally — required for any self-view (like Zoom,
 * your own camera is mirrored so your movement feels natural).
 *
 * @example
 * ```tsx
 * <LiveVideoFeed mediaStream={stream} mirror className="size-full rounded-xl" />
 * ```
 */

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

export interface LiveVideoFeedProps {
  /** The live media stream to render. When null the tile stays empty. */
  mediaStream: MediaStream | null;
  /** Mirrors the feed horizontally — set for self-view camera feeds. */
  mirror?: boolean;
  /** Rounded shape: "square" | "rounded" | "circle". Default: "rounded". */
  shape?: "square" | "rounded" | "circle";
  className?: string;
}

export function LiveVideoFeed({
  mediaStream,
  mirror = false,
  shape = "rounded",
  className,
}: Readonly<LiveVideoFeedProps>) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.srcObject = mediaStream;
    }
    return () => {
      if (video) {
        video.srcObject = null;
      }
    };
  }, [mediaStream]);

  const shapeClasses: Record<NonNullable<LiveVideoFeedProps["shape"]>, string> = {
    square: "rounded-none",
    rounded: "rounded-xl",
    circle: "rounded-full",
  };

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      aria-hidden
      className={cn(
        "pointer-events-none object-cover",
        mirror && "-scale-x-100",
        shapeClasses[shape],
        className,
      )}
    />
  );
}

export default LiveVideoFeed;
