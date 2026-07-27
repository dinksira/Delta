/**
 * Host Competition wizard types.
 */

export type CompetitionModuleType =
  | "code-editor"
  | "question-builder"
  | "markdown-pad"
  | "design-canvas";

export interface PrizeEntry {
  id: string;
  rank: string;
  type: "money" | "other" | "subscription" | "digital-product";
  valueDescription: string;
  winCondition: string;
}

export interface PhaseEntry {
  id: string;
  phaseName: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface HostCompetitionDraft {
  overview: {
    coverImage: File | null;
    coverImagePreview: string;
    title: string;
    description: string;
  };
  prizes: PrizeEntry[];
  timeline: PhaseEntry[];
  terms: {
    richTextContent: string;
    agreed: boolean;
  };
  workspace: {
    selectedModule: CompetitionModuleType | null;
    moduleConfig: Record<string, unknown>;
  };
  status: "draft" | "published";
}

export interface StepValidation {
  isValid: boolean;
  errors: string[];
}

// -------- Code Editor Module --------

export type CodeEditorLanguage = "html" | "javascript" | "python" | "css" | "typescript" | "java" | "cpp" | "csharp" | "go" | "rust" | "sql" | "php" | "ruby" | "swift" | "kotlin";

export type CodeEditorDifficulty = "easy" | "medium" | "hard";

export interface CodeEditorQuestion {
  id: string;
  number: string;
  problemDescription: string;
  codeDescription: string;
  settings: {
    language: CodeEditorLanguage;
    difficulty: CodeEditorDifficulty;
    timerMinutes: number;
    points: number;
    hintEnabled: boolean;
    hintText: string;
  };
}

export interface CodeEditorModuleState {
  questions: CodeEditorQuestion[];
  activeQuestionId: string;
}
