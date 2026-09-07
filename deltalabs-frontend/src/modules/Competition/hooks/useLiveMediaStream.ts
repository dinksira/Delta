/**
 * useLiveMediaStream
 * Acquires the local camera + microphone via `getUserMedia` when the user
 * toggles the camera ON, flips the audio track `enabled` flag when the mic is
 * toggled, and analyzes the live mic input with the Web Audio API.
 *
 * Exposes the raw `mediaStream` so *any* number of `<video>` tiles can attach
 * the same up-to-date stream independently (self-view rectangle, host stage,
 * etc.) via `LiveVideoFeed` — one stream is safe to share across elements. Also
 * exposes a normalized `voiceLevel` (0–1, power-scaled) so callers can drive a
 * Zoom-style circular ocean-wave indicator proportional to the speaker's
 * actual volume, plus a boolean `isSpeaking` for gating that wave on/off.
 *
 * Stops all tracks on unmount or when the camera is toggled OFF so the browser
 * re-releases the hardware.
 *
 * @example
 * ```tsx
 * const { mediaStream, voiceLevel, isSpeaking } = useLiveMediaStream();
 * <LiveVideoFeed mediaStream={mediaStream} mirror />
 * <VoiceWaveIndicator level={voiceLevel} active={isSpeaking} />
 * ```
 */

"use client";

import { useEffect, useRef, useState } from "react";

import { useLiveDuel } from "@/modules/Competition/hooks";

const VOICE_LEVEL_THRESHOLD = 0.025;
const VOICE_HOLD_MS = 180;
/** Power curve exponent compresses the raw RMS into a pleasant 0–1 range. */
const VOICE_LEVEL_CURVE = 0.6;

type AudioContextLike = typeof AudioContext;

export interface UseLiveMediaStreamResult {
  /** The live camera+mic stream; attach to any number of `<video>` tiles. */
  mediaStream: MediaStream | null;
  /** Non-null when getUserMedia failed (permission denied, no device, etc.). */
  error: string | null;
  /** True while the mic input level is above the activity threshold. */
  isSpeaking: boolean;
  /** Normalized voice level 0–1 (power-scaled RMS) driving the wave indicator. */
  voiceLevel: number;
}

function resolveAudioContext(): AudioContextLike | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }
  return (
    window.AudioContext ??
    (window as { webkitAudioContext?: AudioContextLike }).webkitAudioContext ??
    undefined
  );
}

export function useLiveMediaStream(): UseLiveMediaStreamResult {
  const { state } = useLiveDuel();
  const activeRef = useRef(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);

  // Acquire / release camera + mic
  useEffect(() => {
    const wantActive = !state.isCameraOff;

    if (wantActive && !activeRef.current) {
      let cancelled = false;
      setError(null);

      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((acquired) => {
          if (cancelled) {
            acquired.getTracks().forEach((t) => t.stop());
            return;
          }
          activeRef.current = true;
          setStream(acquired);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const message =
            err instanceof DOMException && err.name === "NotAllowedError"
              ? "Camera/microphone access denied."
              : "Could not access camera or microphone.";
          setError(message);
        });

      return () => {
        cancelled = true;
      };
    }

    if (!wantActive && activeRef.current) {
      activeRef.current = false;
      setStream(null);
      setError(null);
    }

    return undefined;
  }, [state.isCameraOff]);

  // Toggle audio track enabled state
  useEffect(() => {
    const audioTracks = stream?.getAudioTracks() ?? [];
    for (const track of audioTracks) {
      track.enabled = !state.isMicMuted;
    }
    if (state.isMicMuted) {
      setIsSpeaking(false);
      setVoiceLevel(0);
    }
  }, [stream, state.isMicMuted]);

  // Voice-activity detection via Web Audio analyser on the mic input
  useEffect(() => {
    const AudioCtx = resolveAudioContext();
    if (!AudioCtx || !stream) {
      setIsSpeaking(false);
      setVoiceLevel(0);
      return undefined;
    }

    let rafId = 0;
    let silencedAt = 0;
    const analyzerFftSize = 1024;
    const samples = new Uint8Array(analyzerFftSize);
    const ctx = new AudioCtx();
    void ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = analyzerFftSize;
    analyser.smoothingTimeConstant = 0.55;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    const readLevel = () => {
      analyser.getByteTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) {
        const offset = samples[i] - 128;
        sum += offset * offset;
      }
      const rms = Math.sqrt(sum / samples.length) / 128;
      setVoiceLevel(Math.min(1, Math.pow(rms * 1.6, VOICE_LEVEL_CURVE)));
      if (rms > VOICE_LEVEL_THRESHOLD) {
        silencedAt = 0;
        setIsSpeaking(true);
      } else if (silencedAt === 0) {
        silencedAt = performance.now();
      } else if (performance.now() - silencedAt > VOICE_HOLD_MS) {
        setIsSpeaking(false);
        silencedAt = 0;
      }
      rafId = requestAnimationFrame(readLevel);
    };
    rafId = requestAnimationFrame(readLevel);

    return () => {
      cancelAnimationFrame(rafId);
      source.disconnect();
      void ctx.close();
      setIsSpeaking(false);
      setVoiceLevel(0);
    };
  }, [stream]);

  // Cleanup on unmount (also stops tracks so the hardware is released)
  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      activeRef.current = false;
      setIsSpeaking(false);
      setVoiceLevel(0);
    };
  }, [stream]);

  return { mediaStream: stream, error, isSpeaking, voiceLevel };
}

export default useLiveMediaStream;