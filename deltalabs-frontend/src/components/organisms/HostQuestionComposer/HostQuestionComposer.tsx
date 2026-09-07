/**
 * HostQuestionComposer — the host's real-time question tool, powered by the same
 * Question Builder the Topic Battle and Championship create flows use. The host
 * authors a full question of any kind (Multiple Choice, True / False,
 * Fill-in-the-Blanks, Matching, Writing, Ordering, Coding, Markdown, Design)
 * on the actual builder canvases (`QuestionAuthoringEditor`, `CodeEditorModule`,
 * `MarkdownPadModule`, `DesignCanvasModule`), then posts it live with a point
 * stake and countdown label as a `LiveQuestion`.
 *
 * The composer keeps a single working `CodingQuestion` draft per round (the
 * "next question to go on air"), so the workspace surface shown here is the
 * same one used during battle creation — not a simplified textarea.
 *
 * @example
 * ```tsx
 * <HostQuestionComposer
 *   round={1}
 *   onPost={(question) => postLiveQuestion(question)}
 * />
 * ```
 */

"use client";

import { useState } from "react";

import { Palette, Radio, ScrollText } from "lucide-react";

import { QuestionAuthoringEditor } from "@/components/organisms/QuestionAuthoringEditor";
import { QuestionTypeMenu } from "@/components/organisms/QuestionTypeMenu";
import { CodeEditorModule } from "@/components/organisms/CodeEditorModule";
import { MarkdownPadModule } from "@/components/organisms/MarkdownPadModule";
import { DesignCanvasModule } from "@/components/organisms/DesignCanvasModule";
import { Button } from "@/components/theme/Button";
import { Select } from "@/components/theme/Select";
import type { LiveQuestion } from "@/modules/Competition/types/liveDuel";
import { createEmptyQuestion, type CodingQuestion, type QuestionKind } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

// ===== CONSTANTS =====

/** Quick point values surfaced as chips (points are the question stake). */
export const LIVE_DUEL_POINT_OPTIONS = [100, 250, 500, 1000] as const;
export const LIVE_DUEL_TIMER_OPTIONS = ["0:15", "0:20", "0:30", "0:45", "1:00"] as const;

/** Kind → label map (mirrors the create-flow builder's helper, kept local so
 *  the library stays decoupled from the module views). */
const QUESTION_KIND_LABELS: Record<QuestionKind, string> = {
  coding: "Coding",
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill-in-the-Blanks",
  matching: "Matching",
  writing: "Writing / Essay",
  ordering: "Ordering / Sequencing",
  markdown: "Markdown",
  design: "Design Challenge",
};

/** Label → kind map for the `QuestionTypeMenu` dropdown selection. */
const QUESTION_TYPE_KINDS: Record<string, QuestionKind> = {
  Coding: "coding",
  "Multiple Choice": "multiple_choice",
  "True / False": "true_false",
  "Fill-in-the-Blanks": "fill_blank",
  Matching: "matching",
  "Writing / Essay": "writing",
  "Ordering / Sequencing": "ordering",
};

/** Languages passed to the Code Editor canvas (same list as battle creation). */
export const LIVE_DUEL_QUESTION_LANGUAGES = [
  "HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "C++",
  "C#", "Go", "Rust", "SQL", "PHP",
];

// ===== HELPERS =====

/** Most descriptive on-air text available for a draft. */
function questionText(question: CodingQuestion): string {
  return question.description.trim() || question.title.trim();
}

// ===== COMPONENT =====

export interface HostQuestionComposerProps {
  /** Next round number (1-based); rendered in the submit label. */
  round: number;
  onPost: (question: LiveQuestion) => void;
  className?: string;
}

export function HostQuestionComposer({
  round,
  onPost,
  className,
}: Readonly<HostQuestionComposerProps>) {
  const [draft, setDraft] = useState<CodingQuestion>(() => createEmptyQuestion());
  const [timeLabel, setTimeLabel] = useState<string>(LIVE_DUEL_TIMER_OPTIONS[2]);

  const text = questionText(draft);
  const canPost = text.length > 0;

  const updateDraft = (updates: Partial<CodingQuestion>) => {
    setDraft((current) => ({ ...current, ...updates }));
  };

  const resetDraft = () => {
    setDraft(createEmptyQuestion({ kind: draft.kind === "coding" ? undefined : draft.kind }));
    setTimeLabel(LIVE_DUEL_TIMER_OPTIONS[2]);
  };

  const handlePost = () => {
    if (!canPost) {
      return;
    }
    onPost({
      id: crypto.randomUUID(),
      round,
      total: Math.max(round, 1),
      text,
      points: draft.points,
      timeLabel,
      question: draft,
    });
    resetDraft();
  };

  const handleSelectType = (label: string) => {
    updateDraft({ kind: QUESTION_TYPE_KINDS[label] ?? draft.kind });
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-text-primary">
          Round {round} · Next Question
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <QuestionTypeMenu
            value={QUESTION_KIND_LABELS[draft.kind]}
            onSelect={handleSelectType}
          />
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={draft.kind === "markdown" ? "primary" : "secondary"}
              onClick={() => updateDraft({ kind: "markdown" })}
              aria-pressed={draft.kind === "markdown"}
            >
              <ScrollText className="size-3.5" aria-hidden />
              Markdown
            </Button>
            <Button
              type="button"
              size="sm"
              variant={draft.kind === "design" ? "primary" : "secondary"}
              onClick={() => updateDraft({ kind: "design" })}
              aria-pressed={draft.kind === "design"}
            >
              <Palette className="size-3.5" aria-hidden />
              Design Canvas
            </Button>
          </div>
        </div>
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border-default bg-surface-secondary"
        data-kind={draft.kind}
        aria-label="Live question builder"
      >
        {draft.kind === "coding" ? (
          <CodeEditorModule
            question={draft}
            onChange={updateDraft}
            onRemove={resetDraft}
            languages={LIVE_DUEL_QUESTION_LANGUAGES}
          />
        ) : draft.kind === "markdown" ? (
          <MarkdownPadModule question={draft} onChange={updateDraft} onRemove={resetDraft} />
        ) : draft.kind === "design" ? (
          <DesignCanvasModule question={draft} onChange={updateDraft} onRemove={resetDraft} />
        ) : (
          <QuestionAuthoringEditor question={draft} onChange={updateDraft} onRemove={resetDraft} />
        )}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-secondary">Points</span>
          <div className="flex flex-wrap gap-1.5">
            {LIVE_DUEL_POINT_OPTIONS.map((option) => (
              <Button
                key={option}
                type="button"
                variant={draft.points === option ? "primary" : "secondary"}
                size="sm"
                onClick={() => updateDraft({ points: option })}
                aria-pressed={draft.points === option}
              >
                {option.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="host-question-timer"
            className="text-xs font-medium text-text-secondary"
          >
            Timer
          </label>
          <Select
            id="host-question-timer"
            className="w-24"
            value={timeLabel}
            onChange={(event) => setTimeLabel(event.target.value)}
          >
            {LIVE_DUEL_TIMER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <Button type="button" variant="primary" onClick={handlePost} disabled={!canPost}>
          <Radio className="size-4" aria-hidden />
          Post Round {round}
        </Button>
      </div>
    </div>
  );
}

export default HostQuestionComposer;