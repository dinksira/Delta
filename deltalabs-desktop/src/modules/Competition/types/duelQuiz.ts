/**
 * duelQuiz types
 * TypeScript definitions for duel quiz questions, leaderboard, and state.
 */

export interface DuelQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface DuelLeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl?: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface DuelQuiz {
  battleId: string;
  battleTitle: string;
  questions: DuelQuestion[];
  leaderboard: DuelLeaderboardEntry[];
}

export interface DuelState {
  currentQuestionIndex: number;
  selectedAnswer: number | null;
  isAnswered: boolean;
  score: number;
  rank: number;
  correctCount: number;
  totalQuestions: number;
}
