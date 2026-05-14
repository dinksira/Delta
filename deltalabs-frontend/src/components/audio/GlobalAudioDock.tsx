"use client";

/** Spotify-style persistent player bar (public shell). */
import { useCallback, useMemo, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, X } from "lucide-react";

import { cx } from "@/components/theme/utils";
import { usePersistentAudioPlayer } from "@/contexts/PersistentAudioPlayer_Context";
import { isPublicAudioChromePath, isPublicAudioEpisodeDetailPath } from "@/lib/publicAudioDockRoutes";

const DOCK_H = "min-h-[88px] max-h-[88px]";

const COVER_GRADIENTS = [
  "from-slate-700 via-slate-800 to-slate-950",
  "from-primary-800 via-slate-900 to-black",
  "from-emerald-900 via-slate-900 to-black",
] as const;

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function GlobalAudioDock() {
  const pathname = usePathname();
  const showChrome = isPublicAudioChromePath(pathname);
  const {
    track,
    isPlaying,
    togglePlay,
    closeAndStop,
    currentTimeSec,
    durationSec,
    seekTo,
    skipPrev,
    skipNext,
    volume,
    setVolume,
    shuffleEnabled,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
  } = usePersistentAudioPlayer();

  const seekBarRef = useRef<HTMLDivElement | null>(null);

  const displayDuration = useMemo(() => {
    if (durationSec > 0) return durationSec;
    if (track?.durationS && track.durationS > 0) return track.durationS;
    return 0;
  }, [durationSec, track?.durationS]);

  const progress = displayDuration > 0 ? Math.min(1, currentTimeSec / displayDuration) : 0;

  const onSeekBarPointer = useCallback(
    (clientX: number) => {
      const el = seekBarRef.current;
      if (!el || displayDuration <= 0) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      seekTo(ratio * displayDuration);
    },
    [displayDuration, seekTo],
  );

  if (!track || !showChrome) return null;

  const showDockClose = !isPublicAudioEpisodeDetailPath(pathname);

  const coverClass = COVER_GRADIENTS[Math.abs(track.mediaTone) % COVER_GRADIENTS.length];

  return (
    <div
      className={cx(
        "fixed bottom-0 left-0 right-0 z-[60] border-t border-white/10 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.45)]",
        DOCK_H,
        "bg-[#121212]",
      )}
    >
      <div className="mx-auto flex h-full max-w-[100vw] items-center gap-2 px-2 sm:gap-4 sm:px-4">
        {/* Left: art + meta */}
        <div className="flex min-w-0 flex-[1.1] items-center gap-3 sm:flex-[1.2]">
          <div
            className={cx(
              "size-14 shrink-0 overflow-hidden rounded bg-gradient-to-br text-[10px] font-bold leading-tight text-white/90 ring-1 ring-white/10 sm:size-[56px]",
              coverClass,
            )}
            aria-hidden
          >
            <div className="flex h-full w-full items-center justify-center px-1 text-center">ΔL</div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">{track.title}</p>
            <p className="truncate text-xs text-white/60">{track.artistsLabel}</p>
          </div>
        </div>

        {/* Center: transport + seek */}
        <div className="flex min-w-0 flex-[1.4] flex-col items-center justify-center gap-1.5 sm:flex-[1.6] lg:max-w-[45vw]">
          <div className="flex items-center justify-center gap-1 sm:gap-3">
            <button
              type="button"
              onClick={toggleShuffle}
              className={cx(
                "rounded-full p-1.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:p-2",
                shuffleEnabled ? "text-emerald-400" : "text-white/55",
              )}
              aria-pressed={shuffleEnabled}
              aria-label="Shuffle"
            >
              <Shuffle className="size-4 sm:size-[18px]" />
            </button>
            <button
              type="button"
              onClick={skipPrev}
              className="rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:p-2"
              aria-label="Previous"
            >
              <SkipBack className="size-4 fill-current sm:size-[18px]" />
            </button>
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-9 items-center justify-center rounded-full bg-white text-black shadow-md transition-transform hover:scale-[1.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 sm:size-10"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-4 sm:size-[18px]" fill="currentColor" /> : <Play className="size-4 translate-x-px sm:size-[18px]" fill="currentColor" />}
            </button>
            <button
              type="button"
              onClick={skipNext}
              className="rounded-full p-1.5 text-white/90 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:p-2"
              aria-label="Next"
            >
              <SkipForward className="size-4 fill-current sm:size-[18px]" />
            </button>
            <button
              type="button"
              onClick={cycleRepeat}
              className={cx(
                "relative rounded-full p-1.5 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 sm:p-2",
                repeatMode !== "off" ? "text-emerald-400" : "text-white/55",
              )}
              aria-label={`Repeat: ${repeatMode}`}
            >
              <Repeat className="size-4 sm:size-[18px]" />
              {repeatMode === "one" ? (
                <span className="absolute -right-0.5 -top-0.5 flex size-3.5 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                  1
                </span>
              ) : null}
              {repeatMode !== "off" ? <span className="absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full bg-emerald-400" /> : null}
            </button>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 px-1">
            <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-white/50 sm:text-[11px]">{formatClock(currentTimeSec)}</span>
            <div
              ref={seekBarRef}
              role="slider"
              tabIndex={0}
              aria-valuemin={0}
              aria-valuemax={Math.round(displayDuration)}
              aria-valuenow={Math.round(currentTimeSec)}
              className="group relative h-3 flex-1 cursor-pointer py-1"
              onClick={(e) => onSeekBarPointer(e.clientX)}
              onKeyDown={(e) => {
                if (e.key === "ArrowLeft") seekTo(Math.max(0, currentTimeSec - 5));
                if (e.key === "ArrowRight") seekTo(Math.min(displayDuration, currentTimeSec + 5));
              }}
            >
              <div className="pointer-events-none absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white group-hover:bg-emerald-400"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
            <span className="w-9 shrink-0 text-[10px] tabular-nums text-white/50 sm:text-[11px]">{formatClock(displayDuration)}</span>
          </div>
        </div>

        {/* Right: volume + close */}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <div className="flex max-w-[120px] items-center gap-1.5 sm:max-w-[140px] sm:gap-2">
            <Volume2 className="size-3.5 shrink-0 text-white/55 sm:size-4" aria-hidden />
            <input
              type="range"
              min={0}
              max={1}
              step={0.02}
              value={volume}
              onChange={(e) => setVolume(Number.parseFloat(e.target.value))}
              className="h-1 w-full min-w-[56px] cursor-pointer accent-white sm:min-w-[72px]"
              aria-label="Volume"
            />
          </div>
          {showDockClose ? (
            <button
              type="button"
              onClick={closeAndStop}
              className="shrink-0 rounded-full p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
              aria-label="Stop and close player"
            >
              <X className="size-4 sm:size-[18px]" strokeWidth={2.25} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/** Adds bottom padding when a track is loaded so content clears the fixed dock. */
export function PublicScrollAreaWithAudioDockPadding({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const { track } = usePersistentAudioPlayer();
  const reserveDockSpace = Boolean(track) && isPublicAudioChromePath(pathname);
  return (
    <div
      className={cx("flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden", reserveDockSpace ? "pb-[88px]" : undefined)}
    >
      {children}
    </div>
  );
}
