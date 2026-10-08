/**
 * WorkspaceStep — Step 5 of the Host Competition wizard.
 *
 * Three-column workspace that reuses the Competition Workspace library built
 * for the topic-battle wizard: ModuleRail (left), question tabs + type menu +
 * active module canvas (centre), and QuestionModuleSettings (right). Shows the
 * empty prompt until a module is selected; an empty question list offers the
 * shared "Build your first question" action.
 */

"use client";

import { Braces, Plus } from "lucide-react";

import { QuestionModuleSettings } from "@/components/molecules/QuestionModuleSettings/QuestionModuleSettings";
import { ModuleRail } from "@/components/organisms/ModuleRail/ModuleRail";
import { QuestionTabBar } from "@/components/organisms/QuestionTabBar/QuestionTabBar";
import { QuestionTypeMenu } from "@/components/organisms/QuestionTypeMenu/QuestionTypeMenu";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";
import type { HostModuleId } from "@/modules/Competition/context/HostCompetitionWizardContext";
import {
  MAX_QUESTIONS,
  QUESTION_KIND_LABELS,
  QUESTION_TYPE_KINDS,
  WORKSPACE_MODULES,
} from "@/modules/Competition/views/CreateBattleTopicPage";

import { WorkspaceCanvas } from "./WorkspaceCanvas";

function EmptyCanvas() {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/40 px-6 text-center text-sm text-text-secondary">
      Select a module to get started...
    </div>
  );
}

function EmptyQuestions({ onAdd }: Readonly<{ onAdd: () => void }>) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-4 text-center">
      <Braces className="size-10 text-primary-600" aria-hidden />
      <Typography as="h3" className="text-lg font-semibold text-text-primary">
        Build your first question
      </Typography>
      <Typography className="max-w-sm text-sm text-text-secondary">
        Add a question to include in this competition.
      </Typography>
      <Button onClick={onAdd}>
        <Plus className="size-4" aria-hidden />
        Add question
      </Button>
    </div>
  );
}

export function WorkspaceStep() {
  const { state, dispatch } = useHostCompetitionWizard();
  const { questions, activeQuestionId, activeModule } = state.draft;
  const activeQuestion = questions.find((question) => question.id === activeQuestionId) ?? null;

  // Selecting a kind-specific module (Markdown / Design) converts the active
  // question so its canvas shows immediately instead of a switch prompt.
  const selectModule = (moduleId: string) => {
    const id = moduleId as HostModuleId;
    if ((id === "markdown" || id === "design") && activeQuestion) {
      dispatch({
        type: "UPDATE_QUESTION",
        payload: { id: activeQuestion.id, patch: { kind: id } },
      });
    }
    dispatch({ type: "SET_ACTIVE_MODULE", payload: id });
  };

  const selectQuestionType = (label: string) => {
    if (!activeQuestion) return;
    dispatch({
      type: "UPDATE_QUESTION",
      payload: {
        id: activeQuestion.id,
        patch: { kind: QUESTION_TYPE_KINDS[label] ?? "coding" },
      },
    });
  };

  return (
    <div className={cn("grid gap-4 lg:grid-cols-[256px_minmax(0,1fr)_240px]")}>
      <ModuleRail
        modules={WORKSPACE_MODULES}
        activeId={activeModule ?? ""}
        onSelect={selectModule}
      />

      <section
        aria-label="Active content"
        className="min-w-0 rounded-xl border border-border-default bg-surface-default p-4"
      >
        {activeModule === null ? (
          <EmptyCanvas />
        ) : !activeQuestion ? (
          <EmptyQuestions onAdd={() => dispatch({ type: "ADD_QUESTION" })} />
        ) : (
          <div className="flex h-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <QuestionTabBar
                questions={questions}
                activeId={activeQuestion.id}
                maxQuestions={MAX_QUESTIONS}
                onSelect={(id) => dispatch({ type: "SET_ACTIVE_QUESTION", payload: id })}
                onAdd={() => dispatch({ type: "ADD_QUESTION" })}
              />
              <QuestionTypeMenu
                value={QUESTION_KIND_LABELS[activeQuestion.kind]}
                onSelect={selectQuestionType}
              />
            </div>
            <WorkspaceCanvas activeModule={activeModule} />
          </div>
        )}
      </section>

      <aside
        aria-label="Module settings"
        className="min-w-0 rounded-xl border border-border-default bg-surface-default p-4"
      >
        {activeQuestion ? (
          <QuestionModuleSettings
            question={activeQuestion}
            onChange={(patch) =>
              dispatch({ type: "UPDATE_QUESTION", payload: { id: activeQuestion.id, patch } })
            }
          />
        ) : (
          <Typography className="text-sm text-text-secondary">
            Select a module to edit its question settings.
          </Typography>
        )}
      </aside>
    </div>
  );
}

export default WorkspaceStep;
