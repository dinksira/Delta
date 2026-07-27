/**
 * useCreateTopicBattle
 * State management for the 8-step Create Topic Battle wizard.
 */

import { useState, useCallback, useMemo } from 'react';
import { TopicBattleDraft, INITIAL_TOPIC_BATTLE_DRAFT, CodingQuestion, createEmptyQuestion } from '../types/topicBattleDraft';
import { createTopicBattle } from "@/modules/Competition/api";

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface UseCreateTopicBattleReturn {
  currentStep: number;
  draft: TopicBattleDraft;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoNext: boolean;

  // Navigation
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: number) => void;

  // Actions
  submitBattle: () => Promise<{ ok: boolean; message?: string }>;

  // Updates
  updateDraft: (updates: Partial<TopicBattleDraft>) => void;
  updateTopic: (topicId: string, name: string, category: string) => void;
  updateFormat: (formatId: string) => void;
  updateVisibility: (visibilityId: string, timing?: 'instant' | 'schedule') => void;
  updateEntrySetup: (slots: number, fee: number | 'Free' | 'Custom', customFee?: number) => void;
  updatePrizeDistribution: (distId: string, totalPool?: number) => void;
  updateSchedule: (date: string, time: string, timezone: string) => void;
  updateQuestionPool: (categories: string[], easy: number, medium: number, hard: number) => void;
  updateQuestionPoolMode: (mode: 'auto' | 'custom') => void;

  // Question management
  addQuestion: () => void;
  updateQuestion: (id: string, updates: Partial<CodingQuestion>) => void;
  removeQuestion: (id: string) => void;
  getCurrentQuestion: () => CodingQuestion | undefined;
  setActiveQuestionId: (id: string) => void;
  activeQuestionId: string;
}

// ============================================================================
// HOOK
// ============================================================================

export function useCreateTopicBattle(): UseCreateTopicBattleReturn {
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<TopicBattleDraft>(INITIAL_TOPIC_BATTLE_DRAFT);
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === 7;

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case 0: return !!draft.topic.id && !!draft.topic.name && !!draft.topic.category;
      case 1: return !!draft.format.id;
      case 2: return !!draft.visibility.id;
      case 3:
        if (!draft.entrySetup.slots || draft.entrySetup.slots < 2) return false;
        if (draft.entrySetup.fee === 'Custom') return !!draft.entrySetup.customFee && draft.entrySetup.customFee > 0;
        return !!draft.entrySetup.fee;
      case 4: return !!draft.prizeDistribution.id && draft.prizeDistribution.totalPool > 0;
      case 5:
        if (draft.visibility.timing === 'schedule') return !!draft.schedule.date && !!draft.schedule.time;
        return true;
      case 6: {
        if (draft.questionPool.mode === 'auto') return true;
        return draft.customQuestions.length > 0 && draft.customQuestions.every((q) => q.title.trim().length > 0);
      }
      case 7: return true;
      default: return true;
    }
  }, [currentStep, draft]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, 7));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const setStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, 7)));
  }, []);

  const updateDraft = useCallback((updates: Partial<TopicBattleDraft>) => {
    setDraft((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateTopic = useCallback((id: string, name: string, category: string) => {
    setDraft((prev) => ({ ...prev, topic: { id, name, category } }));
  }, []);

  const updateFormat = useCallback((id: string) => {
    setDraft((prev) => ({ ...prev, format: { id } }));
  }, []);

  const updateVisibility = useCallback((id: string, timing?: 'instant' | 'schedule') => {
    setDraft((prev) => ({
      ...prev,
      visibility: {
        id,
        timing: timing ?? prev.visibility.timing ?? 'instant',
      },
    }));
  }, []);

  const updateEntrySetup = useCallback((slots: number, fee: number | 'Free' | 'Custom', customFee?: number) => {
    setDraft((prev) => ({ ...prev, entrySetup: { slots, fee, customFee } }));
  }, []);

  const updatePrizeDistribution = useCallback((id: string, totalPool?: number) => {
    setDraft((prev) => ({
      ...prev,
      prizeDistribution: {
        id,
        totalPool: totalPool ?? prev.prizeDistribution.totalPool,
      },
    }));
  }, []);

  const updateSchedule = useCallback((date: string, time: string, timezone: string) => {
    setDraft((prev) => ({ ...prev, schedule: { date, time, timezone } }));
  }, []);

  const updateQuestionPool = useCallback((categories: string[], easy: number, medium: number, hard: number) => {
    setDraft((prev) => ({
      ...prev,
      questionPool: { ...prev.questionPool, selectedCategories: categories, easyPct: easy, mediumPct: medium, hardPct: hard },
    }));
  }, []);

  const updateQuestionPoolMode = useCallback((mode: 'auto' | 'custom') => {
    setDraft((prev) => ({
      ...prev,
      questionPool: { ...prev.questionPool, mode },
    }));
  }, []);

  // ========================================================================
  // Question management
  // ========================================================================

  const addQuestion = useCallback(() => {
    const q = createEmptyQuestion();
    setDraft((prev) => ({
      ...prev,
      customQuestions: [...prev.customQuestions, q],
    }));
    setActiveQuestionId(q.id);
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<CodingQuestion>) => {
    setDraft((prev) => ({
      ...prev,
      customQuestions: prev.customQuestions.map((q) =>
        q.id === id ? { ...q, ...updates } : q,
      ),
    }));
  }, []);

  const removeQuestion = useCallback((id: string) => {
    setDraft((prev) => {
      const filtered = prev.customQuestions.filter((q) => q.id !== id);
      const nextId = filtered.length > 0 ? filtered[filtered.length - 1].id : '';
      setActiveQuestionId(nextId);
      return { ...prev, customQuestions: filtered };
    });
  }, []);

  const getCurrentQuestion = useCallback((): CodingQuestion | undefined => {
    return draft.customQuestions.find((q) => q.id === activeQuestionId);
  }, [draft.customQuestions, activeQuestionId]);

  const submitBattle = useCallback(async () => {
    const entryFee = draft.entrySetup.fee === 'Free' ? 'Free' : draft.entrySetup.customFee ? `${draft.entrySetup.customFee} ETB` : `${draft.entrySetup.fee} ETB`;
    const prizePool = `${draft.prizeDistribution.totalPool} ETB`;

    const questions = draft.questionPool.mode === 'custom'
      ? draft.customQuestions.map((q) => ({
          title: q.title,
          description: q.description,
          codeTemplate: q.codeTemplate,
          language: q.language,
          difficulty: q.difficulty,
          timeLimitMinutes: q.timeLimitMinutes,
          points: q.points,
          hintEnabled: q.hintEnabled,
          hintText: q.hintText,
          testCases: q.testCases,
        }))
      : [];

    try {
      await createTopicBattle({
        title: draft.topic.name,
        subject: draft.topic.category,
        difficulty: 'Intermediate',
        entryFee,
        prizePool,
        playersMax: draft.entrySetup.slots,
        creatorName: 'You',
        scheduleDate: draft.schedule.date || undefined,
        scheduleTime: draft.schedule.time || undefined,
        scheduleTimezone: draft.schedule.timezone || undefined,
        questions,
      });
      return { ok: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create battle. Please try again.';
      return { ok: false, message };
    }
  }, [draft]);

  return {
    currentStep,
    draft,
    isFirstStep,
    isLastStep,
    canGoNext,
    nextStep,
    prevStep,
    setStep,
    submitBattle,
    updateDraft,
    updateTopic,
    updateFormat,
    updateVisibility,
    updateEntrySetup,
    updatePrizeDistribution,
    updateSchedule,
    updateQuestionPool,
    updateQuestionPoolMode,
    addQuestion,
    updateQuestion,
    removeQuestion,
    getCurrentQuestion,
    setActiveQuestionId,
    activeQuestionId,
  };
}
