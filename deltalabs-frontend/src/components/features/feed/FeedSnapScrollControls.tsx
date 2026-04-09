"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useCallback, useEffect, useState, type RefObject } from "react";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedSnapScrollControlsProps = Readonly<{
  /** The vertically scrollable, snap-aligned feed element (one “page” ≈ `clientHeight`). */
  scrollContainerRef: RefObject<HTMLElement | null>;
  /** When the comment sidebar is open, nudge controls left into the gap next to the video (desktop). */
  commentSidebarOpen?: boolean;
  /** Extra classes for the fixed stack (e.g. responsive visibility). */
  className?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function IconChevronUp({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="m15 14-3-3-3 3"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronDown({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="m9 10 3 3 3-3"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/**
 * TikTok-style desktop up/down nudges: borderless circles, muted “up” chevron and stronger “down” chevron.
 * Light theme matches pale gray chips on a light surface; dark theme matches gunmetal on near-black.
 */
export function FeedSnapScrollControls({
  scrollContainerRef,
  commentSidebarOpen = false,
  className,
}: FeedSnapScrollControlsProps) {
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);

  const updateEdges = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    setAtTop(scrollTop <= 1);
    setAtBottom(scrollTop >= maxScroll - 1);
  }, [scrollContainerRef]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) {
      return;
    }
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(updateEdges);
      ro.observe(el);
    }
    return () => {
      el.removeEventListener("scroll", updateEdges);
      ro?.disconnect();
    };
  }, [scrollContainerRef, updateEdges]);

  const step = useCallback(
    (direction: -1 | 1) => {
      const el = scrollContainerRef.current;
      if (!el) {
        return;
      }
      const slides = Array.from(el.querySelectorAll<HTMLElement>("[data-feed-slide]"));
      if (slides.length === 0) {
        el.scrollBy({ top: direction * el.clientHeight, behavior: "smooth" });
        return;
      }

      // Use the nearest snapped slide as baseline so one click always moves exactly one slide.
      let currentIndex = 0;
      let minDelta = Number.POSITIVE_INFINITY;
      for (let i = 0; i < slides.length; i += 1) {
        const delta = Math.abs(slides[i].offsetTop - el.scrollTop);
        if (delta < minDelta) {
          minDelta = delta;
          currentIndex = i;
        }
      }

      const targetIndex = Math.max(0, Math.min(slides.length - 1, currentIndex + direction));
      slides[targetIndex]?.scrollIntoView({ block: "start", behavior: "smooth" });
    },
    [scrollContainerRef],
  );

  const shell =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border-0 shadow-none " +
    "bg-black/[0.06] hover:bg-black/[0.09] active:bg-black/[0.11] " +
    "dark:bg-surface-muted dark:hover:bg-surface-elevated dark:active:bg-surface-elevated " +
    "transition-[opacity,background-color] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-text-primary/15 focus-visible:ring-offset-0 dark:focus-visible:ring-text-inverse/25 " +
    "disabled:pointer-events-none disabled:opacity-[0.38]";

  const positionClasses = commentSidebarOpen
    ? "left-auto right-[calc(min(100vw,28rem)+0.75rem)] translate-x-0"
    : "left-auto right-3 translate-x-0";

  return (
    <div
      className={[
        "pointer-events-none fixed top-16 z-30 hidden h-[calc(100dvh-4rem)] flex-col justify-center gap-2 transition-[left,right,transform] duration-200 ease-out lg:flex",
        positionClasses,
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="pointer-events-auto flex flex-col gap-2">
        <button
          type="button"
          className={shell}
          aria-label="Previous video"
          disabled={atTop}
          onClick={() => step(-1)}
        >
          <IconChevronUp className="text-neutral-500 dark:text-[#a3a3a3]" />
        </button>
        <button
          type="button"
          className={shell}
          aria-label="Next video"
          disabled={atBottom}
          onClick={() => step(1)}
        >
          <IconChevronDown className="text-neutral-900 dark:text-white" />
        </button>
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
