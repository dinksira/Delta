/**
 * LiveHostStage — the main live-streaming canvas of a Live Duel room.
 * Renders the host's broadcast workspace with a HUD overlay: LIVE + viewer
 * pill and floating host profile card on top, an audio-ripple focal point (or
 * the host's currently-posted question) in the center, and the stage chat
 * overlay + media control dock along the bottom edge.
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
 * />
 * ```
 */

import type { LiveChatMessage, LiveQuestion } from "@/modules/Competition/types/liveDuel";
import { Clock, Mic, Radio, Trophy, Users } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar";
import { LiveBadge } from "@/components/atoms/LiveBadge";
import { MediaControlDock } from "@/components/molecules/MediaControlDock";
import { StageChatOverlay } from "@/components/molecules/StageChatOverlay";
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
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onLeave?: () => void;
  className?: string;
}

function RippleFocal() {
  return (
    <div className="relative flex size-52 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 animate-ping rounded-full bg-primary-300/40" />
      <span className="absolute inset-0 rounded-full bg-primary-300/40" />
      <span className="absolute inset-6 rounded-full bg-primary-400/40" />
      <span className="absolute inset-12 rounded-full bg-primary-600/30" />
      <span className="flex size-16 items-center justify-center rounded-full bg-primary-700 text-white shadow-inner">
        <Mic className="size-7" />
      </span>
    </div>
  );
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
      <p className="text-base font-semibold leading-relaxed text-text-primary">{question.text}</p>
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
  onToggleMic,
  onToggleCamera,
  onLeave,
  className,
}: Readonly<LiveHostStageProps>) {
  return (
    <section
      aria-label="Live stage"
      className={cn(
        "relative flex min-h-[440px] flex-col justify-between overflow-hidden rounded-2xl border border-border-default bg-surface-muted shadow-sm",
        className,
      )}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
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
            <RippleFocal />
            <p className="flex items-center gap-2 text-xs font-semibold text-text-tertiary">
              <Radio className="size-3.5" aria-hidden />
              Waiting for the host to post the next question...
            </p>
          </>
        )}
      </div>

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