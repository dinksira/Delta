/**
 * gameModes data
 * The three hub game-mode cards (Topic Battles, Championship, Live Duels).
 * These are static entry points — the real competitions live behind them — so
 * the cards render instantly and never wait on the `/hub` network call. The
 * server's `modes` payload overrides this fallback when it arrives.
 */

import type { GameMode } from "@/modules/Competition/types/hub";

export const DEFAULT_GAME_MODES: GameMode[] = [
  {
    id: "topic-battles",
    title: "Topic Battles",
    description:
      "Compete in structured challenges built around a single subject — from one topic to the podium.",
    actionLabel: "Enter Battle",
  },
  {
    id: "championship",
    title: "Championship",
    description: "Season-long knockout tournament. Climb the bracket and claim the crown.",
    actionLabel: "Join Tournament",
  },
  {
    id: "live-duels",
    title: "Live Duels",
    description:
      "Real-time one-on-one battles against a live opponent. Fast, intense, instant results.",
    actionLabel: "Quick Match",
  },
];
