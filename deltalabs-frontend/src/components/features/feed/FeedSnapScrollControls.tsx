"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

type FeedSnapScrollControlsProps = Readonly<{
  /** The vertically scrollable, snap-aligned feed element (one “page” ≈ `clientHeight`). */
  scrollContainerRef: RefObject<HTMLElement | null>;
  /** Extra classes for the fixed stack (e.g. responsive visibility). */
  className?: string;
}>;

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

/**
 * TikTok-style desktop up/down nudges: borderless circles, muted “up” chevron and stronger “down” chevron.
 * Light theme matches pale gray chips on a light surface; dark theme matches gunmetal on near-black.
 */
export function FeedSnapScrollControls({ scrollContainerRef, className }: FeedSnapScrollControlsProps) {
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
      el.scrollBy({ top: direction * el.clientHeight, behavior: "smooth" });
    },
    [scrollContainerRef],
  );

  const shell =
    "inline-flex h-11 w-11 items-center justify-center rounded-full border-0 shadow-none " +
    "bg-black/[0.06] hover:bg-black/[0.09] active:bg-black/[0.11] " +
    "dark:bg-[#2f2f2f] dark:hover:bg-[#3a3a3a] dark:active:bg-[#404040] " +
    "transition-[opacity,background-color] focus-visible:outline-none focus-visible:ring-2 " +
    "focus-visible:ring-neutral-900/15 focus-visible:ring-offset-0 dark:focus-visible:ring-white/25 " +
    "disabled:pointer-events-none disabled:opacity-[0.38]";

  return (
    <div
      className={[
        "pointer-events-none fixed right-3 top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-2 lg:flex",
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
