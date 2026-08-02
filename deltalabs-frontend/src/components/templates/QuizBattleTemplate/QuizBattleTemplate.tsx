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

import { Button } from "@/components/theme/Button";
import { LeaderboardPanel } from "@/components/organisms/LeaderboardPanel";
import { QuizBattleHeader } from "@/components/organisms/QuizBattleHeader";
import { QuizMetricsRow } from "@/components/organisms/QuizMetricsRow";
import { QuizQuestionCard } from "@/components/organisms/QuizQuestionCard";
import { QuizResultsPanel } from "@/components/organisms/QuizResultsPanel";
import type { DuelQuiz, DuelState } from "@/modules/Competition/types/duelQuiz";
import { cn } from "@/lib/utils";

export interface QuizBattleTemplateProps {
  quiz: DuelQuiz;
  state: DuelState;
  /** Countdown label such as "03:24". */
  timeLeft: string;
  onSelect?: (index: number) => void;
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
  onSelect,
  onAdvance,
  onPlayAgain,
  onExit,
  className,
}: Readonly<QuizBattleTemplateProps>) {
  const finished = state.currentQuestionIndex >= state.totalQuestions;
  const question = quiz.questions[state.currentQuestionIndex];
  const totalPoints = quiz.questions.reduce((sum) => sum + 100, 0);
  const isLastQuestion = state.currentQuestionIndex === state.totalQuestions - 1;

  if (finished) {
    return (
      <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
        <QuizBattleHeader
          title={quiz.battleTitle}
          totalPoints={totalPoints}
          players={quiz.leaderboard.length}
          currentQuestion={state.totalQuestions}
          totalQuestions={state.totalQuestions}
          timeLeft="0m 00s"
        />
        <QuizResultsPanel
          title={quiz.battleTitle}
          score={state.score}
          correctCount={state.correctCount}
          total={state.totalQuestions}
          rank={state.rank}
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
        players={quiz.leaderboard.length}
        currentQuestion={state.currentQuestionIndex + 1}
        totalQuestions={state.totalQuestions}
        timeLeft={timeLeft}
      />

      <div className="flex flex-col gap-5 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <QuizQuestionCard
            question={question}
            index={state.currentQuestionIndex}
            total={state.totalQuestions}
            selected={state.selectedAnswer}
            revealed={state.isAnswered}
            onSelect={onSelect}
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
            rank={state.rank}
            correctCount={state.correctCount}
            total={state.totalQuestions}
          />
        </div>

        <div className="shrink-0 lg:w-80">
          <LeaderboardPanel entries={quiz.leaderboard} />
        </div>
      </div>
    </div>
  );
}

export default QuizBattleTemplate;
