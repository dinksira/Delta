/**
 * ModuleSettingsPanel — right rail of the Host Competition workspace.
 * Language, difficulty, timer, points, and the hint toggle for the module
 * being edited.
 */

"use client";

import { Wrench } from "lucide-react";

import { Switch } from "@/components/atoms/Switch/Switch";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";

const LANGUAGE_OPTIONS = ["HTML", "CSS", "JavaScript", "Python", "Java", "C++"] as const;
const DIFFICULTY_OPTIONS = ["EASY", "MEDIUM", "HARD"] as const;

export function ModuleSettingsPanel() {
  const { state, dispatch } = useHostCompetitionWizard();
  const settings = state.draft.moduleSettings;
  const update = (patch: Partial<typeof settings>) =>
    dispatch({ type: "UPDATE_MODULE_SETTINGS", payload: patch });

  return (
    <aside
      aria-label="Module settings"
      className="rounded-xl border border-border-default bg-surface-default p-3"
    >
      <h3 className="mb-3 flex items-center gap-2 px-1 text-sm font-semibold text-text-primary">
        <Wrench className="size-4 text-primary-700" aria-hidden />
        Module Setting
      </h3>

      <div className="flex flex-col gap-4">
        <Field id="module-language" label="Language">
          <Select
            id="module-language"
            value={settings.language}
            onChange={(event) => update({ language: event.target.value })}
          >
            {LANGUAGE_OPTIONS.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="module-difficulty" label="Difficulty Level">
          <Select
            id="module-difficulty"
            value={settings.difficulty}
            onChange={(event) => update({ difficulty: event.target.value })}
          >
            {DIFFICULTY_OPTIONS.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="module-timer" label="Timer (minutes)">
          <Input
            id="module-timer"
            inputMode="numeric"
            value={settings.timer}
            placeholder="00:00"
            onChange={(event) => update({ timer: event.target.value })}
          />
        </Field>

        <Field id="module-points" label="Points">
          <Input
            id="module-points"
            type="number"
            min={0}
            step={0.5}
            value={settings.points}
            placeholder="0.0"
            onChange={(event) => update({ points: event.target.value })}
          />
        </Field>

        <div className="flex items-center justify-between gap-3 border-t border-border-default pt-3">
          <span className="text-sm font-medium text-text-primary">Hint</span>
          <Switch
            checked={settings.hintEnabled}
            onChange={(checked) => update({ hintEnabled: checked })}
          />
        </div>
      </div>
    </aside>
  );
}

export default ModuleSettingsPanel;
