/**
 * QuestionModuleSettings
 * Atomic Level: Molecule
 *
 * "Module Setting" inspector controls for the Question Builder workspace:
 * Difficulty Level (select), Timer (minutes), Points, and a Hint toggle (switch)
 * with optional hint text. Rendered inside the ModuleSettingsPanel organism.
 * Fully controlled via `question` + `onChange`.
 * @example <QuestionModuleSettings question={q} onChange={(u) => update(q.id, u)} />
 */

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { Switch } from "@/components/theme/Switch";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";

export interface QuestionModuleSettingsProps {
  question: CodingQuestion;
  onChange: (updates: Partial<CodingQuestion>) => void;
  className?: string;
}

const DIFFICULTY_LEVELS = ["EASY", "MEDIUM", "HARD"] as const;

export function QuestionModuleSettings({
  question,
  onChange,
  className,
}: Readonly<QuestionModuleSettingsProps>) {
  return (
    <div className={`flex flex-col gap-4 ${className ?? ""}`}>
      <Field id="qms-difficulty" label="Difficulty Level">
        <Select
          id="qms-difficulty"
          value={question.difficulty}
          onChange={(event) =>
            onChange({ difficulty: event.target.value as CodingQuestion["difficulty"] })
          }
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </Select>
      </Field>

      <Field id="qms-timer" label="Timer (minutes)">
        <Input
          id="qms-timer"
          type="number"
          min={1}
          max={180}
          value={question.timeLimitMinutes}
          onChange={(event) => onChange({ timeLimitMinutes: Number(event.target.value) })}
          placeholder="10"
        />
      </Field>

      <Field id="qms-points" label="Points">
        <Input
          id="qms-points"
          type="number"
          min={0}
          step={0.5}
          value={question.points}
          onChange={(event) => onChange({ points: Number(event.target.value) })}
          placeholder="1.0"
        />
      </Field>

      <div className="flex items-center justify-between gap-3">
        <Typography as="span" className="text-sm font-medium text-text-primary">
          Hint
        </Typography>
        <Switch
          checked={question.hintEnabled}
          onCheckedChange={(checked) => onChange({ hintEnabled: checked })}
          label="Hint"
        />
      </div>

      {question.hintEnabled && (
        <Field id="qms-hint" label="Hint text">
          <Textarea
            id="qms-hint"
            rows={3}
            value={question.hintText}
            onChange={(event) => onChange({ hintText: event.target.value })}
            placeholder="A nudge in the right direction…"
          />
        </Field>
      )}
    </div>
  );
}

export default QuestionModuleSettings;