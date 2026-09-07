/**
 * useLiveDuel
 * Returns the Live Duel workspace context value (room snapshot + media
 * toggles + sendMessage). Throws when used outside a `LiveDuelProvider`.
 *
 * @example
 * ```tsx
 * const { state, sendMessage, toggleMic } = useLiveDuel();
 * ```
 */

import { useContext } from "react";

import LiveDuelContext from "@/modules/Competition/context/LiveDuelContext";
import type { LiveDuelContextValue } from "@/modules/Competition/types/liveDuel";

export function useLiveDuel(): LiveDuelContextValue {
  const context = useContext(LiveDuelContext);
  if (!context) {
    throw new Error("useLiveDuel must be used within a LiveDuelProvider");
  }
  return context;
}

export default useLiveDuel;