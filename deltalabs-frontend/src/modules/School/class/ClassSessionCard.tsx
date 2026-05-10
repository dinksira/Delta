"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, Clock, EllipsisVertical, Presentation } from "lucide-react";

import { Button } from "@/components/theme";
import type { ClassSessionDto } from "@/modules/School/api";
import { formatClassSessionDate, sessionTypeLabel } from "@/modules/School/class/classSessionFormat";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/**
 * Session card layout from mockups:
 * — Row: whiteboard icon + title + overflow menu
 * — Description
 * — Meta: calendar date + duration (clock/globe)
 * — Footer: Start Session (left) + modality label (right)
 */

export function ClassSessionCard({
  session,
  canMutate,
  starting,
  onStart,
  onJoinLive,
}: Readonly<{
  session: ClassSessionDto;
  canMutate: boolean;
  starting: boolean;
  onStart: () => void;
  /** When the session is live, opens the full-screen Meet-style room. */
  onJoinLive?: () => void;
}>) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRootRef = useRef<HTMLDivElement>(null);

  const durationLabel =
    typeof session.durationMinutes === "number" && session.durationMinutes > 0
      ? `${session.durationMinutes}:00 min`
      : "—";
  const canStart = canMutate && session.status !== "live" && session.status !== "completed";
  const showJoin = session.status === "live" && Boolean(onJoinLive);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (menuRootRef.current?.contains(event.target)) return;
      setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  return (
    <article className={CLASS_WORKSPACE_LAYOUT.sessionCard}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-800">
            <Presentation className="size-[1.15rem]" aria-hidden />
          </span>
          <h3 className="min-w-0 pt-1.5 text-base font-semibold leading-snug text-text-primary sm:text-[1.05rem]">{session.title}</h3>
        </div>
        <div className="relative shrink-0" ref={menuRootRef}>
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-secondary"
            aria-label="Session options"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <EllipsisVertical className="size-4" aria-hidden />
          </button>
          {menuOpen ? (
            <div
              className="absolute right-0 top-9 z-20 w-44 rounded-lg border border-border-default bg-surface-default py-1 shadow-lg"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full px-3 py-2 text-left text-sm text-text-tertiary"
                onClick={() => setMenuOpen(false)}
              >
                More actions soon
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <p className="mt-3 min-h-[2.75rem] text-[13px] leading-relaxed text-text-secondary sm:text-sm">
        {session.description?.trim() ? session.description : "No description yet."}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[12px] text-text-secondary sm:text-[13px]">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
          {formatClassSessionDate(session.scheduledAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5 shrink-0 text-text-tertiary" aria-hidden />
          {durationLabel}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border-default pt-4">
        {showJoin ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="h-9 min-w-[7.5rem] px-4 text-xs sm:text-[13px]"
            onClick={onJoinLive}
          >
            Join
          </Button>
        ) : (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="h-9 min-w-[7.5rem] px-4 text-xs sm:text-[13px]"
            disabled={!canStart || starting}
            onClick={onStart}
          >
            {starting ? "Starting…" : session.status === "live" ? "Live" : "Start Session"}
          </Button>
        )}
        <span className="text-[12px] font-semibold text-text-secondary sm:text-[13px]">{sessionTypeLabel(session.sessionType)}</span>
      </div>
    </article>
  );
}
