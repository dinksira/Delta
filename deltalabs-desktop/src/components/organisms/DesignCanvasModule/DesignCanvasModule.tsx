/**
 * DesignCanvasModule
 * Atomic Level: Organism
 *
 * Competition Workspace center-canvas authoring surface for `kind: "design"`
 * questions: a split 2fr/3fr layout with the design brief (RichTextEditor),
 * deliverables (DeliverableList) and rubric on the left, and the cover upload
 * (MediaUploadField), canvas size inputs and framed preview
 * (DesignCanvasPreview) on the right — mirroring the Code Editor module's
 * problem/editor split. Question meta (difficulty, timer, points, hint) lives in
 * the QuestionModuleSettings / ModuleSettingsPanel. Fully controlled via
 * `question` + `onChange`.
 *
 * @example
 * <DesignCanvasModule
 *   question={activeQuestion}
 *   onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
 *   onRemove={removeQuestion}
 * />
 */

import { Palette } from "lucide-react";

import { DesignCanvasPreview } from "@/components/molecules/DesignCanvasPreview/DesignCanvasPreview";
import { DeliverableList } from "@/components/molecules/DeliverableList/DeliverableList";
import { MediaUploadField } from "@/components/molecules/MediaUploadField/MediaUploadField";
import { RichTextEditor } from "@/components/molecules/RichTextEditor/RichTextEditor";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import type {
  CodingQuestion,
  DesignCanvasPayload,
} from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

const CANVAS_MIN = 64;
const CANVAS_MAX = 4096;

export interface DesignCanvasModuleProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  onRemove: () => void;
  /** Org used by the cover upload pipeline when the page has no org context. */
  orgId?: string;
  className?: string;
}

export function DesignCanvasModule({
  question,
  onChange,
  onRemove,
  orgId,
  className,
}: Readonly<DesignCanvasModuleProps>) {
  const updateDesign = (updates: Partial<DesignCanvasPayload>) =>
    onChange({ design: { ...question.design, ...updates } });

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      <div className="flex items-center justify-between">
        <Typography as="h3" className="flex items-center gap-2 text-base font-bold text-primary-700">
          <Palette className="size-4" aria-hidden />
          Design Challenge
        </Typography>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-md px-2 py-1 text-xs font-semibold text-error-600 transition-colors hover:bg-error-50"
        >
          Remove question
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_3fr]">
        {/* Left: brief, deliverables, rubric */}
        <div className="flex min-w-0 flex-col gap-4">
          <Field id="dc-brief" label="Design brief" className="gap-1">
            <RichTextEditor
              id="dc-brief"
              value={question.design.brief}
              onChange={(brief) => updateDesign({ brief })}
              placeholder="Describe the visual task, audience, and any constraints…"
            />
          </Field>

          <Field id="dc-deliverables" label="Deliverables">
            <DeliverableList
              items={question.design.deliverables}
              onChange={(deliverables) => updateDesign({ deliverables })}
            />
          </Field>

          <Field id="dc-rubric" label="Rubric / scoring notes">
            <Textarea
              id="dc-rubric"
              rows={3}
              value={question.design.rubric}
              onChange={(event) => updateDesign({ rubric: event.target.value })}
              placeholder="How should the submitted design be graded?"
            />
          </Field>
        </div>

        {/* Right: cover, canvas size, preview */}
        <div className="flex min-w-0 flex-col gap-4">
          <Field id="dc-cover" label="Cover / reference image" className="gap-1">
            <MediaUploadField
              value={question.design.cover}
              onChange={(cover) => updateDesign({ cover })}
              orgId={orgId}
            />
          </Field>

          <Field id="dc-canvas-size" label="Canvas size (px)">
            <div className="flex items-center gap-2">
              <Input
                id="dc-canvas-width"
                type="number"
                min={CANVAS_MIN}
                max={CANVAS_MAX}
                value={question.design.canvasWidth}
                aria-label="Canvas width"
                onChange={(event) =>
                  updateDesign({
                    canvasWidth: clampDim(Number(event.target.value), question.design.canvasWidth),
                  })
                }
              />
              <Typography className="text-text-tertiary">×</Typography>
              <Input
                id="dc-canvas-height"
                type="number"
                min={CANVAS_MIN}
                max={CANVAS_MAX}
                value={question.design.canvasHeight}
                aria-label="Canvas height"
                onChange={(event) =>
                  updateDesign({
                    canvasHeight: clampDim(
                      Number(event.target.value),
                      question.design.canvasHeight,
                    ),
                  })
                }
              />
            </div>
          </Field>

          <DesignCanvasPreview
            asset={question.design.cover}
            width={question.design.canvasWidth}
            height={question.design.canvasHeight}
          />
        </div>
      </div>
    </div>
  );
}

/** Clamp a numeric input into the supported canvas range, keeping the previous value on NaN. */
function clampDim(value: number, previous: number): number {
  if (Number.isNaN(value)) {
    return previous;
  }
  return Math.min(CANVAS_MAX, Math.max(CANVAS_MIN, value));
}

export default DesignCanvasModule;