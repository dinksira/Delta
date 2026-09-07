/**
 * LiveHostStage — the main live-streaming canvas of a Live Duel room.
 * Renders the host's broadcast workspace with a HUD overlay: LIVE + viewer
 * pill and floating host profile card on top, an audio-reactive
 * `VoiceWaveIndicator` focal point (or the host's currently-posted question)
 * in the center, and the stage chat overlay + media control dock along the
 * bottom edge. The host's broadcast camera fills the stage as a full-bleed
 * background only when they are the current broadcaster (`isHost`) — for
 * everyone else their own camera lives in their on-stage participant card, so
 * the big stage canvas stays reserved for the competition host.
 *
 * @example
 * ```tsx
 * <LiveHostStage
 *   host={{ name: "Dr. Sarah Martinez", subtitle: "World Geography Challenge" }}
 *   viewerCount={1247}
 *   liveQuestion={question}
 *   chatMessages={chat}
 *   isMicMuted={false}
 *   isCameraOff={true}
 *   isHost
 *   mediaStream={hostMediaStream}
 * />
 * ```
 */

import type { LiveChatMessage, LiveQuestion } from "@/modules/Competition/types/liveDuel";
import { Clock, Radio, Trophy, Users, VideoOff } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar";
import { LiveBadge } from "@/components/atoms/LiveBadge";
import { RichText } from "@/components/atoms/RichText/RichText";
import { LiveVideoFeed } from "@/components/molecules/LiveVideoFeed";
import { MediaControlDock } from "@/components/molecules/MediaControlDock";
import { StageChatOverlay } from "@/components/molecules/StageChatOverlay";
import { VoiceWaveIndicator } from "@/components/molecules/VoiceWaveIndicator";
import { cn } from "@/lib/utils";

export interface LiveHostStageHost {
  name: string;
  avatarUrl?: string | null;
  /** Room subtitle shown under the host name on the profile card. */
  subtitle: string;
}

export interface LiveHostStageProps {
  host: LiveHostStageHost;
  viewerCount: number;
  /** The question the host has posted; null shows the idle ripple stage. */
  liveQuestion: LiveQuestion | null;
  chatMessages: LiveChatMessage[];
  isMicMuted: boolean;
  isCameraOff: boolean;
  /** True when the current user is the room host (broadcaster). */
  isHost?: boolean;
  /** Host broadcast camera stream — shown full-bleed only when `isHost`. */
  mediaStream?: MediaStream | null;
  /** Non-null when getUserMedia failed (permission denied, no device, etc.). */
  mediaError?: string | null;
  /** Voice-activity state for the host focal point ripple. */
  isSpeaking?: boolean;
  /** Normalized voice level 0–1 (scales the host focal ripple). */
  voiceLevel?: number;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onLeave?: () => void;
  className?: string;
}

function LiveQuestionCard({ question }: Readonly<{ question: LiveQuestion }>) {
  return (
    <div className="w-full max-w-xl rounded-2xl border border-border-default bg-surface-default p-5 shadow-lg">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Clock className="size-3.5" aria-hidden />
          Question {question.round} of {question.total}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-900/40 dark:text-warning-300">
          <Trophy className="size-3.5" aria-hidden />
          {question.points} pts
        </span>
      </div>
      <RichText html={question.text} className="text-base font-semibold leading-relaxed" />
      {question.timeLabel ? (
        <p className="mt-3 text-xs font-semibold tabular-nums text-text-secondary">
          Time left: <span className="text-error-600">{question.timeLabel}</span>
        </p>
      ) : null}
    </div>
  );
}

export function LiveHostStage({
  host,
  viewerCount,
  liveQuestion,
  chatMessages,
  isMicMuted,
  isCameraOff,
  isHost = false,
  mediaStream = null,
  mediaError = null,
  isSpeaking = false,
  voiceLevel = 0,
  onToggleMic,
  onToggleCamera,
  onLeave,
  className,
}: Readonly<LiveHostStageProps>) {
  const broadcasting = isHost && !isCameraOff && Boolean(mediaStream);

  return (
    <section
      aria-label="Live stage"
      className={cn(
        "relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl border border-border-default bg-surface-muted shadow-sm",
        className,
      )}
    >
      {/* Host camera background — full-bleed, only when the host broadcasts.
          Mirrored because this is the host's own self-view on their device */}
      {broadcasting ? <LiveVideoFeed mediaStream={mediaStream} mirror className="absolute inset-0 z-0 size-full" /> : null}

      {/* Gradient + glow overlays */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300",
          broadcasting ? "opacity-40" : "opacity-100",
        )}
      >
        <div className="absolute -left-20 -top-24 size-80 rounded-full bg-primary-200/60 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 size-80 rounded-full bg-primary-300/50 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <LiveBadge />
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-white">
            <Users className="size-3.5" aria-hidden />
            {viewerCount.toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-2.5 rounded-full bg-primary-900/60 py-1.5 pl-1.5 pr-4 text-white shadow-md backdrop-blur-sm">
          <Avatar name={host.name} src={host.avatarUrl} size="sm" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{host.name}</p>
            <p className="truncate text-[11px] text-white/80">{host.subtitle}</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8">
        {liveQuestion ? (
          <LiveQuestionCard question={liveQuestion} />
        ) : (
          <>
            <VoiceWaveIndicator active={isSpeaking} level={voiceLevel} size="lg" />
            <p className="flex items-center gap-2 text-xs font-semibold text-text-tertiary">
              <Radio className="size-3.5" aria-hidden />
              Waiting for the host to post the next question...
            </p>
          </>
        )}
      </div>

      {/* Media permission error banner */}
      {isHost && mediaError ? (
        <div className="relative z-10 mx-4 mb-3 flex items-center gap-2 rounded-lg border border-error-600/30 bg-error-600/10 px-3 py-2 text-xs font-semibold text-error-600">
          <VideoOff className="size-4 shrink-0" aria-hidden />
          <span>{mediaError}</span>
        </div>
      ) : null}

      <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 p-4">
        <StageChatOverlay messages={chatMessages} />
        <MediaControlDock
          isMicMuted={isMicMuted}
          isCameraOff={isCameraOff}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onLeave={onLeave}
        />
      </div>
    </section>
  );
}

export default LiveHostStage;