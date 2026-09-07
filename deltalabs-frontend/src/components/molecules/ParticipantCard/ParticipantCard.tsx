/**
 * ParticipantCard — one on-stage participant in the Live Duel secondary grid,
 * styled like a Google Meet / Zoom speaking tile: a rectangular video tile that
 * fills the whole card. When the participant's live camera stream is supplied
 * and the camera is on (only the current user's own device stream exists), the
 * tile shows the mirrored self-view full-bleed; otherwise it shows a monogram
 * avatar on a subtle surface. The name sits in a scrim at the bottom, with a
 * host crown top-left and a hardware status icon top-right. A circular "ocean
 * ripple" `VoiceWaveIndicator` overlays the tile and pulses proportionally to
 * the speaker's actual voice `level`.
 *
 * @example
 * ```tsx
 * <ParticipantCard
 *   participant={{ id: "you", name: "You", isYou: true }}
 *   mediaStream={userStream}
 *   isSpeaking={userSpeaking}
 *   voiceLevel={voiceLevel}
 * />
 * ```
 */

import { Crown, MicOff, VideoOff } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar";
import { LiveVideoFeed } from "@/components/molecules/LiveVideoFeed";
import { VoiceWaveIndicator } from "@/components/molecules/VoiceWaveIndicator";
import type { LiveParticipant } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface ParticipantCardProps {
  participant: LiveParticipant;
  /** Live camera stream for the current user's tile (their card only). */
  mediaStream?: MediaStream | null;
  /** Voice-activity state for this card (drives the ocean ripple). */
  isSpeaking?: boolean;
  /** Normalized voice level 0–1 (scales the ripple size/intensity). */
  voiceLevel?: number;
  className?: string;
}

export function ParticipantCard({
  participant,
  mediaStream = null,
  isSpeaking = false,
  voiceLevel = 0,
  className,
}: Readonly<ParticipantCardProps>) {
  const { name, avatarUrl, isHost, isYou, micMuted, cameraOff } = participant;
  const cameraOn = Boolean(mediaStream) && !cameraOff;

  return (
    <div
      className={cn(
        "relative aspect-[16/10] overflow-hidden rounded-2xl border border-border-default bg-surface-muted shadow-sm",
        cameraOn && "border-primary-400/60",
        isYou && !cameraOn && "border-primary-400 bg-primary-50/60 dark:bg-primary-900/20",
        className,
      )}
    >
      {/* Full-bleed video tile or monogram avatar */}
      {cameraOn ? (
        <LiveVideoFeed mediaStream={mediaStream} mirror className="absolute inset-0 size-full" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-surface-muted">
          <Avatar
            name={name}
            src={avatarUrl}
            size="lg"
            className="ring-primary-100 dark:ring-primary-900/60"
          />
        </div>
      )}

      {/* Zoom-style ocean ripple overlay — pinned to the right edge so it never
          sits over the participant's face in the centered camera feed */}
      <VoiceWaveIndicator
        active={isSpeaking}
        level={voiceLevel}
        size="sm"
        className="absolute right-3 top-1/2 -translate-y-1/2 drop-shadow-sm"
      />

      {/* Bottom scrim + name label */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 px-3 pb-2">
        <p className="truncate text-sm font-semibold leading-tight text-white">
          {isYou ? `${name} (You)` : name}
        </p>
      </div>

      {/* Host crown */}
      {isHost ? (
        <span
          title="Host"
          className="absolute left-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-primary-600 text-white"
          aria-label="Host"
        >
          <Crown className="size-3.5" aria-hidden />
        </span>
      ) : null}

      {/* Hardware status icon */}
      <span
        title={cameraOff ? "Camera off" : micMuted ? "Mic muted" : "Ready"}
        className="absolute right-3 top-3 z-10 flex size-6 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
        aria-label={cameraOff ? "Camera off" : micMuted ? "Mic muted" : "Ready"}
      >
        {cameraOff ? (
          <VideoOff className="size-3.5" aria-hidden />
        ) : micMuted ? (
          <MicOff className="size-3.5" aria-hidden />
        ) : (
          <span className="size-2 rounded-full bg-success-400" aria-hidden />
        )}
      </span>
    </div>
  );
}

export default ParticipantCard;
