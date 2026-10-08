/**
 * CodeWorkspaceCanvas — centre column of the workspace when the Code Editor
 * module is active: question tab bar (Q1. + add), Problem Description box,
 * and the dark embedded code editor seeded with `// Write the code problem here`.
 */

"use client";

import { GripHorizontal, Plus } from "lucide-react";

import { CodeEditor } from "@/components/molecules/CodeEditor/CodeEditor";
import { Field } from "@/components/theme/Field";
import { Textarea } from "@/components/theme/Textarea";
import { cn } from "@/lib/utils";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";

export function CodeWorkspaceCanvas() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { questions, activeQuestionId, moduleSettings } = state.draft;
  const activeQuestion = questions.find((question) => question.id === activeQuestionId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Questions"
        className="flex items-center gap-1 border-b border-border-default"
      >
        {questions.map((question) => {
          const isActive = question.id === activeQuestionId;
          return (
            <button
              key={question.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => dispatch({ type: "SET_ACTIVE_QUESTION", payload: question.id })}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200",
                isActive
                  ? "border-primary-700 text-primary-700"
                  : "border-transparent text-text-secondary hover:text-text-primary",
              )}
            >
              {question.label}
            </button>
          );
        })}
        <button
          type="button"
          aria-label="Add question"
          onClick={() => dispatch({ type: "ADD_QUESTION" })}
          className="rounded-md p-1.5 text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      {activeQuestion && (
        <>
          <Field id="workspace-problem-description" label="Problem Description">
            <Textarea
              id="workspace-problem-description"
              rows={3}
              value={activeQuestion.description}
              placeholder="Enter Description"
              className="resize-y"
              onChange={(event) =>
                dispatch({
                  type: "UPDATE_QUESTION",
                  payload: { id: activeQuestion.id, patch: { description: event.target.value } },
                })
              }
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-text-primary">Code Description</p>
            <div className="relative">
              <GripHorizontal
                className="absolute right-2 top-2 z-10 size-4 text-white/50"
                aria-hidden
              />
              <CodeEditor
                value={activeQuestion.code}
                language={moduleSettings.language}
                aria-label="Code description editor"
                rows={10}
                className="w-full"
                onChange={(code) =>
                  dispatch({
                    type: "UPDATE_QUESTION",
                    payload: { id: activeQuestion.id, patch: { code } },
                  })
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CodeWorkspaceCanvas;
