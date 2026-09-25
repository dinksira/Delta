/**
 * CreateChampionshipPage
 * View that hosts and launches a brand-new Championship tournament via a
 * 5-step wizard rendered inside the reusable CreateBattleWizardTemplate:
 *   Step 1 — Tournament Details
 *   Step 2 — Tournament Setup (stages, fees, escalating prizes)
 *   Step 3 — Stage Questions (compile per-stage questions or use auto pool)
 *   Step 4 — Schedule (instant or scheduled round 1)
 *   Step 5 — Review & Launch
 */

"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  Braces,
  CalendarClock,
  Code2,
  Flame,
  Minus,
  Palette,
  PenLine,
  Plus,
  Rocket,
  ScrollText,
  Settings2,
  Trophy,
} from "lucide-react";

import { CreateBattleWizardTemplate } from "@/components/templates/CreateBattleWizardTemplate/CreateBattleWizardTemplate";
import type { ProgressStepperStep } from "@/components/molecules/ProgressStepper/ProgressStepper.types";
import { TimingOptionGrid } from "@/components/organisms/TimingOptionGrid/TimingOptionGrid";
import { SchedulePicker } from "@/components/organisms/SchedulePicker/SchedulePicker";
import { FeeSelector } from "@/components/molecules/FeeSelector/FeeSelector";
import { QuestionAuthoringEditor } from "@/components/organisms/QuestionAuthoringEditor/QuestionAuthoringEditor";
import { CodeEditorModule } from "@/components/organisms/CodeEditorModule/CodeEditorModule";
import { ModuleRail } from "@/components/organisms/ModuleRail/ModuleRail";
import { ModuleSettingsPanel } from "@/components/organisms/ModuleSettingsPanel/ModuleSettingsPanel";
import { QuestionTabBar } from "@/components/organisms/QuestionTabBar/QuestionTabBar";
import { QuestionTypeMenu } from "@/components/organisms/QuestionTypeMenu/QuestionTypeMenu";
import { QuestionBuilderHeader } from "@/components/organisms/QuestionBuilderHeader/QuestionBuilderHeader";
import { QuestionModuleSettings } from "@/components/molecules/QuestionModuleSettings/QuestionModuleSettings";
import { MarkdownPadModule } from "@/components/organisms/MarkdownPadModule/MarkdownPadModule";
import { DesignCanvasModule } from "@/components/organisms/DesignCanvasModule/DesignCanvasModule";
import { CompetitionWorkspaceTemplate } from "@/components/templates/CompetitionWorkspaceTemplate/CompetitionWorkspaceTemplate";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Textarea } from "@/components/theme/Textarea";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import { BATTLE_TIMINGS, BATTLE_TIMEZONES, ENTRY_FEE_OPTIONS } from "@/modules/Competition/data";
import { useCreateChampionship } from "@/modules/Competition/hooks/useCreateChampionship";
import type { CreateChampionshipPayload } from "@/modules/Competition/types/championship";
import {
  createEmptyQuestion,
  type CodingQuestion,
  type QuestionKind,
} from "@/modules/Competition/types/createBattle";
import {
  MAX_QUESTIONS,
  ModuleSwitchPrompt,
  QUESTION_KIND_LABELS,
  QUESTION_LANGUAGES,
  QUESTION_TYPE_KINDS,
  WORKSPACE_MODULES,
} from "@/modules/Competition/views/CreateBattleTopicPage";

const WIZARD_STEPS: ProgressStepperStep[] = [
  { id: "details", label: "Details", icon: <PenLine className="size-5" /> },
  { id: "setup", label: "Setup", icon: <Settings2 className="size-5" /> },
  { id: "questions", label: "Questions", icon: <Braces className="size-5" /> },
  { id: "schedule", label: "Schedule", icon: <CalendarClock className="size-5" /> },
  { id: "launch", label: "Launch", icon: <Rocket className="size-5" /> },
];

const TOTAL_STEPS = WIZARD_STEPS.length;

const STAGE_OPTIONS: { count: number; title: string; runs: string[] }[] = [
  {
    count: 3,
    title: "Quick Knockout",
    runs: ["Qualifier Round", "Semifinals", "Grand Final"],
  },
  {
    count: 5,
    title: "Classic Bracket",
    runs: ["Qualifier Round", "Round of 32", "Round of 16", "Quarterfinals", "Grand Final"],
  },
  {
    count: 8,
    title: "Full Bracket",
    runs: [
      "Qualifier Round",
      "Round of 64",
      "Round of 32",
      "Round of 16",
      "Quarterfinals",
      "Semifinals",
      "Finals",
      "Grand Final",
    ],
  },
];

const DEFAULT_TIMEZONE = "UTC+3 (EAT)";

interface ChampionshipDraft {
  title: string;
  description: string;
  creatorName: string;
  stageCount: number;
  entryFee: number | "Free" | "Custom";
  customFee: number;
  prizeBaseEtb: number;
  timing: "instant" | "schedule";
  scheduleDate: string;
  scheduleTime: string;
  scheduleTimezone: string;
}

const INITIAL_DRAFT: ChampionshipDraft = {
  title: "",
  description: "",
  creatorName: "",
  stageCount: 5,
  entryFee: "Free",
  customFee: 25,
  prizeBaseEtb: 12,
  timing: "instant",
  scheduleDate: "",
  scheduleTime: "",
  scheduleTimezone: DEFAULT_TIMEZONE,
};

function stagePrizes(base: number, count: number): number[] {
  return Array.from({ length: count }, (_, index) => {
    const prize = base * 2 ** index;
    return index === count - 1 ? prize + base * count : prize;
  });
}

function entryFeeLabel(fee: number | "Free" | "Custom", customFee: number): string {
  if (fee === "Free") return "Free";
  if (fee === "Custom") return `ETB ${customFee}`;
  return `ETB ${fee}`;
}

export function CreateChampionshipPage() {
  return <CreateChampionshipWizard />;
}

function CreateChampionshipWizard() {
  const router = useRouter();
  const createChampionship = useCreateChampionship();

  const [currentStep, setCurrentStep] = useState(1);
  const [draft, setDraft] = useState<ChampionshipDraft>(INITIAL_DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stageModes, setStageModes] = useState<StageQuestionMode[]>(() =>
    Array.from({ length: INITIAL_DRAFT.stageCount }, () => "auto"),
  );
  const [stageQuestions, setStageQuestions] = useState<CodingQuestion[][]>(() =>
    Array.from({ length: INITIAL_DRAFT.stageCount }, () => []),
  );
  const [editingStageIndex, setEditingStageIndex] = useState<number | null>(null);

  const handleBack = useCallback(() => {
    router.push("/features/competitions/championship");
  }, [router]);

  const updateDraft = useCallback((updates: Partial<ChampionshipDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const handleStageCountChange = useCallback(
    (count: number) => {
      updateDraft({ stageCount: count });
      setStageModes((prev) => resizeTo(prev, count, () => "auto"));
      setStageQuestions((prev) => resizeTo(prev, count, () => []));
    },
    [updateDraft],
  );

  const handleStageQuestionsDone = useCallback(
    (stageIndex: number, questions: CodingQuestion[]) => {
      setStageQuestions((prev) => {
        const next = [...prev];
        next[stageIndex] = questions;
        return next;
      });
      setStageModes((prev) => {
        const next = [...prev];
        next[stageIndex] = questions.length > 0 ? "custom" : "auto";
        return next;
      });
      setEditingStageIndex(null);
    },
    [],
  );

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 1:
        return draft.title.trim().length >= 3;
      case 3:
        return draft.timing === "instant" || Boolean(draft.scheduleDate && draft.scheduleTime);
      default:
        return true;
    }
  }, [currentStep, draft]);

  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS && canGoNext) {
      setCurrentStep((step) => step + 1);
    }
  }, [currentStep, canGoNext]);

  const goPrevious = useCallback(() => {
    setCurrentStep((step) => Math.max(1, step - 1));
  }, []);

  const handleLaunch = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const payload: CreateChampionshipPayload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      stageCount: draft.stageCount,
      entryFee: entryFeeLabel(draft.entryFee, draft.customFee),
      prizeBaseEtb: draft.prizeBaseEtb,
      timing: draft.timing,
      creatorName: draft.creatorName.trim() || undefined,
      stageQuestions: stageModes.map((mode, index) =>
        mode === "custom" ? (stageQuestions[index] ?? []) : [],
      ),
      ...(draft.timing === "schedule"
        ? {
            scheduleDate: draft.scheduleDate,
            scheduleTime: draft.scheduleTime,
            scheduleTimezone: draft.scheduleTimezone,
          }
        : {}),
    };
    try {
      await createChampionship.mutateAsync(payload);
      router.push("/features/competitions/championship");
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Failed to launch the tournament.",
      );
      setIsSubmitting(false);
    }
  }, [createChampionship, draft, router, stageModes, stageQuestions]);

  if (editingStageIndex !== null) {
    const stage = stageLabel(draft.stageCount, editingStageIndex);
    return (
      <StageQuestionBuilder
        stageLabel={stage}
        stageIndex={editingStageIndex}
        initial={stageQuestions[editingStageIndex] ?? []}
        onBack={() => setEditingStageIndex(null)}
        onDone={handleStageQuestionsDone}
      />
    );
  }

  return (
    <CreateBattleWizardTemplate
      title="Create Championship"
      currentStep={currentStep}
      totalSteps={TOTAL_STEPS}
      steps={WIZARD_STEPS}
      onBack={handleBack}
      onPrevious={goPrevious}
      previousDisabled={currentStep <= 1 || isSubmitting}
      onNext={currentStep === TOTAL_STEPS ? handleLaunch : goNext}
      nextDisabled={!canGoNext || isSubmitting}
      nextLabel={
        currentStep === TOTAL_STEPS
          ? isSubmitting
            ? "Launching…"
            : "Launch Tournament"
          : "Next"
      }
      submitError={submitError}
    >
      <StepContent
        currentStep={currentStep}
        draft={draft}
        updateDraft={updateDraft}
        onStageCountChange={handleStageCountChange}
        stageModes={stageModes}
        stageQuestions={stageQuestions}
        onOpenStageBuilder={(index) => setEditingStageIndex(index)}
        onEditStep={setCurrentStep}
      />
    </CreateBattleWizardTemplate>
  );
}

interface StepContentProps {
  currentStep: number;
  draft: ChampionshipDraft;
  updateDraft: (updates: Partial<ChampionshipDraft>) => void;
  onStageCountChange: (count: number) => void;
  stageModes: StageQuestionMode[];
  stageQuestions: CodingQuestion[][];
  onOpenStageBuilder: (index: number) => void;
  onEditStep: (step: number) => void;
}

function StepContent({
  currentStep,
  draft,
  updateDraft,
  onStageCountChange,
  stageModes,
  stageQuestions,
  onOpenStageBuilder,
  onEditStep,
}: Readonly<StepContentProps>) {
  switch (currentStep) {
    case 1:
      return <DetailsStep draft={draft} updateDraft={updateDraft} />;
    case 2:
      return (
        <SetupStep
          draft={draft}
          updateDraft={updateDraft}
          onStageCountChange={onStageCountChange}
        />
      );
    case 3:
      return (
        <QuestionsStep
          draft={draft}
          stageModes={stageModes}
          stageQuestions={stageQuestions}
          onOpenStageBuilder={onOpenStageBuilder}
        />
      );
    case 4:
      return <ScheduleStep draft={draft} updateDraft={updateDraft} />;
    case 5:
      return (
        <ReviewLaunchStep
          draft={draft}
          stageModes={stageModes}
          stageQuestions={stageQuestions}
          onEditStep={onEditStep}
        />
      );
    default:
      return null;
  }
}

function StepHeader({
  icon,
  title,
  subtitle,
}: Readonly<{ icon: ReactNode; title: string; subtitle: string }>) {
  return (
    <div className="flex flex-col items-start gap-2 md:items-center md:text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-primary-700 text-white">
        <span className="size-6" aria-hidden>
          {icon}
        </span>
      </span>
      <Typography as="h2" className="text-[22px] font-bold leading-snug text-primary-700">
        {title}
      </Typography>
      <Typography className="text-sm text-text-secondary">{subtitle}</Typography>
    </div>
  );
}

function DetailsStep({
  draft,
  updateDraft,
}: Readonly<{ draft: ChampionshipDraft; updateDraft: (updates: Partial<ChampionshipDraft>) => void }>) {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <StepHeader
        icon={<Trophy className="size-6" />}
        title="Tournament Details"
        subtitle="Give your new championship a name players will remember"
      />

      <Field id="championship-title" label="Tournament Title">
        <Input
          id="championship-title"
          value={draft.title}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="e.g. Crown of the Delta"
          maxLength={80}
        />
      </Field>

      <Field id="championship-description" label="Description">
        <Textarea
          id="championship-description"
          value={draft.description}
          onChange={(event) => updateDraft({ description: event.target.value })}
          placeholder="What makes this season epic?"
          rows={4}
          maxLength={500}
        />
      </Field>

      <Field id="championship-creator" label="Hosted By">
        <Input
          id="championship-creator"
          value={draft.creatorName}
          onChange={(event) => updateDraft({ creatorName: event.target.value })}
          placeholder="Your battle tag"
          maxLength={120}
        />
      </Field>
    </div>
  );
}

function SetupStep({
  draft,
  updateDraft,
  onStageCountChange,
}: Readonly<{
  draft: ChampionshipDraft;
  updateDraft: (updates: Partial<ChampionshipDraft>) => void;
  onStageCountChange: (count: number) => void;
}>) {
  return (
    <div className="flex flex-col gap-8">
      <StepHeader
        icon={<Settings2 className="size-6" />}
        title="Tournament Setup"
        subtitle="Pick the bracket size, entry fee, and escalating prize ladder"
      />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {STAGE_OPTIONS.map((option) => {
          const selected = draft.stageCount === option.count;
          return (
            <button
              key={option.count}
              type="button"
              onClick={() => onStageCountChange(option.count)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                selected
                  ? "border-primary-700 bg-primary-700 text-white shadow-md"
                  : "border-border-default bg-surface-default text-text-primary hover:border-primary-400",
              )}
            >
              <span className="text-sm font-bold">{option.title}</span>
              <span className={cn("text-xs", selected ? "text-white/80" : "text-text-secondary")}>
                {option.count} stages · {option.runs[0]} → {option.runs[option.runs.length - 1]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Typography as="h3" className="flex items-center gap-2 text-[15px] font-bold text-primary-700">
            <Flame className="size-4 text-primary-700" aria-hidden />
            Base Prize
          </Typography>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateDraft({ prizeBaseEtb: Math.max(1, draft.prizeBaseEtb - 1) })}
              aria-label="Decrease base prize"
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <div className="flex min-w-36 flex-col items-center rounded-xl border border-border-default bg-surface-default px-4 py-2.5">
              <span className="text-lg font-bold tabular-nums text-primary-700">
                {draft.prizeBaseEtb} ETB
              </span>
              <span className="text-[11px] text-text-secondary">base · per round</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => updateDraft({ prizeBaseEtb: Math.min(10_000, draft.prizeBaseEtb + 1) })}
              aria-label="Increase base prize"
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        <FeeSelector
          options={ENTRY_FEE_OPTIONS}
          value={draft.entryFee}
          customFee={draft.customFee}
          onChange={(fee, customFee) =>
            updateDraft({ entryFee: fee, customFee: customFee ?? draft.customFee })
          }
        />
      </div>

      <PrizePreview base={draft.prizeBaseEtb} count={draft.stageCount} />
    </div>
  );
}

function PrizePreview({ base, count }: Readonly<{ base: number; count: number }>) {
  const prizes = stagePrizes(base, count);
  const total = prizes.reduce((sum, prize) => sum + prize, 0);
  const option = STAGE_OPTIONS.find((stage) => stage.count === count) ?? STAGE_OPTIONS[1];

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border-default bg-surface-muted/60 p-5">
      <div className="flex items-center justify-between gap-3">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Prize Ladder · {option.title}
        </Typography>
        <Typography className="text-sm font-semibold tabular-nums text-primary-700">
          {total} ETB total
        </Typography>
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {option.runs.map((run, index) => (
          <li
            key={run}
            className="flex items-center justify-between gap-3 rounded-lg bg-surface-default px-3 py-2"
          >
            <span className="truncate text-sm font-medium text-text-primary">
              {index + 1}. {run}
            </span>
            <span className="shrink-0 text-sm font-bold tabular-nums text-primary-700">
              ETB {prizes[index]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ScheduleStep({
  draft,
  updateDraft,
}: Readonly<{ draft: ChampionshipDraft; updateDraft: (updates: Partial<ChampionshipDraft>) => void }>) {
  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        icon={<CalendarClock className="size-6" />}
        title="Tournament Schedule"
        subtitle="Launch round 1 instantly or schedule a kickoff time"
      />

      <TimingOptionGrid
        options={BATTLE_TIMINGS}
        selectedId={draft.timing}
        onSelect={(timing) =>
          updateDraft({ timing: timing as "instant" | "schedule" })
        }
      />

      {draft.timing === "schedule" && (
        <SchedulePicker
          date={draft.scheduleDate}
          time={draft.scheduleTime}
          timezone={draft.scheduleTimezone}
          onDateChange={(date) => updateDraft({ scheduleDate: date })}
          onTimeChange={(time) => updateDraft({ scheduleTime: time })}
          onTimezoneChange={(timezone) => updateDraft({ scheduleTimezone: timezone })}
          timezones={BATTLE_TIMEZONES}
        />
      )}

      <div className="flex items-start gap-2 rounded-xl border border-border-default bg-surface-muted/60 p-4">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden />
        <Typography className="text-sm text-text-secondary">
          Later stages unlock automatically one week after the previous round.
        </Typography>
      </div>
    </div>
  );
}

type StageQuestionMode = "auto" | "custom";

function resizeTo<T>(array: T[], size: number, create: () => T): T[] {
  const next = [...array];
  while (next.length < size) {
    next.push(create());
  }
  return next.slice(0, size);
}

function stageRunNames(count: number): string[] {
  return (STAGE_OPTIONS.find((option) => option.count === count) ?? STAGE_OPTIONS[1]).runs;
}

function stageLabel(count: number, index: number): string {
  return stageRunNames(count)[index] ?? `Stage ${index + 1}`;
}

function QuestionsStep({
  draft,
  stageModes,
  stageQuestions,
  onOpenStageBuilder,
}: Readonly<{
  draft: ChampionshipDraft;
  stageModes: StageQuestionMode[];
  stageQuestions: CodingQuestion[][];
  onOpenStageBuilder: (index: number) => void;
}>) {
  const runs = stageRunNames(draft.stageCount);

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        icon={<Braces className="size-6" />}
        title="Stage Questions"
        subtitle="Compile questions for each round, or let the auto pool fill the ladder"
      />

      <ul className="flex flex-col gap-3">
        {runs.map((run, index) => {
          const mode = stageModes[index] ?? "auto";
          const questions = stageQuestions[index] ?? [];
          const compiledCount = questions.filter((q) => q.title.trim().length > 0).length;

          return (
            <li
              key={run}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text-primary">
                  {index + 1}. {run}
                </p>
                <p className="text-xs text-text-secondary">
                  {mode === "custom"
                    ? compiledCount > 0
                      ? `${compiledCount} compiled question${compiledCount === 1 ? "" : "s"}`
                      : "Question builder open — compile at least one question"
                    : "Auto pool (curated battle)"}
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => onOpenStageBuilder(index)}>
                <Braces className="size-4" aria-hidden />
                {mode === "custom"
                  ? compiledCount > 0
                    ? "Edit questions"
                    : "Build questions"
                  : "Build questions"}
              </Button>
            </li>
          );
        })}
      </ul>

      <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 p-4">
        <Braces className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden />
        <Typography className="text-sm text-primary-800">
          Stages left on the auto pool stay instantly playable. Stages you compile are
          published as real battles with your authored questions.
        </Typography>
      </div>
    </div>
  );
}

function StageQuestionBuilder({
  stageLabel: label,
  stageIndex,
  initial,
  onBack,
  onDone,
}: Readonly<{
  stageLabel: string;
  stageIndex: number;
  initial: CodingQuestion[];
  onBack: () => void;
  onDone: (stageIndex: number, questions: CodingQuestion[]) => void;
}>) {
  const [questions, setQuestions] = useState<CodingQuestion[]>(initial);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    initial[initial.length - 1]?.id ?? null,
  );
  const [activeModule, setActiveModule] = useState<string>("code");

  const activeQuestion =
    questions.find((q) => q.id === activeQuestionId) ?? questions[questions.length - 1];

  const addQuestion = useCallback(() => {
    const question = createEmptyQuestion();
    setQuestions((prev) => (prev.length >= MAX_QUESTIONS ? prev : [...prev, question]));
    setActiveQuestionId(question.id);
  }, []);

  const updateQuestion = useCallback(
    (id: string, updates: Partial<CodingQuestion>) => {
      setQuestions((prev) =>
        prev.map((q) => (q.id === id ? { ...q, ...updates } : q)),
      );
    },
    [],
  );

  const removeQuestion = useCallback((id: string) => {
    setQuestions((prev) => {
      const next = prev.filter((q) => q.id !== id);
      setActiveQuestionId((current) =>
        current === id ? (next[next.length - 1]?.id ?? null) : current,
      );
      return next;
    });
  }, []);

  const selectModule = useCallback((moduleId: string) => {
    setActiveModule(moduleId);
  }, []);

  const finish = useCallback(() => {
    onDone(stageIndex, questions);
  }, [onDone, questions, stageIndex]);

  const active = activeQuestion ?? null;

  const renderActiveModule = () => {
    if (!active) return null;
    const kindLabel = QUESTION_KIND_LABELS[active.kind] ?? "question";

    switch (activeModule) {
      case "code":
        return active.kind === "coding" ? (
          <CodeEditorModule
            question={active}
            onChange={(updates) => updateQuestion(active.id, updates)}
            onRemove={() => removeQuestion(active.id)}
            languages={QUESTION_LANGUAGES}
          />
        ) : (
          <ModuleSwitchPrompt
            icon={<Code2 className="size-6" />}
            title={`This is a ${kindLabel} question`}
            description="The Code Editor module composes coding questions. Open the Question Builder module to author this question type."
            actionLabel="Open Question Builder"
            onAction={() => setActiveModule("question")}
          />
        );
      case "question":
        return active.kind === "coding" ? (
          <ModuleSwitchPrompt
            icon={<Braces className="size-6" />}
            title="Coding question detected"
            description="This question is authored in the Code Editor module with the LeetCode-style canvas (problem statement, constraints, code template, and test cases)."
            actionLabel="Open Code Editor"
            onAction={() => setActiveModule("code")}
          />
        ) : (
          <QuestionAuthoringEditor
            question={active}
            onChange={(updates) => updateQuestion(active.id, updates)}
            onRemove={() => removeQuestion(active.id)}
          />
        );
      case "markdown":
        return active.kind === "markdown" ? (
          <MarkdownPadModule
            question={active}
            onChange={(updates) => updateQuestion(active.id, updates)}
            onRemove={() => removeQuestion(active.id)}
          />
        ) : (
          <ModuleSwitchPrompt
            icon={<ScrollText className="size-6" />}
            title={`This is a ${kindLabel} question`}
            description="The Markdown Pad module composes markdown questions with a source editor and live participant preview."
            actionLabel="Convert to Markdown"
            onAction={() => {
              updateQuestion(active.id, { kind: "markdown" });
              setActiveModule("markdown");
            }}
          />
        );
      case "design":
        return active.kind === "design" ? (
          <DesignCanvasModule
            question={active}
            onChange={(updates) => updateQuestion(active.id, updates)}
            onRemove={() => removeQuestion(active.id)}
          />
        ) : (
          <ModuleSwitchPrompt
            icon={<Palette className="size-6" />}
            title={`This is a ${kindLabel} question`}
            description="The Design Canvas module composes visual challenge questions with a brief, deliverables, cover image and canvas spec."
            actionLabel="Convert to Design"
            onAction={() => {
              updateQuestion(active.id, { kind: "design" });
              setActiveModule("design");
            }}
          />
        );
      default:
        return null;
    }
  };

  const canFinish = active != null && questions.every((q) => q.title.trim().length > 0);

  if (!questions.length) {
    return (
      <CompetitionWorkspaceTemplate
        title="Question Builder"
        subtitle={`Compile questions for ${label}`}
        headerIcon={Braces}
        onBack={onBack}
        onPrevious={onBack}
        onNext={onBack}
      >
        <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 text-center">
          <Braces className="size-10 text-primary-600" aria-hidden />
          <Typography as="h3" className="text-lg font-semibold text-text-primary">
            Build the first question for {label}
          </Typography>
          <Typography className="max-w-sm text-sm text-text-secondary">
            Add a coding, quiz, markdown, or design question to compile into this stage.
          </Typography>
          <Button onClick={addQuestion}>
            <Plus className="size-4" aria-hidden />
            Add question
          </Button>
        </div>
      </CompetitionWorkspaceTemplate>
    );
  }

  return (
    <CompetitionWorkspaceTemplate
      title="Question Builder"
      subtitle={`Compile questions for ${label}`}
      headerIcon={Braces}
      onBack={onBack}
      onPrevious={onBack}
      onNext={finish}
      nextDisabled={!canFinish}
      canvasKey={active.id}
      leftRail={
        <ModuleRail modules={WORKSPACE_MODULES} activeId={activeModule} onSelect={selectModule} />
      }
      rightPanel={
        <ModuleSettingsPanel>
          <QuestionModuleSettings
            question={active}
            onChange={(updates) => updateQuestion(active.id, updates)}
          />
        </ModuleSettingsPanel>
      }
    >
      <div className="flex flex-col gap-3">
        <QuestionBuilderHeader
          currentIndex={questions.findIndex((q) => q.id === active.id)}
          total={questions.length}
          maxQuestions={MAX_QUESTIONS}
          activeId={active.id}
          questions={questions}
          onSelect={setActiveQuestionId}
          onAdd={addQuestion}
          onBack={onBack}
          onDone={finish}
        />
        <div className="flex flex-wrap items-center gap-3">
          <QuestionTabBar
            questions={questions}
            activeId={active.id}
            maxQuestions={MAX_QUESTIONS}
            onSelect={(id) => setActiveQuestionId(id)}
            onAdd={addQuestion}
          />
          <QuestionTypeMenu
            value={QUESTION_KIND_LABELS[active.kind] ?? "coding"}
            onSelect={(label) =>
              updateQuestion(active.id, {
                kind: QUESTION_TYPE_KINDS[label] ?? ("coding" as QuestionKind),
              })
            }
          />
        </div>
        {renderActiveModule()}
      </div>
    </CompetitionWorkspaceTemplate>
  );
}

function ReviewLaunchStep({
  draft,
  stageModes,
  stageQuestions,
  onEditStep,
}: Readonly<{
  draft: ChampionshipDraft;
  stageModes: StageQuestionMode[];
  stageQuestions: CodingQuestion[][];
  onEditStep: (step: number) => void;
}>) {
  const entryFee = entryFeeLabel(draft.entryFee, draft.customFee);
  const option = STAGE_OPTIONS.find((stage) => stage.count === draft.stageCount) ?? STAGE_OPTIONS[1];
  const prizes = stagePrizes(draft.prizeBaseEtb, draft.stageCount);
  const totalPrize = prizes.reduce((sum, prize) => sum + prize, 0);
  const scheduleText =
    draft.timing === "schedule"
      ? `${draft.scheduleDate} ${draft.scheduleTime} · ${draft.scheduleTimezone}`
      : "Starts instantly";

  const customCount = stageQuestions.reduce(
    (sum, questions) => sum + questions.filter((q) => q.title.trim().length > 0).length,
    0,
  );
  const customStages = stageModes.filter((mode) => mode === "custom").length;
  const poolText =
    customStages > 0
      ? `${customStages} stage${customStages === 1 ? "" : "s"} compiled · ${customCount} question${customCount === 1 ? "" : "s"}`
      : "Auto question pool";

  const rows: { label: string; value: string; step: number }[] = [
    { label: "Tournament", value: draft.title.trim() || "—", step: 1 },
    { label: "Hosted by", value: draft.creatorName.trim() || "You", step: 1 },
    { label: "Bracket", value: `${option.title} · ${option.count} stages`, step: 2 },
    { label: "Entry fee", value: entryFee, step: 2 },
    { label: "Prize pool", value: `${totalPrize} ETB (base ${draft.prizeBaseEtb} ETB)`, step: 2 },
    { label: "Question pool", value: poolText, step: 3 },
    { label: "Schedule", value: scheduleText, step: 4 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepHeader
        icon={<Rocket className="size-6" />}
        title="Review & Launch"
        subtitle="Double-check every detail before going live"
      />

      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
                {row.label}
              </p>
              <p className="truncate text-sm font-semibold text-text-primary">{row.value}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onEditStep(row.step)}>
              <PenLine className="size-4" aria-hidden />
              Edit
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 p-4">
        <Trophy className="mt-0.5 size-4 shrink-0 text-primary-700" aria-hidden />
        <Typography className="text-sm text-primary-800">
          Launching this tournament builds a fully playable season with every stage tied to a
          real battle — everyone resets to round one.
        </Typography>
      </div>
    </div>
  );
}

export default CreateChampionshipPage;