/**
 * QuestionPreviewPanel
 * Atomic Level: Organism
 *
 * Auto-generation preview shown on the question pool step when Auto-Generated
 * is selected. Left column renders the difficulty distribution bars; right
 * column shows the topic focus with sample category pills and a selection
 * summary ("N questions will be selected").
 */

import { Brain } from "lucide-react";

import { cn } from "@/lib/utils";
import { DistributionBar } from "@/components/molecules/DistributionBar/DistributionBar";

export interface QuestionPreviewPanelProps {
  /** Topic focus label shown in the right column, e.g. "Science". */
  topicCategory: string;
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  /** Sample category pills rendered under "Sample question categories:". */
  sampleCategories: string[];
  /** Index of the pill rendered as the dark "active" pill (others are orange). */
  activeCategoryIndex?: number;
  /** Mock stats for the selection summary. */
  selectedQuestions?: number;
  databaseQuestions?: number;
  className?: string;
}

const DEFAULT_ACTIVE_CATEGORY_INDEX = 1;
const DEFAULT_SELECTED_QUESTIONS = 10;
const DEFAULT_DATABASE_QUESTIONS = 2847;

export function QuestionPreviewPanel({
  topicCategory,
  easyPct,
  mediumPct,
  hardPct,
  sampleCategories,
  activeCategoryIndex = DEFAULT_ACTIVE_CATEGORY_INDEX,
  selectedQuestions = DEFAULT_SELECTED_QUESTIONS,
  databaseQuestions = DEFAULT_DATABASE_QUESTIONS,
  className,
}: Readonly<QuestionPreviewPanelProps>) {
  return (
    <div className={cn("rounded-xl bg-surface-muted p-5 md:p-6", className)}>
      {/* Panel header */}
      <div className="flex items-center gap-2">
        <Brain className="size-4 text-primary-600" aria-hidden />
        <h4 className="text-sm font-bold text-primary-700">Auto-Generation Preview</h4>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Question distribution */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Question Distribution
          </h5>
          <div className="flex flex-col gap-2">
            <DistributionBar label="Easy Questions" percent={easyPct} tone="easy" />
            <DistributionBar label="Medium Questions" percent={mediumPct} tone="medium" />
            <DistributionBar label="Hard Questions" percent={hardPct} tone="hard" />
          </div>
        </div>

        {/* Topic focus + selection summary */}
        <div className="flex flex-col gap-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Topic Focus: {topicCategory}
          </h5>
          <div className="flex flex-1 flex-col gap-4 rounded-lg bg-primary-800 p-4">
            <p className="text-xs text-white/70">Sample question categories:</p>
            <div className="flex flex-wrap gap-2">
              {sampleCategories.map((category, index) => (
                <span
                  key={category}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold text-white",
                    index === activeCategoryIndex ? "bg-primary-600" : "bg-warning-500",
                  )}
                >
                  {category}
                </span>
              ))}
            </div>
            <div className="mt-auto rounded-lg bg-surface-default p-4">
              <p className="text-sm font-bold text-primary-700">
                {selectedQuestions} questions will be selected
              </p>
              <p className="text-xs text-text-secondary">
                From our database of {databaseQuestions.toLocaleString()} questions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default QuestionPreviewPanel;
