/**
 * WorkspaceCanvas — centre canvas of the Host Competition workspace (Step 5).
 *
 * Renders the active workspace module for the active question, mirroring the
 * topic-battle wizard's `QuestionBuilderStep`: each module either matches the
 * question's `kind` and shows its real authoring surface (CodeEditorModule,
 * QuestionAuthoringEditor, MarkdownPadModule, DesignCanvasModule) or shows a
 * ModuleSwitchPrompt that converts the question. All state comes from the
 * host wizard context; all canvases are the shared library organisms.
 */

"use client";

import { Braces, Code2, Palette, ScrollText } from "lucide-react";

import { CodeEditorModule } from "@/components/organisms/CodeEditorModule/CodeEditorModule";
import { DesignCanvasModule } from "@/components/organisms/DesignCanvasModule/DesignCanvasModule";
import { MarkdownPadModule } from "@/components/organisms/MarkdownPadModule/MarkdownPadModule";
import { QuestionAuthoringEditor } from "@/components/organisms/QuestionAuthoringEditor/QuestionAuthoringEditor";
import { useHostCompetitionWizard } from "@/modules/Competition/context/HostCompetitionWizardContext";
import type { HostModuleId } from "@/modules/Competition/context/HostCompetitionWizardContext";
import type { CodingQuestion, QuestionKind } from "@/modules/Competition/types/createBattle";
import {
  ModuleSwitchPrompt,
  QUESTION_KIND_LABELS,
  QUESTION_LANGUAGES,
} from "@/modules/Competition/views/CreateBattleTopicPage";

export interface WorkspaceCanvasProps {
  activeModule: HostModuleId;
}

export function WorkspaceCanvas({ activeModule }: Readonly<WorkspaceCanvasProps>) {
  const { state, dispatch } = useHostCompetitionWizard();
  const { questions, activeQuestionId } = state.draft;

  const activeQuestion =
    questions.find((question) => question.id === activeQuestionId) ??
    questions[questions.length - 1];

  if (!activeQuestion) return null;

  const updateActive = (patch: Partial<CodingQuestion>) => {
    dispatch({ type: "UPDATE_QUESTION", payload: { id: activeQuestion.id, patch } });
  };

  const removeActive = () => {
    dispatch({ type: "REMOVE_QUESTION", payload: activeQuestion.id });
  };

  const convertTo = (kind: QuestionKind) => updateActive({ kind });

  const kindLabel = QUESTION_KIND_LABELS[activeQuestion.kind] ?? "question";

  switch (activeModule) {
    case "code":
      return activeQuestion.kind === "coding" ? (
        <CodeEditorModule
          question={activeQuestion}
          onChange={updateActive}
          onRemove={removeActive}
          languages={QUESTION_LANGUAGES}
        />
      ) : (
        <ModuleSwitchPrompt
          icon={<Braces className="size-6" />}
          title={`This is a ${kindLabel} question`}
          description="The Code Editor module composes coding questions. Open the Question Builder module to author this question type."
          actionLabel="Open Question Builder"
          onAction={() => dispatch({ type: "SET_ACTIVE_MODULE", payload: "question" })}
        />
      );
    case "question":
      return activeQuestion.kind === "coding" ? (
        <ModuleSwitchPrompt
          icon={<Code2 className="size-6" />}
          title="Coding question detected"
          description="This question is authored in the Code Editor module with the LeetCode-style canvas (problem statement, constraints, code template, and test cases)."
          actionLabel="Open Code Editor"
          onAction={() => dispatch({ type: "SET_ACTIVE_MODULE", payload: "code" })}
        />
      ) : (
        <QuestionAuthoringEditor
          question={activeQuestion}
          onChange={updateActive}
          onRemove={removeActive}
        />
      );
    case "markdown":
      return activeQuestion.kind === "markdown" ? (
        <MarkdownPadModule
          question={activeQuestion}
          onChange={updateActive}
          onRemove={removeActive}
        />
      ) : (
        <ModuleSwitchPrompt
          icon={<ScrollText className="size-6" />}
          title={`This is a ${kindLabel} question`}
          description="The Markdown Pad module composes markdown questions with a source editor and live participant preview."
          actionLabel="Convert to Markdown"
          onAction={() => convertTo("markdown")}
        />
      );
    case "design":
      return activeQuestion.kind === "design" ? (
        <DesignCanvasModule
          question={activeQuestion}
          onChange={updateActive}
          onRemove={removeActive}
        />
      ) : (
        <ModuleSwitchPrompt
          icon={<Palette className="size-6" />}
          title={`This is a ${kindLabel} question`}
          description="The Design Canvas module composes visual challenge questions with a brief, deliverables, cover image and canvas spec."
          actionLabel="Convert to Design"
          onAction={() => convertTo("design")}
        />
      );
    default:
      return null;
  }
}

export default WorkspaceCanvas;
