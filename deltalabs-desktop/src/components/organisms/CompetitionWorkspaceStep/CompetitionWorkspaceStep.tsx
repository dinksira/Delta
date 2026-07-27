import { ModuleList } from "@/components/molecules/ModuleList/ModuleList";
import { CodeEditorModulePanel } from "@/components/organisms/CodeEditorModulePanel/CodeEditorModulePanel";
import { CodeEditorModuleSettings } from "@/components/organisms/CodeEditorModuleSettings/CodeEditorModuleSettings";
import type {
  CompetitionModuleType,
  CodeEditorQuestion,
  CodeEditorModuleState,
  CodeEditorLanguage,
  CodeEditorDifficulty,
} from "@/modules/Competition/types/host";
import { cn } from "@/lib/utils";

export interface CompetitionWorkspaceStepProps {
  selectedModule: CompetitionModuleType | null;
  onSelectModule: (id: CompetitionModuleType) => void;
  codeEditorState?: CodeEditorModuleState;
  activeCodeEditorQuestion?: CodeEditorQuestion | null;
  onAddQuestion?: () => void;
  onSelectQuestion?: (id: string) => void;
  onUpdateActiveQuestion?: (patch: Partial<CodeEditorQuestion>) => void;
  onUpdateActiveQuestionSettings?: (
    patch: Partial<CodeEditorQuestion["settings"]>,
  ) => void;
  className?: string;
}

export function CompetitionWorkspaceStep({
  selectedModule,
  onSelectModule,
  codeEditorState,
  activeCodeEditorQuestion,
  onAddQuestion,
  onSelectQuestion,
  onUpdateActiveQuestion,
  onUpdateActiveQuestionSettings,
  className,
}: Readonly<CompetitionWorkspaceStepProps>) {
  const renderCenterPanel = () => {
    if (!selectedModule) {
      return (
        <p className="text-sm text-text-secondary">
          Select a module to get started...
        </p>
      );
    }

    switch (selectedModule) {
      case "code-editor":
        return codeEditorState && onAddQuestion && onSelectQuestion &&
          onUpdateActiveQuestion && onUpdateActiveQuestionSettings ? (
          <CodeEditorModulePanel
            questions={codeEditorState.questions}
            activeQuestionId={codeEditorState.activeQuestionId}
            onSelectQuestion={onSelectQuestion}
            onAddQuestion={onAddQuestion}
            onProblemDescriptionChange={(value) =>
              onUpdateActiveQuestion({ problemDescription: value })
            }
            onCodeDescriptionChange={(value) =>
              onUpdateActiveQuestion({ codeDescription: value })
            }
            onExpandProblem={() => console.log("Expand problem description")}
            onExpandCode={() => console.log("Expand code description")}
          />
        ) : null;

      default:
        return (
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {moduleLabels[selectedModule]}
            </span>{" "}
            module — full functionality coming in a dedicated update.
          </p>
        );
    }
  };

  const renderSettingsPanel = () => {
    if (!selectedModule) {
      return <p className="text-xs text-text-secondary">No module selected.</p>;
    }

    switch (selectedModule) {
      case "code-editor":
        return activeCodeEditorQuestion && onUpdateActiveQuestionSettings ? (
          <CodeEditorModuleSettings
            language={activeCodeEditorQuestion.settings.language}
            difficulty={activeCodeEditorQuestion.settings.difficulty}
            timerMinutes={activeCodeEditorQuestion.settings.timerMinutes}
            points={activeCodeEditorQuestion.settings.points}
            hintEnabled={activeCodeEditorQuestion.settings.hintEnabled}
            hintText={activeCodeEditorQuestion.settings.hintText}
            onLanguageChange={(value: CodeEditorLanguage) =>
              onUpdateActiveQuestionSettings({ language: value })
            }
            onDifficultyChange={(value: CodeEditorDifficulty) =>
              onUpdateActiveQuestionSettings({ difficulty: value })
            }
            onTimerChange={(value: number) =>
              onUpdateActiveQuestionSettings({ timerMinutes: value })
            }
            onPointsChange={(value: number) =>
              onUpdateActiveQuestionSettings({ points: value })
            }
            onHintEnabledChange={(value: boolean) =>
              onUpdateActiveQuestionSettings({ hintEnabled: value })
            }
            onHintTextChange={(value: string) =>
              onUpdateActiveQuestionSettings({ hintText: value })
            }
          />
        ) : null;

      default:
        return (
          <p className="text-xs text-text-secondary">
            Settings for{" "}
            <span className="font-medium text-text-primary">
              {moduleLabels[selectedModule]}
            </span>{" "}
            will appear here.
          </p>
        );
    }
  };

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <h2 className="text-base font-bold text-text-primary">
        Competition Workspace
      </h2>

      <div className="flex gap-3">
        {/* Left: Module list */}
        <div className="flex w-44 shrink-0 flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
            Modules
          </p>
          <ModuleList selected={selectedModule} onSelect={onSelectModule} />
        </div>

        {/* Center: Content area */}
        <div className="flex flex-1 rounded-xl border border-border-default bg-surface-default p-4">
          {renderCenterPanel()}
        </div>

        {/* Right: Module settings */}
        <div className="flex w-52 shrink-0 flex-col gap-3 rounded-xl border border-border-default bg-surface-default p-4">
          {renderSettingsPanel()}
        </div>
      </div>
    </div>
  );
}

const moduleLabels: Record<CompetitionModuleType, string> = {
  "code-editor": "Code Editor",
  "question-builder": "Question Builder",
  "markdown-pad": "Markdown Pad",
  "design-canvas": "Design Canvas",
};
