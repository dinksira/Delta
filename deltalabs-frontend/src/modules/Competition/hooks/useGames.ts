/**
 * useGames
 * Query hook for the Games lobby (`/v1/competitions/games`).
 * Falls back to a deterministic local demo catalog when the endpoint is not
 * available, so the lobby is always viewable.
 *
 * @example
 * ```ts
 * const { data, isLoading, isError } = useGames();
 * const games = data?.games ?? FALLBACK_GAMES.games;
 * ```
 */

import { useQuery } from "@tanstack/react-query";

import { fetchGames } from "@/modules/Competition/api";
import { gamesQueryKeys } from "@/modules/Competition/hooks/gamesQueryKeys";
import type {
  CompetitionGame,
  CompetitionGamesResponse,
  GameStage,
} from "@/modules/Competition/types/games";

const FALLBACK_BATTLE_POOL = [
  "tb_demo_math_olympiad",
  "tb_demo_ml_club",
  "tb_demo_chem_quiz",
  "tb_demo_js_basics",
  "tb_demo_bio_cells",
  "tb_demo_ast_planets",
  "tb_demo_alg_sorting",
  "tb_demo_alg_fib",
  "tb_demo_seed_other",
];
const FALLBACK_STAGE_PRIZES = [15, 30, 60];
const FALLBACK_STAGE_NAMES: Array<[string, string]> = [
  ["Warm-up Round", "W1"],
  ["Seeded Round", "W2"],
  ["Winner's Round", "W3"],
];

function fallbackStages(gameIndex: number, points: number): GameStage[] {
  const count = FALLBACK_STAGE_NAMES.length;
  const base = Math.max(1, Math.round(points / count));
  const perStage = [base, base, points - base * (count - 1)];
  return FALLBACK_STAGE_NAMES.map(([name, shortLabel], index) => {
    const order = index + 1;
    return {
      id: `gst_${gameIndex}_${order}`,
      order,
      name,
      shortLabel,
      status: order === 1 ? "unlocked" : "locked",
      startsAt: "2026-09-01T00:00:00Z",
      pointsToEarn: perStage[index],
      pointsEarned: 0,
      isCurrent: order === 1,
      battleId:
        FALLBACK_BATTLE_POOL[(gameIndex + order - 1) % FALLBACK_BATTLE_POOL.length],
      entryFee: "Free",
      prizePool: `ETB ${FALLBACK_STAGE_PRIZES[index]}`,
    };
  });
}

const FALLBACK_GAMES_RAW: Omit<CompetitionGame, "stages">[] = [
    {
      id: "game_championship_rise",
      title: "Rise of the Titans",
      genre: "Knockout Tournament",
      description: "Season-long knockout. Win stages, collect points, and claim the crown.",
      difficulty: "All Levels",
      tone: "primary",
      isChampionship: true,
      status: "open",
      pointsToEarn: 1000,
      playersCount: 128,
      playersMax: 256,
      battleId: "tb_demo_math_olympiad",
      unlockHint: null,
    },
    {
      id: "game_logic_gates",
      title: "Logic Gates Throwdown",
      genre: "Code Battle",
      description: "Wire up logic gates in JavaScript and beat the clock.",
      difficulty: "Intermediate",
      tone: "emerald",
      isChampionship: false,
      status: "open",
      pointsToEarn: 250,
      playersCount: 1,
      playersMax: 4,
      battleId: "tb_demo_alg_fib",
      unlockHint: null,
    },
    {
      id: "game_linear_algebra",
      title: "Linear Algebra Sprint",
      genre: "Code Battle",
      description: "Determinants and dot products — fast and clean.",
      difficulty: "Beginner",
      tone: "cyan",
      isChampionship: false,
      status: "open",
      pointsToEarn: 180,
      playersCount: 1,
      playersMax: 4,
      battleId: "tb_demo_seed_other",
      unlockHint: null,
    },
    {
      id: "game_ml_cup",
      title: "ML Club: Trees vs Forests",
      genre: "Data Battle",
      description: "Tune Gini impurity, build trees, and beat the forest.",
      difficulty: "Advanced",
      tone: "violet",
      isChampionship: false,
      status: "open",
      pointsToEarn: 500,
      playersCount: 6,
      playersMax: 8,
      battleId: "tb_demo_ml_club",
      unlockHint: null,
    },
    {
      id: "game_chem_quiz",
      title: "Chemistry Pitstop",
      genre: "Quiz Sprint",
      description: "Rapid-fire chemistry rounds. Know your bonds before they break.",
      difficulty: "Intermediate",
      tone: "amber",
      isChampionship: false,
      status: "open",
      pointsToEarn: 220,
      playersCount: 12,
      playersMax: 64,
      battleId: "tb_demo_chem_quiz",
      unlockHint: null,
    },
    {
      id: "game_js_basics",
      title: "JS Fundamentals Dash",
      genre: "Quiz Sprint",
      description: "Scopes, closures, and promises at full speed.",
      difficulty: "Beginner",
      tone: "rose",
      isChampionship: false,
      status: "open",
      pointsToEarn: 150,
      playersCount: 20,
      playersMax: 64,
      battleId: "tb_demo_js_basics",
      unlockHint: null,
    },
    {
      id: "game_bio_cells",
      title: "Cell Biology Scramble",
      genre: "Quiz Sprint",
      description: "Organelles, membranes, and cycles — scramble them all.",
      difficulty: "Beginner",
      tone: "teal",
      isChampionship: false,
      status: "open",
      pointsToEarn: 160,
      playersCount: 15,
      playersMax: 32,
      battleId: "tb_demo_bio_cells",
      unlockHint: null,
    },
    {
      id: "game_ast_planets",
      title: "Planetary Quest",
      genre: "Quiz Sprint",
      description: "Cross the solar system answering orbital trivia.",
      difficulty: "Intermediate",
      tone: "indigo",
      isChampionship: false,
      status: "open",
      pointsToEarn: 240,
      playersCount: 8,
      playersMax: 32,
      battleId: "tb_demo_ast_planets",
      unlockHint: null,
    },
    {
      id: "game_alg_sorting",
      title: "Algo Sorting Dojo",
      genre: "Code Battle",
      description: "Implement mergesort, heaps, and friends under pressure.",
      difficulty: "Intermediate",
      tone: "orange",
      isChampionship: false,
      status: "open",
      pointsToEarn: 300,
      playersCount: 5,
      playersMax: 16,
      battleId: "tb_demo_alg_sorting",
      unlockHint: null,
    },
    {
      id: "game_midnight_league",
      title: "Midnight League — Elite",
      genre: "Invitational",
      description: "An invite-only gauntlet for the sharpest competitors.",
      difficulty: "Advanced",
      tone: "slate",
      isChampionship: false,
      status: "locked",
      pointsToEarn: 2000,
      playersCount: 0,
      playersMax: 0,
      battleId: null,
      unlockHint: "Reach Level 5 to unlock the Midnight League.",
    },
    {
      id: "game_crypto_gp",
      title: "Crypto Grand Prix 2027",
      genre: "Season Event",
      description: "The year's biggest season event. Entry opens soon.",
      difficulty: "All Levels",
      tone: "fuchsia",
      isChampionship: false,
      status: "coming-soon",
      pointsToEarn: 1500,
      playersCount: 0,
      playersMax: 0,
      battleId: null,
      unlockHint: null,
    },
];

export const FALLBACK_GAMES: CompetitionGamesResponse = {
  games: FALLBACK_GAMES_RAW.map((game, index) => ({
    ...game,
    stages: game.status === "open" ? fallbackStages(index, game.pointsToEarn) : [],
  })),
  total: 11,
  openCount: 9,
};

export function useGames() {
  return useQuery({
    queryKey: gamesQueryKeys.all,
    queryFn: fetchGames,
    staleTime: 30_000,
  });
}