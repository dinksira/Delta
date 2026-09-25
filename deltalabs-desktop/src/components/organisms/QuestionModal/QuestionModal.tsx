/**
 * QuestionModal — display of a question the host has just posted live in a
 * Live Duel room. Opens the moment a round is posted so the room sees the
 * real, full question for every one of the nine kinds (Multiple Choice, True /
 * False, Fill-in-the-Blanks, Matching, Writing, Ordering, Coding, Markdown,
 * Design) instead of only the flat one-line `text` fallback.
 *
 * Hosts see the authored structure read-only per kind (`RichText` / `Markdown`
 * atoms, correct answers intentionally NOT revealed during the live round).
 * Participants in a real backend room switch to `interactive` mode: the shared
 * `QuizAnswerForm` renders the answering surface and, once the backend grades
 * the submission, the result banner and per-option highlight are revealed.
 *
 * Host-posted questions carry the full payload on `LiveQuestion.question`;
 * reduced payloads (backend WS echo / demo deck) fall back to the flat text.
 *
 * @example
 * ```tsx
 * <QuestionModal
 *   open={Boolean(activeQuestion)}
 *   question={activeQuestion}
 *   onClose={() => setActiveQuestion(null)}
 * />
 * ```
 */

"use client";

import { Check, Clock, HelpCircle, Loader2, Trophy, X } from "lucide-react";

import { Markdown } from "@/components/atoms/Markdown/Markdown";
import { RichText } from "@/components/atoms/RichText/RichText";
import { QuizAnswerForm } from "@/components/organisms/QuizAnswerForm/QuizAnswerForm";
import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";
import { toDuelQuestion } from "@/modules/Competition/data";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type { ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";
import type { LiveQuestion, LiveSubmittedAnswer } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

// ===== CONSTANTS =====

const KIND_LABELS: Record<CodingQuestion["kind"], string> = {
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

function letterFor(index: number): string {
  return String.fromCharCode(65 + index);
}

// ===== READ-ONLY PER-KIND VIEWS =====

function Stem({ question }: Readonly<{ question: CodingQuestion }>) {
  if (!question.description.trim()) {
    return null;
  }
  return (
    <RichText
      html={question.description}
      className="text-base leading-relaxed text-text-primary"
    />
  );
}

function MultipleChoiceView({ question }: Readonly<{ question: CodingQuestion }>) {
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Options">
      {question.mcqOptions.map((option, index) => (
        <div
          key={option.id}
          role="listitem"
          className="flex items-start gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
            {letterFor(index)}
          </span>
          <span className="min-w-0 text-sm font-medium text-text-primary">
            {option.text || "—"}
          </span>
        </div>
      ))}
    </div>
  );
}

function TrueFalseView() {
  const rows = ["True", "False"];
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Options">
      {rows.map((label) => (
        <div
          key={label}
          role="listitem"
          className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
        >
          <span
            aria-hidden
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white"
          >
            {label.charAt(0)}
          </span>
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
      ))}
    </div>
  );
}

function FillBlankView({ question }: Readonly<{ question: CodingQuestion }>) {
  return (
    <div className="flex flex-col gap-2">
      <RichText
        html={question.description}
        className="text-base leading-relaxed text-text-primary"
      />
    </div>
  );
}

function MatchingView({ question }: Readonly<{ question: CodingQuestion }>) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Column A · Match these
        </p>
        {question.matchingPairs.map((pair, index) => (
          <div
            key={pair.id}
            className="rounded-lg border border-border-default bg-surface-default px-3 py-2 text-sm font-medium text-text-primary"
          >
            {index + 1}. {pair.prompt || "—"}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Column B · Answer options
        </p>
        {question.matchingAnswers.map((answer, index) => (
          <div
            key={answer.id}
            className="rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-sm font-medium text-text-primary"
          >
            {letterFor(index)}. {answer.text || "—"}
          </div>
        ))}
      </div>
    </div>
  );
}

function OrderingView({ question }: Readonly<{ question: CodingQuestion }>) {
  return (
    <div className="flex flex-col gap-2" role="list" aria-label="Ordering items">
      {question.orderingItems.map((item, index) => (
        <div
          key={item.id}
          role="listitem"
          className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
            {index + 1}
          </span>
          <span className="min-w-0 text-sm font-medium text-text-primary">{item.text || "—"}</span>
        </div>
      ))}
    </div>
  );
}

function WritingView({ question }: Readonly<{ question: CodingQuestion }>) {
  return (
    <RichText
      html={question.description}
      className="text-base leading-relaxed text-text-primary"
    />
  );
}

function CodingView({ question }: Readonly<{ question: CodingQuestion }>) {
  const hasSampleCases = question.testCases.some((tc) => tc.isSample !== false);
  const sampleCases = question.testCases.filter(
    (tc) => tc.isSample !== false && (tc.input || tc.expectedOutput),
  );
  const showCases = hasSampleCases ? sampleCases : [];

  return (
    <div className="flex flex-col gap-4">
      {question.description.trim() || question.title.trim() ? (
        <RichText
          html={question.description.trim() ? question.description : question.title}
          className="text-base leading-relaxed text-text-primary"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {question.language}
        </span>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
            question.difficulty === "EASY" && "bg-success-50 text-success-700",
            question.difficulty === "MEDIUM" && "bg-warning-50 text-warning-700",
            question.difficulty === "HARD" && "bg-error-50 text-error-700",
          )}
        >
          {question.difficulty}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          {question.timeLimitMinutes} min
        </span>
      </div>

      {question.constraints.trim() ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Constraints
          </p>
          <div className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2">
            <RichText html={question.constraints} className="text-sm" />
          </div>
        </div>
      ) : null}

      {showCases.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Example test cases
          </p>
          <ul className="flex flex-col gap-2">
            {showCases.map((tc, index) => (
              <li
                key={`${tc.input}-${index}`}
                className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2 font-mono text-xs"
              >
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  <div>
                    <span className="text-text-tertiary">Input: </span>
                    <span className="whitespace-pre-wrap text-text-primary">
                      {tc.input || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Expected: </span>
                    <span className="whitespace-pre-wrap text-text-primary">
                      {tc.expectedOutput || "—"}
                    </span>
                  </div>
                </div>
                {tc.explanation && (
                  <div className="mt-1 text-text-tertiary">
                    <span>Explanation: </span>
                    <span className="text-text-primary">{tc.explanation}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {question.codeTemplate.trim() ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Starter code
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg border border-border-default bg-surface-muted px-3 py-2 font-mono text-xs text-text-primary">
            {question.codeTemplate}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

function MarkdownView({ question }: Readonly<{ question: CodingQuestion }>) {
  return <Markdown source={question.markdown.source} className="text-base" />;
}

function DesignView({ question }: Readonly<{ question: CodingQuestion }>) {
  const hasCover =
    question.design.cover && question.design.cover.url && !question.design.cover.url.startsWith("media://");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
          Design brief
        </p>
        <div className="rounded-lg border border-border-default bg-surface-muted/40 px-3 py-2">
          <RichText html={question.design.brief || "No brief provided."} className="text-sm" />
        </div>
      </div>

      {question.design.deliverables.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Deliverables
          </p>
          <ul className="ml-4 list-disc space-y-0.5 text-sm text-text-primary">
            {question.design.deliverables.map((deliverable, index) => (
              <li key={`${deliverable}-${index}`}>{deliverable}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        Canvas size · {question.design.canvasWidth} × {question.design.canvasHeight} px
      </span>

      {hasCover ? (
        // eslint-disable-next-line @next/next/no-img-element -- resolved media API asset
        <img
          src={question.design.cover?.url}
          alt="Design reference"
          className="max-h-52 w-full rounded-lg border border-border-default object-cover"
        />
      ) : null}
    </div>
  );
}

function QuestionBody({ payload }: Readonly<{ payload: CodingQuestion }>) {
  const kind = payload.kind;
  return (
    <div className="flex flex-col gap-4">
      {kind !== "writing" && (<Stem question={payload} />)}
      {kind === "multiple_choice" && <MultipleChoiceView question={payload} />}
      {kind === "true_false" && <TrueFalseView />}
      {kind === "fill_blank" && <FillBlankView question={payload} />}
      {kind === "matching" && <MatchingView question={payload} />}
      {kind === "ordering" && <OrderingView question={payload} />}
      {kind === "writing" && <WritingView question={payload} />}
      {kind === "coding" && <CodingView question={payload} />}
      {kind === "markdown" && <MarkdownView question={payload} />}
      {kind === "design" && <DesignView question={payload} />}
    </div>
  );
}

// ===== INTERACTIVE PARTICIPANT ANSWER SURFACE =====

function AnswerResultBanner({ result }: Readonly<{ result: LiveSubmittedAnswer }>) {
  const isCorrect = result.correct === true;
  const isIncorrect = result.correct === false;
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium",
        isCorrect && "border-success-500 bg-success-50 text-success-700",
        isIncorrect && "border-error-500 bg-error-50 text-error-700",
        !isCorrect && !isIncorrect && "border-border-default bg-surface-muted text-text-secondary",
      )}
    >
      {isCorrect ? (
        <Check className="size-4" aria-hidden />
      ) : isIncorrect ? (
        <X className="size-4" aria-hidden />
      ) : (
        <HelpCircle className="size-4" aria-hidden />
      )}
      <span>
        {isCorrect
          ? `Correct — +${result.earnedPoints.toLocaleString()} pts`
          : isIncorrect
            ? "Incorrect"
            : "Submitted for review"}
      </span>
    </div>
  );
}

function InteractiveAnswerBody({
  payload,
  result,
  submitting,
  submitError,
  onSubmit,
}: Readonly<{
  payload: CodingQuestion;
  result: LiveSubmittedAnswer | null;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (answer: ParticipantAnswer) => void;
}>) {
  const duelQuestion = toDuelQuestion(payload);
  if (!duelQuestion) {
    return null;
  }
  return (
    <div className="flex flex-col gap-4">
      {payload.kind === "markdown" ? (
        <MarkdownView question={payload} />
      ) : payload.kind !== "design" ? (
        <Stem question={payload} />
      ) : null}
      {submitting && !result ? (
        <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-muted px-4 py-3 text-sm font-medium text-text-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Submitting answer…
        </div>
      ) : null}
      {result ? <AnswerResultBanner result={result} /> : null}
      {submitError ? (
        <p className="text-sm font-medium text-error-600">{submitError}</p>
      ) : null}
      <QuizAnswerForm
        key={duelQuestion.id}
        question={duelQuestion}
        revealed={Boolean(result)}
        answer={result?.answer ?? null}
        onSubmit={onSubmit}
      />
    </div>
  );
}

// ===== MODAL =====

export interface QuestionModalProps {
  open: boolean;
  /** The posted live question to display; null renders nothing. */
  question: LiveQuestion | null;
  onClose: () => void;
  /**
   * Participant answering mode. When true (real backend room, non-host) the
   * stem renders with the interactive duel-quiz answer surface instead of the
   * read-only view, and the correct answer is revealed only once the backend
   * grades the participant's submission (`result`).
   */
  interactive?: boolean;
  /** Locked-in answer/grade for the current question (reveals on reopen). */
  result?: LiveSubmittedAnswer | null;
  /** True while the answer request is in flight (disables the close affordance). */
  submitting?: boolean;
  submitError?: string | null;
  onSubmitAnswer?: (answer: ParticipantAnswer) => void;
  className?: string;
}

export function QuestionModal({
  open,
  question,
  onClose,
  interactive = false,
  result = null,
  submitting = false,
  submitError = null,
  onSubmitAnswer,
  className,
}: Readonly<QuestionModalProps>) {
  if (!question) {
    return null;
  }

  const payload = question.question;
  const kind = payload ? KIND_LABELS[payload.kind] : null;

  return (
    <Dialog
      isOpen={open}
      onClose={onClose}
      size="2xl"
      className={className}
      title={
        <span className="flex flex-wrap items-center gap-2">
          <HelpCircle className="size-5 text-primary-600" aria-hidden />
          <span>Question {question.round} of {question.total}</span>
          {kind ? (
            <span className="rounded-full border border-border-default bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
              {kind}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-warning-700 dark:bg-warning-900/40 dark:text-warning-300">
            <Trophy className="size-3.5" aria-hidden />
            {question.points.toLocaleString()} pts
          </span>
          {question.timeLabel ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold tabular-nums text-text-secondary">
              <Clock className="size-3.5" aria-hidden />
              {question.timeLabel}
            </span>
          ) : null}
        </span>
      }
    >
      <div className="flex max-h-[70vh] flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {payload ? (
            interactive ? (
              <InteractiveAnswerBody
                payload={payload}
                result={result}
                submitting={submitting}
                submitError={submitError}
                onSubmit={onSubmitAnswer ?? (() => {})}
              />
            ) : (
              <QuestionBody payload={payload} />
            )
          ) : (
            <RichText html={question.text} className="text-base leading-relaxed" />
          )}
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
          <Button variant="primary" size="lg" onClick={onClose} disabled={submitting}>
            Got it
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default QuestionModal;