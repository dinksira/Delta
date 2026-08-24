/**
 * CreateTopicCard
 * Atomic Level: Molecule
 *
 * Grid-cell "create your own topic" affordance for the Create Topic Battle
 * wizard (topic selection step). Idle it renders a dashed tile ("Create your
 * own topic", plus icon); clicking it expands into an inline form (name,
 * subject category, difficulty) with Create/Cancel actions. Submits via
 * `onCreate`; the parent decides how to materialize and select the topic.
 */

import { useState, type FormEvent } from "react";
import { Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { cn } from "@/lib/utils";

export interface CreateTopicCardProps {
  /** Subject/category options for the form's subject select. */
  subjects: { value: string; label: string }[];
  /** Difficulty options for the form's difficulty select. */
  difficulties?: string[];
  /** Emitted with the entered values when the user confirms. */
  onCreate: (topic: { name: string; category: string; difficulty: string }) => void;
  className?: string;
}

const DEFAULT_DIFFICULTIES = ["Easy", "Mixed", "Hard"];

export function CreateTopicCard({
  subjects,
  difficulties = DEFAULT_DIFFICULTIES,
  onCreate,
  className,
}: Readonly<CreateTopicCardProps>) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(subjects[0]?.value ?? "");
  const [difficulty, setDifficulty] = useState(difficulties[1] ?? difficulties[0] ?? "Easy");

  const canCreate = name.trim().length > 0 && category.length > 0;

  const reset = () => {
    setName("");
    setCategory(subjects[0]?.value ?? "");
    setDifficulty(difficulties[1] ?? difficulties[0] ?? "Easy");
    setEditing(false);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!canCreate) return;
    onCreate({ name: name.trim(), category, difficulty });
    reset();
  };

  return (
    <div
      className={cn(
        "flex w-full flex-col gap-3 rounded-xl border-2 border-dashed border-border-default bg-surface-muted p-4",
        className,
      )}
    >
      {!editing ? (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Create your own topic"
          className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg p-4 text-center transition-colors duration-200 hover:border-primary-400 hover:bg-surface-default"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300" aria-hidden>
            <Plus className="size-6" />
          </span>
          <span className="text-sm font-bold text-primary-700">Create your own topic</span>
          <span className="text-xs text-text-secondary">Add a topic not in the list</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary-700" aria-hidden />
            <h4 className="text-sm font-bold text-primary-700">New Topic</h4>
          </div>

          <Field id="custom-topic-name" label="Topic name">
            <Input
              id="custom-topic-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. World Geography Sprint"
              autoFocus
            />
          </Field>

          <Field id="custom-topic-subject" label="Subject">
            <Select
              id="custom-topic-subject"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {subjects.map((subject) => (
                <option key={subject.value} value={subject.value}>
                  {subject.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="custom-topic-difficulty" label="Difficulty">
            <Select
              id="custom-topic-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              {difficulties.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={reset}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canCreate}>
              Create topic
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

export default CreateTopicCard;
