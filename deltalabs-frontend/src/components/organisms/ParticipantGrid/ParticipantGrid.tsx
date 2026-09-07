/**
 * ParticipantGrid — responsive grid of Zoom-style on-stage participant tiles
 * for the Live Duel secondary content layer. Collapses from 4 columns
 * (desktop) to 2 on small screens. The current user's tile receives their live
 * camera stream (`userMediaStream`) + real voice level (`userVoiceLevel`);
 * every other tile's ripple follows the room's `speakingIds` simulation.
 *
 * @example
 * ```tsx
 * <ParticipantGrid
 *   participants={room.participants}
 *   userMediaStream={mediaStream}
 *   userVoiceLevel={voiceLevel}
 *   speakingIds={speakingIds}
 * />
 * ```
 */

import { Users } from "lucide-react";

import { ParticipantCard } from "@/components/molecules/ParticipantCard";
import type { LiveParticipant } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface ParticipantGridProps {
  participants: LiveParticipant[];
  /** Live camera stream for the current user's tile (self-view). */
  userMediaStream?: MediaStream | null;
  /** Real voice-activity state (with hold) for the current user's ripple. */
  userIsSpeaking?: boolean;
  /** Real voice level 0–1 for the current user's tile ripple. */
  userVoiceLevel?: number;
  /**
   * Remote camera streams keyed by participant id (WebRTC mesh) — each remote
   * tile renders its peer's live feed, unmuted so the remote audio is heard.
   */
  remoteStreams?: Readonly<Record<string, MediaStream>>;
  /** Participant ids whose tiles should show the speaking ripple. */
  speakingIds?: ReadonlySet<string>;
  className?: string;
}

export function ParticipantGrid({
  participants,
  userMediaStream = null,
  userIsSpeaking = false,
  userVoiceLevel = 0,
  remoteStreams,
  speakingIds,
  className,
}: Readonly<ParticipantGridProps>) {
  return (
    <section aria-label="Participants on stage" className={cn("", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">On Stage</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
          <Users className="size-3.5" aria-hidden />
          {participants.length} on stage
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {participants.map((participant) => (
          <ParticipantCard
            key={participant.id}
            participant={participant}
            mediaStream={
              participant.isYou
                ? userMediaStream
                : (remoteStreams?.[participant.id] ?? null)
            }
            mediaMuted={participant.isYou}
            voiceLevel={participant.isYou ? userVoiceLevel : 0}
            isSpeaking={
              participant.isYou
                ? userIsSpeaking
                : speakingIds?.has(participant.id) ?? false
            }
          />
        ))}
      </div>
    </section>
  );
}

export default ParticipantGrid;
