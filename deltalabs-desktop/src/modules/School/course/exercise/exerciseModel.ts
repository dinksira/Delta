import type {
  ExerciseMatchingItemDto,
  ExerciseOptionDto,
  ExerciseQuestionDto,
  ExerciseQuestionTypeDto,
  ExerciseQuestionVariantDto,
} from "@/modules/School/api";

export const EXERCISE_QUESTION_TYPE_OPTIONS: ReadonlyArray<{
  id: ExerciseQuestionTypeDto;
  label: string;
}> = [
  { id: "mcq", label: "Multiple Choice" },
  { id: "true_false", label: "True/False" },
  { id: "fill_blank", label: "Fill-in-the-Blanks" },
  { id: "matching", label: "Matching Questions" },
  { id: "writing", label: "Writing" },
  { id: "ordering", label: "Ordering/Sequencing" },
] as const;

export function newLocalId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
  }
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}`;
}

export function createEmptyVariant(name = "Variant 1"): ExerciseQuestionVariantDto {
  return {
    id: newLocalId("qv"),
    name,
    type: null,
    stemHtml: "",
    stemGhosted: false,
    options: [],
    matchingDescription: "",
    columnA: [],
    columnB: [],
    blanks: [],
    orderingItems: [],
    writingPrompt: "",
  };
}

export function createEmptyQuestion(order: number): ExerciseQuestionDto {
  const variant = createEmptyVariant("Variant 1");
  return {
    id: newLocalId("q"),
    order,
    activeVariantId: variant.id,
    variants: [variant],
  };
}

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export function createMcqOption(index: number): ExerciseOptionDto {
  return {
    id: newLocalId("opt"),
    label: optionLetter(index),
    text: "",
    isCorrect: false,
    ghosted: false,
    imageUrl: "",
  };
}

export function createMatchingItem(text = ""): ExerciseMatchingItemDto {
  return { id: newLocalId("mi"), text };
}

export function activeVariant(question: ExerciseQuestionDto): ExerciseQuestionVariantDto {
  return (
    question.variants.find((v) => v.id === question.activeVariantId) ??
    question.variants[0] ??
    createEmptyVariant()
  );
}

export function withActiveVariant(
  question: ExerciseQuestionDto,
  next: ExerciseQuestionVariantDto,
): ExerciseQuestionDto {
  const variants = question.variants.map((v) => (v.id === next.id ? next : v));
  const has = variants.some((v) => v.id === next.id);
  return {
    ...question,
    activeVariantId: next.id,
    variants: has ? variants : [...variants, next],
  };
}

export function questionTypeLabel(type: ExerciseQuestionTypeDto | null): string {
  if (!type) return "Question type";
  return EXERCISE_QUESTION_TYPE_OPTIONS.find((o) => o.id === type)?.label ?? "Question type";
}
