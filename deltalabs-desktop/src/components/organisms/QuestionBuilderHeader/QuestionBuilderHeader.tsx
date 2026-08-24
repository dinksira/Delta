/**
 * QuestionBuilderHeader
 * Atomic Level: Organism
 *
 * Top bar + question navigator for the custom-question builder sub-flow:
 * a "Back to pool" action, an "Editing Question X of Y · Z max questions"
 * context line, "New question" / "Done" actions, and a QuestionNavigator
 * pill strip that appears when 2+ questions exist.
 */

import { ArrowLeft, Plus } from "lucide-react";

import { QuestionNavigator } from "@/components/molecules/QuestionNavigator/QuestionNavigator";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface QuestionBuilderHeaderProps {
  /** Zero-based index of the active question. */
  currentIndex: number;
  total: number;
  maxQuestions: number;
  activeId: string;
  questions: readonly { id: string; title: string }[];
  onSelect: (id: string) => void;
  onAdd: () => void;
  onBack: () => void;
  onDone: () => void;
  className?: string;
}

export function QuestionBuilderHeader({
  currentIndex,
  total,
  maxQuestions,
  activeId,
  questions,
  onSelect,
  onAdd,
  onBack,
  onDone,
  className,
}: Readonly<QuestionBuilderHeaderProps>) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="size-4" aria-hidden />
            Back to pool
          </Button>
          <Typography className="min-w-0 truncate text-sm text-text-secondary">
            Editing Question {currentIndex + 1} of {total} · {maxQuestions} max questions
          </Typography>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onAdd}
            disabled={total >= maxQuestions}
          >
            <Plus className="size-4" aria-hidden />
            New question
          </Button>
          <Button size="sm" onClick={onDone}>
            Done
          </Button>
        </div>
      </div>

      {total > 1 ? (
        <QuestionNavigator
          questions={questions}
          activeId={activeId}
          maxQuestions={maxQuestions}
          onSelect={onSelect}
          onAdd={onAdd}
        />
      ) : null}
    </div>
  );
}

export default QuestionBuilderHeader;