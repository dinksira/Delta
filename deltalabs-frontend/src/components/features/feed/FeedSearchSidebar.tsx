"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useDeferredValue, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { SearchInput } from "@/components/theme/SearchInput";
import { fetchGlobalSearch } from "@/modules/Feed/api";
import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type FeedSearchSidebarLabels = Readonly<{
  aria: string;
  close: string;
  cancel: string;
  loading: string;
  error: string;
  empty: string;
  viewAllTemplate: string;
}>;

type FeedSearchSidebarProps = Readonly<{
  open: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (value: string) => void;
  onSubmitFullSearch: (raw: string) => void;
  labels: FeedSearchSidebarLabels;
  searchPlaceholder: string;
}>;

type SuggestionRow = Readonly<{
  id: string;
  text: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ HELPERS ############################# */
function mergeClips(data: Awaited<ReturnType<typeof fetchGlobalSearch>>): readonly LandingVideoClip[] {
  const { videos, audio, simulations } = data;
  return [...videos, ...audio, ...simulations];
}

function buildSuggestionRows(
  users: readonly { id: string; username: string }[],
  clips: readonly LandingVideoClip[],
  maxRows: number,
): SuggestionRow[] {
  const rows: SuggestionRow[] = [];
  for (const u of users) {
    if (rows.length >= maxRows) break;
    rows.push({ id: `u-${u.id}`, text: `@${u.username}` });
  }
  for (const c of clips) {
    if (rows.length >= maxRows) break;
    const t = c.caption.trim() || "—";
    rows.push({ id: `c-${c.id}`, text: t.length > 72 ? `${t.slice(0, 72)}…` : t });
  }
  return rows;
}

function IconSearchGlyph({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={8.5} cy={8.5} r={5.25} stroke="currentColor" strokeWidth={1.5} />
      <path d="M12.2 12.2 16.25 16.25" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

function viewAllLabel(template: string, q: string): string {
  return template.replace(/\{q\}/g, q || "…");
}
/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Fixed left drawer under the global header: wider than the feed rail (`26rem` cap) with the same
 * horizontal / top padding as the feed search row so the pill lines up.
 * Cancel is a circular icon button beside the search pill (not inside the field).
 */
export function FeedSearchSidebar({
  open,
  onClose,
  query,
  onQueryChange,
  onSubmitFullSearch,
  labels,
  searchPlaceholder,
}: FeedSearchSidebarProps) {
  const deferredQ = useDeferredValue(query.trim());
  const qEnabled = deferredQ.length >= 1;

  const searchQuery = useQuery({
    queryKey: ["feedSearchSidebar", deferredQ],
    queryFn: () => fetchGlobalSearch({ q: deferredQ, tab: "top", limit: 24 }),
    enabled: open && qEnabled,
  });

  const clips = useMemo(() => (searchQuery.data ? mergeClips(searchQuery.data) : []), [searchQuery.data]);
  const users = searchQuery.data?.users ?? [];

  const suggestionRows = useMemo(
    () => (qEnabled && searchQuery.isSuccess ? buildSuggestionRows(users, clips, 14) : []),
    [qEnabled, searchQuery.isSuccess, users, clips],
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const footerLine = viewAllLabel(labels.viewAllTemplate, deferredQ);

  const handleCancel = () => {
    onQueryChange("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60]" role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-900/25 dark:bg-black/35"
        aria-label={labels.close}
        onClick={onClose}
      />
      <aside
        className="fixed bottom-0 left-0 top-16 z-[61] flex w-full max-w-full flex-col overflow-hidden bg-surface-default shadow-[4px_0_24px_rgba(15,23,42,0.12)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.45)] sm:max-w-[min(26rem,calc(100vw-0.5rem))] lg:max-w-[26rem]"
        role="dialog"
        aria-modal="true"
        aria-label={labels.aria}
        onClick={(e) => e.stopPropagation()}
      >
        {/*
          Match `FeedExplorerShell` + left aside: section `px-2 sm:px-3 lg:px-4`, rail `pt-2 sm:pt-3`,
          and default `SearchInput` pill (same as `FeedSearchInput` minus filter slot).
        */}
        <div className="shrink-0 px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchInput
                id="feed-search-sidebar-input"
                placeholder={searchPlaceholder}
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    onSubmitFullSearch(query);
                  }
                }}
                autoFocus
              />
            </div>
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-text-secondary shadow-sm ring-1 ring-border-default/60 transition-colors hover:bg-surface-muted/90 hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:bg-white/10 dark:ring-white/10 dark:hover:bg-white/15"
              aria-label={labels.cancel}
              onClick={handleCancel}
            >
              <X className="size-5 shrink-0" strokeWidth={2} aria-hidden />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-1 sm:px-3 lg:px-4 [-ms-overflow-style:none] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border-default">
          {qEnabled && searchQuery.isPending ? (
            <p className="py-2 text-sm text-text-secondary">{labels.loading}</p>
          ) : null}
          {searchQuery.isError ? (
            <p className="py-2 text-sm text-text-secondary">{labels.error}</p>
          ) : null}

          {qEnabled && searchQuery.isSuccess && suggestionRows.length > 0 ? (
            <ul className="space-y-0.5" aria-label={labels.aria}>
              {suggestionRows.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md py-2.5 pl-0 pr-0 text-left text-sm leading-snug text-text-primary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-300"
                    onClick={() => onQueryChange(row.text)}
                  >
                    <span className="mt-0.5 shrink-0 text-text-secondary" aria-hidden>
                      <IconSearchGlyph className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1 break-words">{row.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {qEnabled && searchQuery.isSuccess && suggestionRows.length === 0 ? (
            <p className="py-3 text-sm text-text-secondary">{labels.empty}</p>
          ) : null}
        </div>

        {qEnabled ? (
          <div className="shrink-0 px-2 pb-3 pt-2 sm:px-3 lg:px-4">
            <button
              type="button"
              className="w-full py-2 text-left text-sm font-semibold text-primary-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
              onClick={() => onSubmitFullSearch(query)}
            >
              {footerLine}
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
