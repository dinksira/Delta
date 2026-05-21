/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import {
  AudioLines,
  Ellipsis,
  MonitorSmartphone,
  Flag,
  HeartCrack,
  VolumeX,
} from "lucide-react";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const TONE_GRADIENTS = [
  "bg-[radial-gradient(circle_at_30%_20%,#a8b7be_0%,#7f8f99_45%,#2f3c45_100%)]",
  "bg-[radial-gradient(circle_at_70%_30%,#9ca8b0_0%,#5c6b76_50%,#1e2830_100%)]",
  "bg-[radial-gradient(circle_at_40%_60%,#b8c4cc_0%,#6b7c88_45%,#253038_100%)]",
  "bg-[radial-gradient(circle_at_20%_70%,#8a9aa3_0%,#4a5862_48%,#1a2228_100%)]",
  "bg-[radial-gradient(circle_at_60%_40%,#c5ced4_0%,#75808a_42%,#2a343c_100%)]",
  "bg-[radial-gradient(circle_at_50%_15%,#aeb9c2_0%,#677682_46%,#222c34_100%)]",
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedMediaProps = Readonly<{
  clipId?: string;
  /** Picks a distinct placeholder gradient per clip. */
  tone?: number;
  videoSrc?: string;
  /** True only for the currently focused snap slide. */
  isActive?: boolean;
  /** Shared mute state across the full feed. */
  isMuted?: boolean;
  onToggleMute?: () => void;
  onFeedEvent?: (
    event: "view_start" | "view_complete" | "skip" | "hide",
    payload?: { watchMs?: number; positionMs?: number },
  ) => void;
  preloadStrategy?: "auto" | "metadata" | "none";
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedMedia({
  clipId,
  tone = 0,
  videoSrc,
  isActive = false,
  isMuted = true,
  onToggleMute,
  onFeedEvent,
  preloadStrategy = "metadata",
}: FeedMediaProps) {
  const [hasVideoError, setHasVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [indicator, setIndicator] = useState<"play" | "pause" | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTimeBadge, setShowTimeBadge] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const startedInSessionRef = useRef(false);
  const completedInSessionRef = useRef(false);
  const manualPausedRef = useRef(false);
  const indicatorTimerRef = useRef<number | null>(null);
  const timeBadgeTimerRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const className = TONE_GRADIENTS[((tone % TONE_GRADIENTS.length) + TONE_GRADIENTS.length) % TONE_GRADIENTS.length];

  const canUseVideo = Boolean(videoSrc) && !hasVideoError;
  const canControlMedia = process.env.NODE_ENV !== "test";
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const safePlay = async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const maybePromise = video.play?.();
      if (maybePromise && typeof maybePromise.then === "function") {
        await maybePromise;
      }
      setIsPlaying(!video.paused);
    } catch {
      setIsPlaying(false);
    }
  };

  const showIndicator = (type: "play" | "pause") => {
    setIndicator(type);
    if (indicatorTimerRef.current != null) {
      window.clearTimeout(indicatorTimerRef.current);
    }
    indicatorTimerRef.current = window.setTimeout(() => {
      setIndicator(null);
      indicatorTimerRef.current = null;
    }, 450);
  };

  const showTimeTemporarily = (ms = 900) => {
    setShowTimeBadge(true);
    if (timeBadgeTimerRef.current != null) {
      window.clearTimeout(timeBadgeTimerRef.current);
    }
    timeBadgeTimerRef.current = window.setTimeout(() => {
      setShowTimeBadge(false);
      timeBadgeTimerRef.current = null;
    }, ms);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !canUseVideo || !canControlMedia) return;
    if (!isActive) {
      if (startedInSessionRef.current && !completedInSessionRef.current && clipId) {
        onFeedEvent?.("skip", {
          watchMs: Math.max(0, Math.floor((video.currentTime || 0) * 1000)),
          positionMs: Math.max(0, Math.floor((video.currentTime || 0) * 1000)),
        });
      }
      video.pause();
      manualPausedRef.current = false;
      startedInSessionRef.current = false;
      completedInSessionRef.current = false;
      return;
    }
    if (!startedInSessionRef.current && clipId) {
      startedInSessionRef.current = true;
      onFeedEvent?.("view_start", { positionMs: Math.floor((video.currentTime || 0) * 1000) });
    }
    if (!manualPausedRef.current) {
      void safePlay();
    }
  }, [isActive, canUseVideo, canControlMedia, clipId, onFeedEvent]);

  useEffect(() => {
    return () => {
      if (indicatorTimerRef.current != null) {
        window.clearTimeout(indicatorTimerRef.current);
      }
      if (timeBadgeTimerRef.current != null) {
        window.clearTimeout(timeBadgeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      setMenuOpen(false);
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    const onVisibility = () => {
      const video = videoRef.current;
      if (!video || !canUseVideo || !canControlMedia) return;
      if (document.hidden) {
        video.pause();
      } else if (isActive && !manualPausedRef.current) {
        void safePlay();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [isActive, canUseVideo, canControlMedia]);

  const overlayLabel = useMemo(() => {
    if (!isActive) return "Video preview";
    return isPlaying ? "Pause video" : "Play video";
  }, [isActive, isPlaying]);

  const formatTime = (seconds: number): string => {
    if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
    const whole = Math.floor(seconds);
    const mm = Math.floor(whole / 60)
      .toString()
      .padStart(2, "0");
    const ss = (whole % 60).toString().padStart(2, "0");
    return `${mm}:${ss}`;
  };

  const resolveDuration = (video: HTMLVideoElement | null | undefined): number => {
    if (!video) return 0;
    if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
    try {
      if (video.seekable.length > 0) {
        const end = video.seekable.end(video.seekable.length - 1);
        if (Number.isFinite(end) && end > 0) return end;
      }
    } catch {
      /* ignore */
    }
    return 0;
  };

  return (
    <div className="group absolute inset-0">
      {canUseVideo ? (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={videoSrc}
            loop
            muted={isMuted}
            playsInline
            preload={preloadStrategy}
            aria-hidden
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onTimeUpdate={(e) => {
              const video = e.currentTarget;
              setCurrentTime(video.currentTime || 0);
              if (
                clipId &&
                startedInSessionRef.current &&
                !completedInSessionRef.current &&
                video.duration > 0
              ) {
                const completionRatio = video.currentTime / video.duration;
                if (completionRatio >= 0.8 || video.currentTime >= 12) {
                  completedInSessionRef.current = true;
                  onFeedEvent?.("view_complete", {
                    watchMs: Math.floor(video.currentTime * 1000),
                    positionMs: Math.floor(video.currentTime * 1000),
                  });
                }
              }
              if (duration <= 0) {
                const recovered = resolveDuration(video);
                if (recovered > 0) setDuration(recovered);
              }
            }}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              setDuration(resolveDuration(video));
            }}
            onDurationChange={(e) => {
              const video = e.currentTarget;
              setDuration((prev) => {
                const next = resolveDuration(video);
                return next > prev ? next : prev;
              });
            }}
            onCanPlay={(e) => {
              if (duration > 0) return;
              const recovered = resolveDuration(e.currentTarget);
              if (recovered > 0) setDuration(recovered);
            }}
            onError={() => setHasVideoError(true)}
          />
          <button
            type="button"
            className="absolute inset-0 z-[2] cursor-pointer bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label={overlayLabel}
            onClick={() => {
              const video = videoRef.current;
              if (!video || !isActive || !canControlMedia) return;
              if (video.paused) {
                manualPausedRef.current = false;
                void safePlay();
                showIndicator("play");
              } else {
                video.pause();
                manualPausedRef.current = true;
                setIsPlaying(false);
                showIndicator("pause");
              }
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-start justify-between p-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100">
            <button
              type="button"
              className="pointer-events-auto inline-flex size-10 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label={isMuted ? "Unmute video" : "Mute video"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.();
              }}
            >
              {isMuted ? <VolumeX className="size-6" /> : <AudioLines className="size-6" />}
            </button>

            <div ref={menuRef} className="pointer-events-auto relative">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                aria-label="Open video menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen((prev) => !prev);
                }}
              >
                <Ellipsis className="size-6" />
              </button>

              {menuOpen ? (
                <div className="absolute right-0 mt-2 w-[20rem] rounded-2xl border border-border-default bg-surface-default p-2 text-text-primary shadow-md">
                  <button
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left hover:bg-surface-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAutoScrollEnabled((prev) => !prev);
                    }}
                  >
                    <span className="inline-flex items-center gap-3 text-base font-medium">
                      <MonitorSmartphone className="size-5 text-text-secondary" />
                      Auto scroll
                    </span>
                    <span
                      className={[
                        "inline-flex h-7 w-12 items-center rounded-full p-0.5 transition-colors",
                        autoScrollEnabled ? "bg-primary-500" : "bg-border-default",
                      ].join(" ")}
                      aria-hidden
                    >
                      <span
                        className={[
                          "size-6 rounded-full bg-surface-default shadow-sm transition-transform",
                          autoScrollEnabled ? "translate-x-5" : "translate-x-0",
                        ].join(" ")}
                      />
                    </span>
                  </button>

                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base font-medium hover:bg-surface-muted"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (clipId) {
                        const video = videoRef.current;
                        onFeedEvent?.("hide", {
                          watchMs: Math.max(0, Math.floor((video?.currentTime || 0) * 1000)),
                          positionMs: Math.max(0, Math.floor((video?.currentTime || 0) * 1000)),
                        });
                      }
                      setMenuOpen(false);
                    }}
                  >
                    <HeartCrack className="size-5 text-text-secondary" />
                    Not interested
                  </button>

                  <button
                    type="button"
                    className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base font-medium hover:bg-surface-muted"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Flag className="size-5 text-text-secondary" />
                    Report
                  </button>
                </div>
              ) : null}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 z-[3] flex items-center justify-center">
            <span
              className={[
                "inline-flex size-16 items-center justify-center rounded-full bg-black/35 text-white transition-all duration-200",
                indicator ? "scale-100 opacity-100" : "scale-95 opacity-0",
              ].join(" ")}
              aria-hidden
            >
              {indicator === "pause" ? <Pause className="size-9 fill-white" /> : null}
              {indicator === "play" ? <Play className="size-9 fill-white" /> : null}
            </span>
          </div>
          {isActive ? (
            <div className="absolute inset-x-0 bottom-0 z-[4] px-3 pb-2">
              <div className="mb-1 flex justify-end">
                <span
                  className={[
                    "rounded-md bg-black/35 px-2 py-0.5 text-sm font-semibold text-white transition-opacity duration-150",
                    showTimeBadge || isScrubbing ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                >
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step={0.05}
                value={duration > 0 ? Math.min(currentTime, duration) : 0}
                aria-label="Seek video"
                className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/35 accent-white"
                style={{
                  background: `linear-gradient(to right, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) ${progressPct}%, rgba(255,255,255,0.35) ${progressPct}%, rgba(255,255,255,0.35) 100%)`,
                }}
                disabled={duration <= 0}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setIsScrubbing(true);
                  setShowTimeBadge(true);
                }}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  setIsScrubbing(false);
                  showTimeTemporarily(500);
                }}
                onChange={(e) => {
                  e.stopPropagation();
                  const next = Number(e.currentTarget.value);
                  const video = videoRef.current;
                  if (!video || !Number.isFinite(next)) return;
                  video.currentTime = next;
                  setCurrentTime(next);
                  setShowTimeBadge(true);
                }}
                onBlur={() => {
                  setIsScrubbing(false);
                  showTimeTemporarily(350);
                }}
              />
            </div>
          ) : null}
        </>
      ) : null}
      {!canUseVideo ? <div className={`absolute inset-0 ${className}`} /> : null}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
