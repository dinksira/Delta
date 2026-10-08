/**
 * QuizBattleTemplate — full duel quiz screen layout for a topic battle.
 * Composes the header, metrics strip, question card, and leaderboard sidebar
 * into a responsive two-column layout. Switches to the results panel when the
 * duel is finished.
 *
 * @example
 * ```tsx
 * <QuizBattleTemplate
 *   quiz={quiz}
 *   state={state}
 *   timeLeft="03:24"
 *   onSelect={selectAnswer}
 *   onAdvance={advance}
 *   onPlayAgain={reset}
 *   onExit={exit}
 * />
 * ```
 */

import { useMemo } from "react";

import { Button } from "@/components/theme/Button";
import { LeaderboardPanel } from "@/components/organisms/LeaderboardPanel";
import { QuizBattleHeader } from "@/components/organisms/QuizBattleHeader";
import { QuizMetricsRow } from "@/components/organisms/QuizMetricsRow";
import { QuizQuestionCard } from "@/components/organisms/QuizQuestionCard";
import { QuizResultsPanel } from "@/components/organisms/QuizResultsPanel";
import { mergeLiveLeaderboard } from "@/modules/Competition/data";
import type { DuelQuiz, DuelState, ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface QuizBattleTemplateProps {
  quiz: DuelQuiz;
  state: DuelState;
  /** Countdown label such as "03:24". */
  timeLeft: string;
  /** Seconds remaining in the battle. */
  timeLeftSeconds: number;
  /** Total seconds allocated to the battle. */
  timeTotalSeconds: number;
  /** Locks in the participant answer for the current question. */
  onSubmit?: (answer: ParticipantAnswer) => void;
  /** Advances to the next question once an answer is revealed. */
  onAdvance?: () => void;
  onPlayAgain?: () => void;
  onExit?: () => void;
  className?: string;
}

export function QuizBattleTemplate({
  quiz,
  state,
  timeLeft,
  timeLeftSeconds,
  timeTotalSeconds,
  onSubmit,
  onAdvance,
  onPlayAgain,
  onExit,
  className,
}: Readonly<QuizBattleTemplateProps>) {
  const finished = state.totalQuestions > 0 && state.currentQuestionIndex >= state.totalQuestions;
  const question = quiz.questions[state.currentQuestionIndex];
  const submit = onSubmit ?? (() => undefined);
  const totalPoints = quiz.questions.reduce((sum, q) => sum + (q.points || 100), 0);
  const isLastQuestion = state.currentQuestionIndex === state.totalQuestions - 1;
  const timeProgress =
    timeTotalSeconds > 0
      ? Math.min(100, Math.max(0, Math.round((timeLeftSeconds / timeTotalSeconds) * 100)))
      : 0;
  // quiz.leaderboard is the real server standings (see buildDuelQuiz); the
  // participant's own row is overlaid with the live server score and re-ranked
  // as answers are graded, and appended if they have not finished yet. The rank
  // shown in the metrics strip and results panel is this derived rank, never a
  // fabricated number.
  const leaderboard = useMemo(
    () => mergeLiveLeaderboard(quiz.leaderboard, state.score),
    [quiz.leaderboard, state.score],
  );
  const rank = leaderboard.find((entry) => entry.isCurrentUser)?.rank ?? state.rank;

  if (finished) {
    return (
      <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
        <QuizBattleHeader
          title={quiz.battleTitle}
          totalPoints={totalPoints}
          players={quiz.playerCount}
          timeProgress={timeProgress}
          timeLeft={timeLeft}
        />
        <QuizResultsPanel
          title={quiz.battleTitle}
          score={state.score}
          correctCount={state.correctCount}
          total={state.totalQuestions}
          rank={rank}
          onPlayAgain={onPlayAgain}
          onExit={onExit}
        />
      </div>
    );
  }

  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      <QuizBattleHeader
        title={quiz.battleTitle}
        totalPoints={totalPoints}
        players={quiz.playerCount}
        timeProgress={timeProgress}
        timeLeft={timeLeft}
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <QuizQuestionCard
            question={question}
            index={state.currentQuestionIndex}
            total={state.totalQuestions}
            revealed={state.isAnswered}
            result={state.lastResult}
            answer={state.answer}
            onSubmit={submit}
          />
          {state.isAnswered ? (
            <div className="flex justify-end">
              <Button variant="primary" onClick={onAdvance}>
                {isLastQuestion ? "See Results" : "Next Question"}
              </Button>
            </div>
          ) : null}
          <QuizMetricsRow
            score={state.score}
            rank={rank}
            correctCount={state.correctCount}
            total={state.totalQuestions}
          />
        </div>

        <div className="shrink-0 lg:w-80">
          <LeaderboardPanel entries={leaderboard} />
        </div>
      </div>
    </div>
  );
}

export default QuizBattleTemplate;
