/**
 * HostControlPanel — the host's live room dashboard card. Shows a LIVE badge,
 * live viewers, the question currently on air, a `HostQuestionComposer` to post
 * the next round, and the rolling history of posted questions (newest first)
 * with an "On air" marker on the active one.
 *
 * @example
 * ```tsx
 * <HostControlPanel
 *   viewers={room.viewers}
 *   liveQuestion={room.liveQuestion}
 *   postedQuestions={room.postedQuestions}
 *   onPostQuestion={postLiveQuestion}
 * />
 * ```
 */

"use client";

import { Eye } from "lucide-react";

import { LiveBadge } from "@/components/atoms/LiveBadge";
import { RichText } from "@/components/atoms/RichText/RichText";
import { HostQuestionComposer } from "@/components/organisms/HostQuestionComposer";
import type { LiveQuestion } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

// ===== COMPONENT =====

export interface HostControlPanelProps {
  viewers: number;
  liveQuestion: LiveQuestion | null;
  /** Host-posted questions, newest first. */
  postedQuestions: LiveQuestion[];
  onPostQuestion: (question: LiveQuestion) => void;
  className?: string;
}

export function HostControlPanel({
  viewers,
  liveQuestion,
  postedQuestions,
  onPostQuestion,
  className,
}: Readonly<HostControlPanelProps>) {
  const nextRound = postedQuestions.length + 1;

  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-default p-4",
        className,
      )}
      aria-label="Host control"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <LiveBadge />
          <h3 className="text-base font-bold text-text-primary">Host Control</h3>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-semibold tabular-nums text-text-primary">
          <Eye className="size-3.5 text-text-tertiary" aria-hidden />
          {viewers.toLocaleString()} watching
        </span>
      </div>

      {liveQuestion ? (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 dark:border-primary-800/60 dark:bg-primary-900/30">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
            On air · Round {liveQuestion.round}
          </p>
          <RichText html={liveQuestion.text} className="mt-0.5 text-sm font-medium" />
          <p className="mt-0.5 text-xs tabular-nums text-text-secondary">
            {liveQuestion.points.toLocaleString()} pts · {liveQuestion.timeLabel}
          </p>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-border-default px-3 py-2 text-sm text-text-secondary">
          Nothing on air yet — post the first question below.
        </p>
      )}

      <HostQuestionComposer round={nextRound} onPost={onPostQuestion} />

      {postedQuestions.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
            Posted · {postedQuestions.length}
          </p>
          <ul className="flex max-h-40 flex-col gap-1.5 overflow-y-auto pr-1">
            {postedQuestions.map((question) => {
              const isOnAir = liveQuestion?.id === question.id;
              return (
                <li
                  key={question.id}
                  className={cn(
                    "flex items-start justify-between gap-3 rounded-lg border bg-surface-muted px-3 py-2",
                    isOnAir ? "border-primary-300" : "border-border-default",
                  )}
                >
                  <div className="min-w-0">
                    <RichText
                      html={question.text}
                      className="truncate text-sm font-medium"
                    />
                    <p className="text-xs tabular-nums text-text-secondary">
                      R{question.round} · {question.points.toLocaleString()} pts ·{" "}
                      {question.timeLabel}
                    </p>
                  </div>
                  {isOnAir ? (
                    <span className="shrink-0 rounded-full bg-primary-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      On air
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export default HostControlPanel;