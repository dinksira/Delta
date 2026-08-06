/**
 * CreateBattleTopicPage
 * View that renders the Create Topic Battle wizard. Renders step-specific
 * bodies inside the reusable CreateBattleWizardTemplate. Flow follows the
 * Step 1 redesign spec labels:
 *   Step 1 — Topic Selection
 *   Step 2 — Battle Format
 *   Step 3 — Match Type
 *   Step 4 — Player Setup
 *   Step 5 — Prize Rules
 *   Step 6 — Date & Time
 *   Step 7 — Questions (+ custom question builder sub-flow)
 *   Step 8 — Review & Launch
 */

"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  Brain,
  Braces,
  Briefcase,
  CalendarClock,
  Clapperboard,
  Clock,
  Code2,
  Cog,
  Cpu,
  Dna,
  FileText,
  FlaskConical,
  Folder,
  Globe2,
  HelpCircle,
  Landmark,
  Languages,
  Layers,
  Lightbulb,
  Medal,
  Palette,
  Pencil,
  Play,
  Plus,
  Rocket,
  Scale,
  ScrollText,
  Sigma,
  Swords,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { CreateBattleWizardTemplate } from "@/components/templates/CreateBattleWizardTemplate/CreateBattleWizardTemplate";
import { SearchPill } from "@/components/molecules/SearchPill/SearchPill";
import { SubjectPills } from "@/components/molecules/SubjectPills/SubjectPills";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import type { BattleTopic } from "@/components/molecules/BattleTopicCard";
import { BattleTopicGrid } from "@/components/organisms/BattleTopicGrid/BattleTopicGrid";
import { BattleFormatGrid } from "@/components/organisms/BattleFormatGrid/BattleFormatGrid";
import { MatchVisibilityGrid } from "@/components/organisms/MatchVisibilityGrid/MatchVisibilityGrid";
import { PrivateMatchSettings } from "@/components/organisms/PrivateMatchSettings/PrivateMatchSettings";
import { PrizeRuleGrid } from "@/components/organisms/PrizeRuleGrid/PrizeRuleGrid";
import { TimingOptionGrid } from "@/components/organisms/TimingOptionGrid/TimingOptionGrid";
import { PrizePoolCounter } from "@/components/molecules/PrizePoolCounter/PrizePoolCounter";
import { SlotsStepper } from "@/components/molecules/SlotsStepper/SlotsStepper";
import { FeeSelector } from "@/components/molecules/FeeSelector/FeeSelector";
import { SchedulePicker } from "@/components/organisms/SchedulePicker/SchedulePicker";
import { QuestionSourceGrid } from "@/components/organisms/QuestionSourceGrid/QuestionSourceGrid";
import { QuestionPreviewPanel } from "@/components/organisms/QuestionPreviewPanel/QuestionPreviewPanel";
import { QuestionAuthoringEditor } from "@/components/organisms/QuestionAuthoringEditor/QuestionAuthoringEditor";
import { QuestionBuilderEditor } from "@/components/organisms/QuestionBuilderEditor/QuestionBuilderEditor";
import { ModuleRail } from "@/components/organisms/ModuleRail/ModuleRail";
import { ModuleSettingsPanel } from "@/components/organisms/ModuleSettingsPanel/ModuleSettingsPanel";
import { QuestionTabBar } from "@/components/organisms/QuestionTabBar/QuestionTabBar";
import { QuestionTypeMenu } from "@/components/organisms/QuestionTypeMenu/QuestionTypeMenu";
import { QuestionModuleSettings } from "@/components/molecules/QuestionModuleSettings/QuestionModuleSettings";
import type { QuestionKind } from "@/modules/Competition/types/createBattle";
import { CompetitionWorkspaceTemplate } from "@/components/templates/CompetitionWorkspaceTemplate/CompetitionWorkspaceTemplate";
import { BattleCreatedModal } from "@/components/organisms/BattleCreatedModal/BattleCreatedModal";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import {
  CreateBattleWizardProvider,
  useCreateBattleWizard,
} from "@/modules/Competition/context";
import {
  BATTLE_FORMATS,
  BATTLE_TIMINGS,
  BATTLE_TIMEZONES,
  BATTLE_VISIBILITIES,
  CREATE_BATTLE_STEPS,
  CREATE_BATTLE_TOTAL_STEPS,
  ENTRY_FEE_OPTIONS,
  PRIZE_RULES,
  QUESTION_SOURCES,
  TOPIC_CATALOG,
  getSampleCategories,
} from "@/modules/Competition/data";

const ALL_FILTER = "All";

/** How many topic cards are shown before "See More" expands the grid (spec: 2 rows × 4 cols). */
const TOPICS_PER_PAGE = 8;

/** Cap on custom questions a host can build (mirrors desktop totalQuestions=50). */
const MAX_QUESTIONS = 50;

/** Modules surfaced in the Competition Workspace rail. Only "question" is wired today. */
const WORKSPACE_MODULES = [
  { id: "code", label: "Code Editor", icon: Code2 },
  { id: "question", label: "Question Builder", icon: Braces },
  { id: "markdown", label: "Markdown Pad", icon: ScrollText },
  { id: "design", label: "Design Canvas", icon: Palette },
] as const;

/** Trending Topics filter pills from the Step 1 spec. */
const TRENDING_SUBJECTS: { value: string; label: string }[] = [
  { value: ALL_FILTER, label: "All Subjects" },
  { value: "Mathematics", label: "Mathematics" },
  { value: "Physics", label: "Physics" },
  { value: "Chemistry", label: "Chemistry" },
  { value: "History", label: "History" },
  { value: "Biology", label: "Biology" },
];

/** Physics-flavored Science topics (spec pill "Physics"). */
const PHYSICS_KEYWORDS = [
  "quantum", "relativity", "physic", "thermo", "electro", "optics",
  "wave", "mechanics", "nuclear", "particle", "astron",
];

/** Chemistry-flavored Science topics (spec pill "Chemistry"). */
const CHEMISTRY_KEYWORDS = [
  "chem", "periodic", "reaction", "stoichiometry", "organic",
  "inorganic", "molecule", "acid", "base",
];

/** Per-category subject icon rendered inside each topic card's icon chip. */
const TOPIC_SUBJECT_ICONS: Record<string, ReactNode> = {
  Science: <FlaskConical className="size-6" />,
  "Biology & Medicine": <Dna className="size-6" />,
  History: <Landmark className="size-6" />,
  Math: <Sigma className="size-6" />,
  Geography: <Globe2 className="size-6" />,
  Tech: <Cpu className="size-6" />,
  Programming: <Code2 className="size-6" />,
  Literature: <BookOpen className="size-6" />,
  "Art & Music": <Palette className="size-6" />,
  Sports: <Medal className="size-6" />,
  "Business & Economics": <Briefcase className="size-6" />,
  "Psychology & Philosophy": <Brain className="size-6" />,
  Engineering: <Cog className="size-6" />,
  Languages: <Languages className="size-6" />,
  "General Knowledge": <Lightbulb className="size-6" />,
  Entertainment: <Clapperboard className="size-6" />,
  "Law & Politics": <Scale className="size-6" />,
  "Religion & Mythology": <ScrollText className="size-6" />,
};

/** Deterministic pseudo question count per topic so every card shows "N Questions". */
function topicQuestionCount(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return 1800 + (hash % 4500);
}

function matchesSubjectFilter(topic: BattleTopic, value: string): boolean {
  const name = topic.name.toLowerCase();
  switch (value) {
    case ALL_FILTER:
      return true;
    case "Mathematics":
      return topic.category === "Math";
    case "History":
      return topic.category === "History";
    case "Biology":
      return topic.category === "Biology & Medicine";
    case "Physics":
      return topic.category === "Science" && PHYSICS_KEYWORDS.some((k) => name.includes(k));
    case "Chemistry":
      return topic.category === "Science" && CHEMISTRY_KEYWORDS.some((k) => name.includes(k));
    default:
      return true;
  }
}

const FORMAT_LIMITS: Record<
  string,
  { min: number; max: number; title: string; description: string }
> = {
  "1v1": {
    min: 2,
    max: 2,
    title: "Format: 1 VS 1 Duel",
    description: "This format supports up to 2 players maximum",
  },
  mini: {
    min: 4,
    max: 4,
    title: "Format: Mini Tournament",
    description: "This format supports up to 4 players maximum",
  },
  t8: {
    min: 8,
    max: 8,
    title: "Format: Tournament (8 Players)",
    description: "This format supports up to 8 players maximum",
  },
  t16: {
    min: 16,
    max: 16,
    title: "Format: Tournament (16 Players)",
    description: "This format supports up to 16 players maximum",
  },
  t32: {
    min: 32,
    max: 32,
    title: "Format: Tournament (32 Players)",
    description: "This format supports up to 32 players maximum",
  },
};

const QUESTION_LANGUAGES = [
  "HTML", "CSS", "JavaScript", "TypeScript", "Python", "Java", "C++",
  "C#", "Go", "Rust", "SQL", "PHP",
];

export function CreateBattleTopicPage() {
  return (
    <CreateBattleWizardProvider>
      <CreateBattleTopicWizard />
    </CreateBattleWizardProvider>
  );
}

function CreateBattleTopicWizard() {
  const router = useRouter();
  const {
    currentStep,
    draft,
    goNext,
    goPrevious,
    canGoNext,
    isLastStep,
    submitBattle,
    selectTopic,
  } = useCreateBattleWizard();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);

  // Step 1 (topic selection) flow state — mirrors desktop CreateTopicBattlePage.
  const [seeMore, setSeeMore] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTopicIdsMap, setSelectedTopicIdsMap] = useState<Map<string, BattleTopic>>(
    new Map(),
  );

  const handleBack = useCallback(() => {
    router.push("/features/competitions/topic-battles");
  }, [router]);

  const handleToggleMultiSelectMode = useCallback(() => {
    if (isMultiSelectMode) {
      setSelectedTopicIdsMap(new Map());
      selectTopic("", "", "", "");
    }
    setIsMultiSelectMode((prev) => !prev);
  }, [isMultiSelectMode, selectTopic]);

  const handleToggleMultiSelectTopic = useCallback(
    (topicId: string) => {
      setSelectedTopicIdsMap((prev) => {
        const next = new Map(prev);
        const topic = TOPIC_CATALOG.find((t) => t.id === topicId);
        if (!topic) return prev;
        if (next.has(topicId)) {
          next.delete(topicId);
        } else {
          next.set(topicId, topic);
        }
        if (next.size >= 1) {
          const selectedArr = Array.from(next.values());
          const mergedId = `custom-mixed--${selectedArr.map((t) => t.id).join("__")}`;
          const mergedName =
            selectedArr.length === 1
              ? selectedArr[0].name
              : `${selectedArr[0].name} +${selectedArr.length - 1} Mixed`;
          const mergedCategory =
            selectedArr.length === 1 ? selectedArr[0].category : "Mixed Topics";
          const mergedDifficulty = selectedArr.length === 1 ? selectedArr[0].difficulty : "Mixed";
          selectTopic(mergedId, mergedName, mergedCategory, mergedDifficulty);
        } else {
          selectTopic("", "", "", "");
        }
        return next;
      });
    },
    [selectTopic],
  );

  const handleClearMultiSelect = useCallback(() => {
    setSelectedTopicIdsMap(new Map());
    selectTopic("", "", "", "");
  }, [selectTopic]);

  const selectedTopicIds = useMemo(
    () => Array.from(selectedTopicIdsMap.keys()),
    [selectedTopicIdsMap],
  );

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await submitBattle();
    setIsSubmitting(false);
    if (result.ok) {
      setShowCreatedModal(true);
    } else {
      setSubmitError(result.message ?? "Failed to create battle. Please try again.");
    }
  }, [submitBattle]);

  const battleDetails = useMemo(() => {
    const fee = draft.entrySetup.fee;
    const prizePool =
      fee === "Free"
        ? "0 ETB"
        : `${(fee === "Custom" ? (draft.entrySetup.customFee || 0) : Number(fee)) * draft.entrySetup.slots} ETB`;
    const format = BATTLE_FORMATS.find((f) => f.id === draft.format.id);
    return {
      title: draft.topic.name || "Your",
      format: format?.title ?? draft.format.id,
      entryFee: fee === "Free" ? "Free" : `${fee} ETB`,
      prizePool,
      date: draft.schedule.date ? `${draft.schedule.date} ${draft.schedule.time}` : "Now",
    };
  }, [draft]);

  const builderOpen = showQuestionBuilder && currentStep === 7;

  if (builderOpen) {
    return <QuestionBuilderStep onBack={() => setShowQuestionBuilder(false)} />;
  }

  return (
    <>
      <CreateBattleWizardTemplate
        title="Create Topic Battle"
        currentStep={currentStep}
        totalSteps={CREATE_BATTLE_TOTAL_STEPS}
        steps={CREATE_BATTLE_STEPS}
        onBack={handleBack}
        onPrevious={goPrevious}
        previousDisabled={currentStep <= 1 || isSubmitting}
        onNext={isLastStep ? handleSubmit : goNext}
        nextDisabled={!canGoNext || isSubmitting}
        nextLabel={
          isLastStep ? (isSubmitting ? "Launching…" : "Launch Battle") : "Next"
        }
        submitError={submitError}
      >
        <StepContent
          currentStep={currentStep}
          onOpenQuestionBuilder={() => setShowQuestionBuilder(true)}
          isMultiSelectMode={isMultiSelectMode}
          selectedTopicIds={selectedTopicIds}
          seeMore={seeMore}
          onSeeMoreChange={setSeeMore}
          onToggleMultiSelectMode={handleToggleMultiSelectMode}
          onClearMultiSelect={handleClearMultiSelect}
          onToggleMultiSelectTopic={handleToggleMultiSelectTopic}
        />
      </CreateBattleWizardTemplate>

      <BattleCreatedModal
        isOpen={showCreatedModal}
        onClose={() => setShowCreatedModal(false)}
        onManageBattle={() => {
          setShowCreatedModal(false);
          handleBack();
        }}
        battleDetails={battleDetails}
      />
    </>
  );
}

interface StepContentProps {
  currentStep: number;
  onOpenQuestionBuilder: () => void;
  isMultiSelectMode: boolean;
  selectedTopicIds: string[];
  seeMore: boolean;
  onSeeMoreChange: (value: boolean) => void;
  onToggleMultiSelectMode: () => void;
  onClearMultiSelect: () => void;
  onToggleMultiSelectTopic: (topicId: string) => void;
}

function StepContent({
  currentStep,
  onOpenQuestionBuilder,
  isMultiSelectMode,
  selectedTopicIds,
  seeMore,
  onSeeMoreChange,
  onToggleMultiSelectMode,
  onClearMultiSelect,
  onToggleMultiSelectTopic,
}: StepContentProps) {
  switch (currentStep) {
    case 1:
      return (
        <TopicSelectionStep
          isMultiSelectMode={isMultiSelectMode}
          selectedTopicIds={selectedTopicIds}
          seeMore={seeMore}
          onSeeMoreChange={onSeeMoreChange}
          onToggleMultiSelectMode={onToggleMultiSelectMode}
          onClearMultiSelect={onClearMultiSelect}
          onToggleMultiSelectTopic={onToggleMultiSelectTopic}
        />
      );
    case 2:
      return <BattleFormatStep />;
    case 3:
      return <MatchVisibilityStep />;
    case 4:
      return <PlayerEntrySetupStep />;
    case 5:
      return <PrizeRulesStep />;
    case 6:
      return <ScheduleStep />;
    case 7:
      return <QuestionPoolStep onOpenQuestionBuilder={onOpenQuestionBuilder} />;
    case 8:
      return <ReviewLaunchStep />;
    default:
      return null;
  }
}

function StepSectionHeader({
  icon,
  title,
  subtitle,
  trailing,
}: Readonly<{
  icon: ReactNode;
  title: string;
  subtitle: string;
  trailing?: ReactNode;
}>) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
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
      {trailing}
    </div>
  );
}

// ============================================================================
// STEP 1 — TOPIC SELECTION
// ============================================================================

interface TopicSelectionStepProps {
  isMultiSelectMode: boolean;
  selectedTopicIds: string[];
  seeMore: boolean;
  onSeeMoreChange: (value: boolean) => void;
  onToggleMultiSelectMode: () => void;
  onClearMultiSelect: () => void;
  onToggleMultiSelectTopic: (topicId: string) => void;
}

function TopicSelectionStep({
  isMultiSelectMode,
  selectedTopicIds,
  seeMore,
  onSeeMoreChange,
  onToggleMultiSelectMode,
  onClearMultiSelect,
  onToggleMultiSelectTopic,
}: TopicSelectionStepProps) {
  const { searchQuery, filter, draft, selectTopic, setSearchQuery, setFilter } =
    useCreateBattleWizard();

  const trendingSubjects = useMemo<SubjectPill[]>(() => {
    return TRENDING_SUBJECTS.map((subject) => ({
      value: subject.value,
      label: subject.label,
      count: TOPIC_CATALOG.filter((topic) => matchesSubjectFilter(topic, subject.value)).length,
    }));
  }, []);

  const filteredTopics = useMemo(() => {
    const queryText = searchQuery.trim().toLowerCase();
    return TOPIC_CATALOG.filter((topic) => {
      const matchesSearch =
        !queryText || topic.name.toLowerCase().includes(queryText);
      const matchesFilter = matchesSubjectFilter(topic, filter);
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filter]);

  const visibleTopics = useMemo(() => {
    const base = seeMore ? filteredTopics : filteredTopics.slice(0, TOPICS_PER_PAGE);
    return base.map((topic) => ({
      ...topic,
      icon: TOPIC_SUBJECT_ICONS[topic.category],
      questionCount: topicQuestionCount(topic.id),
    }));
  }, [filteredTopics, seeMore]);

  const selectedCount = selectedTopicIds.length;

  return (
    <>
      <StepSectionHeader
        icon={<Folder />}
        title="Choose Your Battle Topic"
        subtitle="Pick a subject that will challenge your opponents"
        trailing={
          <SearchPill
            value={searchQuery}
            onChange={(query) => {
              setSearchQuery(query);
              onSeeMoreChange(false);
            }}
            placeholder="Search..."
            size="sm"
            className="w-full max-w-xs md:w-64"
          />
        }
      />

      <div className="flex flex-col gap-2">
        <Typography as="h3" className="text-[13px] font-semibold text-primary-700">
          Trending Topics
        </Typography>
        <SubjectPills
          subjects={trendingSubjects}
          activeValue={filter}
          onChange={(value) => {
            setFilter(value);
            onSeeMoreChange(false);
          }}
          showCount={false}
          density="compact"
          ariaLabel="Filter by trending subject"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={isMultiSelectMode ? "primary" : "secondary"}
            size="sm"
            onClick={onToggleMultiSelectMode}
          >
            <Layers className="size-4" aria-hidden />
            {isMultiSelectMode ? "Exit multi-select" : "Multi-select topics"}
          </Button>
          {isMultiSelectMode && (
            <Button variant="ghost" size="sm" onClick={onClearMultiSelect}>
              <X className="size-4" aria-hidden />
              Clear
            </Button>
          )}
        </div>

        {isMultiSelectMode && (
          <Typography className="text-sm text-text-secondary">
            {selectedCount === 0
              ? "Pick multiple topics to combine them into a mixed battle"
              : `${selectedCount} selected · ${draft.topic.name}`}
          </Typography>
        )}
      </div>

      <BattleTopicGrid
        topics={visibleTopics}
        selectedId={draft.topic.id}
        selectedTopicIds={selectedTopicIds}
        multiSelect={isMultiSelectMode}
        onSelect={(id) => {
          if (isMultiSelectMode) {
            onToggleMultiSelectTopic(id);
          } else {
            const topic = TOPIC_CATALOG.find((t) => t.id === id);
            if (topic) selectTopic(topic.id, topic.name, topic.category, topic.difficulty);
          }
        }}
      />

      {filteredTopics.length > TOPICS_PER_PAGE && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSeeMoreChange(!seeMore)}
          >
            {seeMore ? "Show Less" : `See More Topics (${filteredTopics.length})`}
          </Button>
        </div>
      )}
    </>
  );
}

// ============================================================================
// STEP 2 — BATTLE FORMAT
// ============================================================================

function BattleFormatStep() {
  const { draft, selectFormat } = useCreateBattleWizard();

  return (
    <>
      <StepSectionHeader
        icon={<Swords />}
        title="Choose Battle Format"
        subtitle="Select the competition style that matches your vibe"
      />

      <BattleFormatGrid
        formats={BATTLE_FORMATS}
        selectedId={draft.format.id}
        onSelect={selectFormat}
      />
    </>
  );
}

// ============================================================================
// STEP 3 — MATCH VISIBILITY
// ============================================================================

function MatchVisibilityStep() {
  const { draft, selectVisibility } = useCreateBattleWizard();

  return (
    <>
      <StepSectionHeader
        icon={<Globe2 />}
        title="Match Visibility"
        subtitle="Choose who can join your epic battle"
      />

      <div className="flex flex-col">
        <MatchVisibilityGrid
          options={BATTLE_VISIBILITIES}
          selectedId={draft.visibility.id}
          onSelect={(id) => selectVisibility(id, draft.visibility.timing)}
        />

        <PrivateMatchSettings open={draft.visibility.id === "private"} />

        <div className="mt-8 flex flex-col gap-3">
          <Typography as="h3" className="flex items-center gap-2 text-[15px] font-bold text-primary-700">
            <Clock className="size-4 text-primary-700" aria-hidden />
            When to start Battle
          </Typography>

          <TimingOptionGrid
            options={BATTLE_TIMINGS}
            selectedId={draft.visibility.timing}
            onSelect={(timing) =>
              selectVisibility(draft.visibility.id, timing as "instant" | "schedule")
            }
          />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// STEP 4 — PLAYER & ENTRY
// ============================================================================

function PlayerEntrySetupStep() {
  const { draft, updateEntrySetup } = useCreateBattleWizard();
  const limits = FORMAT_LIMITS[draft.format.id] ?? FORMAT_LIMITS["1v1"];

  useEffect(() => {
    const clamped = Math.min(limits.max, Math.max(limits.min, draft.entrySetup.slots));
    if (clamped !== draft.entrySetup.slots) {
      updateEntrySetup(clamped, draft.entrySetup.fee, draft.entrySetup.customFee);
    }
    // Only re-clamp when the selected format changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.format.id]);

  return (
    <>
      <StepSectionHeader
        icon={<Users />}
        title="Player & Entry Setup"
        subtitle="Configure slots and entry fees for your battle"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SlotsStepper
          value={draft.entrySetup.slots}
          min={limits.min}
          max={limits.max}
          onChange={(slots) =>
            updateEntrySetup(slots, draft.entrySetup.fee, draft.entrySetup.customFee)
          }
          formatTitle={limits.title}
          formatDescription={limits.description}
        />

        <FeeSelector
          options={ENTRY_FEE_OPTIONS}
          value={draft.entrySetup.fee}
          customFee={draft.entrySetup.customFee}
          onChange={(fee, customFee) =>
            updateEntrySetup(draft.entrySetup.slots, fee, customFee)
          }
        />
      </div>
    </>
  );
}

// ============================================================================
// STEP 5 — PRIZE RULES
// ============================================================================

function PrizeRulesStep() {
  const { draft, updatePrizeDistribution } = useCreateBattleWizard();

  return (
    <>
      <StepSectionHeader
        icon={<Trophy />}
        title="Prize Distribution Rules"
        subtitle="Choose how winners will split the prize pool"
      />

      <div className="flex flex-col gap-6">
        <PrizePoolCounter
          value={draft.prizeDistribution.totalPool}
          onChange={(totalPool) => updatePrizeDistribution(draft.prizeDistribution.id, totalPool)}
        />

        <PrizeRuleGrid
          rules={PRIZE_RULES}
          selectedId={draft.prizeDistribution.id}
          onSelect={(id) => updatePrizeDistribution(id)}
        />
      </div>
    </>
  );
}

// ============================================================================
// STEP 6 — SCHEDULE
// ============================================================================

function ScheduleStep() {
  const { draft, updateSchedule } = useCreateBattleWizard();
  const isInstant = draft.visibility.timing === "instant";

  return (
    <>
      <StepSectionHeader
        icon={<CalendarClock />}
        title="Schedule Your Battle"
        subtitle="Choose when your epic battle begins"
      />

      <div className="flex flex-col gap-6">
        {isInstant && (
          <div className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-muted px-4 py-3 text-sm text-text-secondary">
            <Rocket className="size-4 shrink-0 text-primary-600" aria-hidden />
            Battle starts instantly. Switch to “Schedule Later” in Match
            Type to use this date and time.
          </div>
        )}

        <SchedulePicker
          date={draft.schedule.date}
          time={draft.schedule.time}
          timezone={draft.schedule.timezone}
          onDateChange={(date) => updateSchedule(date, draft.schedule.time, draft.schedule.timezone)}
          onTimeChange={(time) => updateSchedule(draft.schedule.date, time, draft.schedule.timezone)}
          onTimezoneChange={(timezone) =>
            updateSchedule(draft.schedule.date, draft.schedule.time, timezone)
          }
          timezones={BATTLE_TIMEZONES}
        />
      </div>
    </>
  );
}

// ============================================================================
// STEP 7 — QUESTION POOL (+ QUESTION BUILDER)
// ============================================================================

function QuestionPoolStep({
  onOpenQuestionBuilder,
}: Readonly<{ onOpenQuestionBuilder: () => void }>) {
  const {
    draft,
    updateQuestionPoolMode,
    addQuestion,
    setActiveQuestionId,
  } = useCreateBattleWizard();
  const { questionPool, customQuestions } = draft;
  const mode = questionPool.mode;

  const openCustomQuestions = () => {
    if (customQuestions.length === 0) addQuestion();
    const last = customQuestions[customQuestions.length - 1];
    if (last) setActiveQuestionId(last.id);
    onOpenQuestionBuilder();
  };

  return (
    <>
      <StepSectionHeader
        icon={<HelpCircle />}
        title="Question Pool Setup"
        subtitle="Choose how questions will be selected for your battle"
      />

      <div className="flex flex-col gap-6">
        <QuestionSourceGrid
          options={QUESTION_SOURCES}
          selectedId={mode}
          onSelect={(id) => updateQuestionPoolMode(id as "auto" | "custom")}
        />

        {mode === "auto" ? (
          <QuestionPreviewPanel
            topicCategory={draft.topic.category || draft.topic.name || "your topic"}
            easyPct={questionPool.easyPct}
            mediumPct={questionPool.mediumPct}
            hardPct={questionPool.hardPct}
            sampleCategories={getSampleCategories(draft.topic.category)}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-primary-600" aria-hidden />
              <Typography as="h3" className="text-sm font-bold text-primary-700">
                Your Custom Questions
              </Typography>
            </div>

            {customQuestions.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-default bg-surface-muted px-6 py-12 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-primary-700 text-white">
                  <HelpCircle className="size-6" aria-hidden />
                </span>
                <Typography className="text-base font-semibold text-text-primary">
                  No custom questions yet
                </Typography>
                <Typography className="max-w-sm text-sm text-text-secondary">
                  Add your first question to get started
                </Typography>
                <Button className="mt-2 gap-1.5" onClick={openCustomQuestions}>
                  <Plus className="size-4" aria-hidden />
                  Create First Question
                </Button>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {customQuestions.map((question) => (
                  <li
                    key={question.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {question.title.trim() || "Untitled question"}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {question.difficulty} · {question.points} pts ·{" "}
                        {QUESTION_KIND_LABELS[question.kind] ?? question.language}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveQuestionId(question.id);
                        onOpenQuestionBuilder();
                      }}
                    >
                      <Pencil className="size-4" aria-hidden />
                      Edit
                    </Button>
                  </li>
                ))}
                <li>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full justify-center gap-1.5"
                    onClick={openCustomQuestions}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add question
                  </Button>
                </li>
              </ul>
            )}
          </div>
        )}
      </div>
    </>
  );
}

const QUESTION_TYPE_KINDS: Record<string, QuestionKind> = {
  "Multiple Choice": "multiple_choice",
  "True / False": "true_false",
  "Fill-in-the-Blanks": "fill_blank",
  "Matching": "matching",
  "Writing / Essay": "writing",
  "Ordering / Sequencing": "ordering",
};

const QUESTION_KIND_LABELS: Record<QuestionKind, string | undefined> = {
  coding: undefined,
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  fill_blank: "Fill-in-the-Blanks",
  matching: "Matching",
  writing: "Writing / Essay",
  ordering: "Ordering / Sequencing",
};

function QuestionBuilderStep({ onBack }: Readonly<{ onBack: () => void }>) {
  const {
    draft,
    activeQuestionId,
    addQuestion,
    updateQuestion,
    removeQuestion,
    setActiveQuestionId,
    goNext,
    canGoNext,
  } = useCreateBattleWizard();
  const { customQuestions } = draft;
  const [activeModule, setActiveModule] = useState("question");

  const activeQuestion =
    customQuestions.find((q) => q.id === activeQuestionId) ??
    customQuestions[customQuestions.length - 1];

  const advanceToReview = () => {
    onBack();
    goNext();
  };

  if (!activeQuestion) {
    return (
      <CompetitionWorkspaceTemplate
        title="Question Builder"
        subtitle="Competition Workspace"
        headerIcon={Braces}
        onBack={onBack}
        onPrevious={onBack}
        onNext={onBack}
        leftRail={
          <ModuleRail
            modules={WORKSPACE_MODULES}
            activeId={activeModule}
            onSelect={setActiveModule}
          />
        }
        rightPanel={
          <ModuleSettingsPanel>
            <Typography className="text-sm text-text-secondary">
              Add a question to edit its module settings.
            </Typography>
          </ModuleSettingsPanel>
        }
      >
        <div className="flex h-full min-h-[24rem] flex-col items-center justify-center gap-4 text-center">
          <Braces className="size-10 text-primary-600" aria-hidden />
          <Typography as="h3" className="text-lg font-semibold text-text-primary">
            Build your first question
          </Typography>
          <Typography className="max-w-sm text-sm text-text-secondary">
            Add a coding question to include in this battle.
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
      subtitle="Competition Workspace"
      headerIcon={Braces}
      onBack={onBack}
      onPrevious={onBack}
      onNext={advanceToReview}
      nextDisabled={!canGoNext}
      secondaryActions={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={onBack}>
            <Pencil className="size-4" aria-hidden />
            Draft
          </Button>
          <Button variant="secondary" size="sm" onClick={advanceToReview}>
            <Play className="size-4" aria-hidden />
            Preview
          </Button>
        </div>
      }
      leftRail={
        <ModuleRail
          modules={WORKSPACE_MODULES}
          activeId={activeModule}
          onSelect={setActiveModule}
        />
      }
      rightPanel={
        <ModuleSettingsPanel>
          <QuestionModuleSettings
            question={activeQuestion}
            onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
          />
        </ModuleSettingsPanel>
      }
    >
      {activeModule === "question" ? (
        <div className="flex h-full flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <QuestionTabBar
              questions={customQuestions}
              activeId={activeQuestion.id}
              maxQuestions={MAX_QUESTIONS}
              onSelect={(id) => setActiveQuestionId(id)}
              onAdd={addQuestion}
            />
            <QuestionTypeMenu
              value={QUESTION_KIND_LABELS[activeQuestion.kind]}
              onSelect={(label) =>
                updateQuestion(activeQuestion.id, {
                  kind: QUESTION_TYPE_KINDS[label] ?? "coding",
                })
              }
            />
          </div>

          {activeQuestion.kind === "coding" ? (
            <QuestionBuilderEditor
              question={activeQuestion}
              onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
              onRemove={() => {
                removeQuestion(activeQuestion.id);
                if (customQuestions.length === 1) onBack();
              }}
              languages={QUESTION_LANGUAGES}
            />
          ) : (
            <QuestionAuthoringEditor
              question={activeQuestion}
              onChange={(updates) => updateQuestion(activeQuestion.id, updates)}
              onRemove={() => {
                removeQuestion(activeQuestion.id);
                if (customQuestions.length === 1) onBack();
              }}
            />
          )}
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-surface-muted">
            <Layers className="size-6 text-primary-600" aria-hidden />
          </div>
          <Typography as="h3" className="text-lg font-semibold text-text-primary">
            Module coming soon
          </Typography>
          <Typography className="max-w-sm text-sm text-text-secondary">
            Select the Question Builder module to compose this battle&apos;s
            questions.
          </Typography>
        </div>
      )}
    </CompetitionWorkspaceTemplate>
  );
}

// ============================================================================
// STEP 8 — REVIEW & LAUNCH
// ============================================================================

function ReviewLaunchStep() {
  const { draft, goToStep } = useCreateBattleWizard();

  const format = BATTLE_FORMATS.find((f) => f.id === draft.format.id);
  const visibility = BATTLE_VISIBILITIES.find((v) => v.id === draft.visibility.id);
  const prizeRule = PRIZE_RULES.find((r) => r.id === draft.prizeDistribution.id);

  const feeText =
    draft.entrySetup.fee === "Free"
      ? "Free"
      : draft.entrySetup.fee === "Custom"
        ? `${draft.entrySetup.customFee ?? 0} ETB`
        : `${draft.entrySetup.fee} ETB`;

  const scheduleText =
    draft.visibility.timing === "schedule" && draft.schedule.date
      ? `${draft.schedule.date} ${draft.schedule.time} · ${draft.schedule.timezone}`
      : "Starts instantly";

  const poolText =
    draft.questionPool.mode === "auto"
      ? `Auto · ${draft.questionPool.easyPct}/${draft.questionPool.mediumPct}/${draft.questionPool.hardPct}`
      : `Custom · ${draft.customQuestions.length} question${draft.customQuestions.length === 1 ? "" : "s"}`;

  const rows: { label: string; value: string; step: number }[] = [
    {
      label: "Topic",
      value: draft.topic.name
        ? `${draft.topic.name}${draft.topic.difficulty ? ` · ${draft.topic.difficulty}` : ""}`
        : "Not selected",
      step: 1,
    },
    { label: "Format", value: format?.title ?? draft.format.id, step: 2 },
    {
      label: "Visibility",
      value: `${visibility?.title ?? draft.visibility.id} · ${
        draft.visibility.timing === "schedule" ? "Scheduled" : "Instant"
      }`,
      step: 3,
    },
    { label: "Players", value: `${draft.entrySetup.slots}`, step: 4 },
    { label: "Entry fee", value: feeText, step: 4 },
    {
      label: "Prize pool",
      value: `${draft.prizeDistribution.totalPool} ETB · ${prizeRule?.title ?? ""}`,
      step: 5,
    },
    { label: "Schedule", value: scheduleText, step: 6 },
    { label: "Question pool", value: poolText, step: 7 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <StepSectionHeader
        icon={<Rocket />}
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
            <Button variant="ghost" size="sm" onClick={() => goToStep(row.step)}>
              <Pencil className="size-4" aria-hidden />
              Edit
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default CreateBattleTopicPage;
