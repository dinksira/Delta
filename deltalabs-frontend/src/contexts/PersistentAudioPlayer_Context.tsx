"use client";

/** Global audio playback: one hidden `<audio>` + dock UI survives route changes under the public shell. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { isPublicAudioChromePath } from "@/lib/publicAudioDockRoutes";

/** ################################ TYPES ############################# */
export type PublicAudioTrackMeta = Readonly<{
  id: string;
  src: string;
  title: string;
  artistsLabel: string;
  durationS?: number;
  mediaTone: number;
}>;

export type RepeatMode = "off" | "all" | "one";

type PersistentAudioPlayerValue = Readonly<{
  track: PublicAudioTrackMeta | null;
  loadTrack: (next: PublicAudioTrackMeta) => void;
  /** Stop playback, clear the queue item, and hide the dock until a new track is loaded. */
  closeAndStop: () => void;
  isPlaying: boolean;
  togglePlay: () => void;
  currentTimeSec: number;
  durationSec: number;
  seekTo: (sec: number) => void;
  skipPrev: () => void;
  skipNext: () => void;
  volume: number;
  setVolume: (v: number) => void;
  shuffleEnabled: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  cycleRepeat: () => void;
}>;
/** ################################ /TYPES ############################# */

const PersistentAudioPlayerContext = createContext<PersistentAudioPlayerValue | null>(null);

/** ################################ COMPONENT ############################# */
export function PersistentAudioPlayerProvider({ children }: Readonly<{ children: ReactNode }>) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevIdRef = useRef<string | null>(null);
  const dismissedIdRef = useRef<string | null>(null);
  const prevPathnameRef = useRef<string | null>(null);
  const trackRef = useRef<PublicAudioTrackMeta | null>(null);
  const [track, setTrack] = useState<PublicAudioTrackMeta | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const pathname = usePathname();

  /** Re-allow `loadTrack` for an episode after navigation (same URL close should not instantly re-open the dock). */
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      dismissedIdRef.current = null;
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  const onAudioChrome = isPublicAudioChromePath(pathname);

  /** Pause when leaving the landing Audio tab shell (Video / AI / …). */
  useEffect(() => {
    if (onAudioChrome) return;
    const el = audioRef.current;
    if (el && !el.paused) {
      el.pause();
    }
    setIsPlaying(false);
  }, [onAudioChrome]);

  const loadTrack = useCallback((next: PublicAudioTrackMeta) => {
    if (dismissedIdRef.current === next.id) {
      return;
    }
    dismissedIdRef.current = null;
    const switched = prevIdRef.current !== next.id;
    if (switched) {
      prevIdRef.current = next.id;
      setIsPlaying(false);
      setCurrentTimeSec(0);
      setDurationSec(0);
    }
    setTrack(next);
  }, []);

  const closeAndStop = useCallback(() => {
    const id = trackRef.current?.id ?? null;
    if (id) {
      dismissedIdRef.current = id;
    }
    prevIdRef.current = null;
    setTrack(null);
    setIsPlaying(false);
    setCurrentTimeSec(0);
    setDurationSec(0);
    setShuffleEnabled(false);
    setRepeatMode("off");
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.removeAttribute("data-dl-mark");
      el.load();
    }
  }, []);

  trackRef.current = track;

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    const mark = `${track.id}|${track.src}`;
    if (el.getAttribute("data-dl-mark") === mark) return;
    el.pause();
    el.src = track.src;
    el.setAttribute("data-dl-mark", mark);
    el.load();
  }, [track]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = volume;
  }, [volume]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !track) return;

    const onTime = () => setCurrentTimeSec(el.currentTime);
    const onMeta = () => {
      if (Number.isFinite(el.duration) && el.duration > 0) {
        setDurationSec(el.duration);
      }
    };
    const onEnded = () => {
      if (repeatMode === "one" || repeatMode === "all") {
        el.currentTime = 0;
        void el.play().catch(() => setIsPlaying(false));
        return;
      }
      setIsPlaying(false);
      setCurrentTimeSec(0);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("durationchange", onMeta);
    el.addEventListener("ended", onEnded);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("durationchange", onMeta);
      el.removeEventListener("ended", onEnded);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
    };
  }, [track, repeatMode]);

  const togglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (el.paused) {
      void el.play().catch(() => setIsPlaying(false));
    } else {
      el.pause();
    }
  }, [track]);

  const seekTo = useCallback((sec: number) => {
    const el = audioRef.current;
    if (!el) return;
    const elDur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
    const meta = trackRef.current?.durationS;
    const metaDur = typeof meta === "number" && meta > 0 ? meta : 0;
    const stateDur = durationSec > 0 ? durationSec : 0;
    const d = elDur || stateDur || metaDur;
    const clamped = d > 0 ? Math.max(0, Math.min(sec, d)) : Math.max(0, sec);
    el.currentTime = clamped;
    setCurrentTimeSec(clamped);
  }, [durationSec]);

  const skipPrev = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (el.currentTime > 2.5) {
      el.currentTime = 0;
      setCurrentTimeSec(0);
      return;
    }
    el.currentTime = 0;
    setCurrentTimeSec(0);
  }, []);

  const skipNext = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const elDur = Number.isFinite(el.duration) && el.duration > 0 ? el.duration : 0;
    const meta = trackRef.current?.durationS;
    const metaDur = typeof meta === "number" && meta > 0 ? meta : 0;
    const stateDur = durationSec > 0 ? durationSec : 0;
    const d = elDur || stateDur || metaDur;
    if (d > 0) {
      el.currentTime = Math.max(0, d - 0.25);
      setCurrentTimeSec(el.currentTime);
    }
  }, [durationSec]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffleEnabled((s) => !s);
  }, []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const value = useMemo<PersistentAudioPlayerValue>(
    () => ({
      track,
      loadTrack,
      closeAndStop,
      isPlaying,
      togglePlay,
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
    }),
    [
      track,
      loadTrack,
      closeAndStop,
      isPlaying,
      togglePlay,
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
    ],
  );

  return (
    <PersistentAudioPlayerContext.Provider value={value}>
      <audio ref={audioRef} className="hidden" preload="metadata" playsInline />
      {children}
    </PersistentAudioPlayerContext.Provider>
  );
}

export function usePersistentAudioPlayer(): PersistentAudioPlayerValue {
  const ctx = useContext(PersistentAudioPlayerContext);
  if (!ctx) {
    throw new Error("usePersistentAudioPlayer must be used within PersistentAudioPlayerProvider");
  }
  return ctx;
}

export function usePersistentAudioPlayerOptional(): PersistentAudioPlayerValue | null {
  return useContext(PersistentAudioPlayerContext);
}
/** ################################ /COMPONENT ############################# */
