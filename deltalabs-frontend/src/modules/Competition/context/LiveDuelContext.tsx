/**
 * LiveDuelContext
 * Context + reducer for the Live Duel competition workspace. Owns the mutable
 * room snapshot (viewers, live question, chat, participants, leaderboard) plus
 * the current user's media toggles. The provider accepts an optional
 * `initialRoom` (defaults to the demo seed) so a live feed can subscribe
 * without changing the view layer.
 *
 * Actions follow the `[VERB]_[NOUN]` UPPER_SNAKE_CASE convention;
 * `LiveDuelContextValue` methods are synchronous.
 *
 * @example
 * ```tsx
 * <LiveDuelProvider>
 *   <LiveDuelRoom />
 * </LiveDuelProvider>
 * ```
 */

"use client";

import { createContext, useCallback, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

import { DEMO_LIVE_ROOM } from "@/modules/Competition/data/liveDuels";
import type {
  LiveChatMessage,
  LiveDuelAction,
  LiveDuelContextValue,
  LiveDuelRoom,
  LiveDuelState,
} from "@/modules/Competition/types/liveDuel";

// ===== INITIAL STATE =====

export function createInitialLiveDuelState(initialRoom = DEMO_LIVE_ROOM): LiveDuelState {
  return {
    room: initialRoom,
    isMicMuted: false,
    isCameraOff: true,
  };
}

// ===== REDUCER =====

function liveDuelReducer(state: LiveDuelState, action: LiveDuelAction): LiveDuelState {
  switch (action.type) {
    case "SET_ROOM":
      return { ...state, room: action.payload };
    case "UPDATE_VIEWERS":
      return { ...state, room: { ...state.room, viewers: action.payload } };
    case "SET_LIVE_QUESTION":
      return { ...state, room: { ...state.room, liveQuestion: action.payload } };
    case "APPEND_CHAT_MESSAGE":
      return {
        ...state,
        room: { ...state.room, chat: [...state.room.chat, action.payload] },
      };
    case "SET_PARTICIPANT_MUTED":
      return {
        ...state,
        room: {
          ...state.room,
          participants: state.room.participants.map((participant) =>
            participant.id === action.payload.id
              ? { ...participant, micMuted: action.payload.micMuted }
              : participant,
          ),
        },
      };
    case "UPDATE_LEADERBOARD":
      return { ...state, room: { ...state.room, leaderboard: action.payload } };
    case "TOGGLE_MIC":
      return { ...state, isMicMuted: !state.isMicMuted };
    case "TOGGLE_CAMERA":
      return { ...state, isCameraOff: !state.isCameraOff };
    default:
      return state;
  }
}

// ===== CONTEXT =====

const LiveDuelContext = createContext<LiveDuelContextValue | undefined>(undefined);

export interface LiveDuelProviderProps {
  children: ReactNode;
  initialRoom?: LiveDuelRoom;
}

export function LiveDuelProvider({ children, initialRoom }: Readonly<LiveDuelProviderProps>) {
  const [state, dispatch] = useReducer(liveDuelReducer, undefined, () =>
    createInitialLiveDuelState(initialRoom),
  );

  const sendMessage = useCallback((text: string) => {
    const message: LiveChatMessage = {
      id: crypto.randomUUID(),
      username: "You",
      text,
      sentAt: Date.now(),
    };
    dispatch({ type: "APPEND_CHAT_MESSAGE", payload: message });
  }, []);

  const toggleMic = useCallback(() => {
    dispatch({ type: "TOGGLE_MIC" });
  }, []);

  const toggleCamera = useCallback(() => {
    dispatch({ type: "TOGGLE_CAMERA" });
  }, []);

  const value = useMemo<LiveDuelContextValue>(
    () => ({ state, dispatch, sendMessage, toggleMic, toggleCamera }),
    [state, dispatch, sendMessage, toggleMic, toggleCamera],
  );

  return <LiveDuelContext.Provider value={value}>{children}</LiveDuelContext.Provider>;
}

export default LiveDuelContext;