/**
 * useLiveDuelSocket
 * Opens the backend Live Duel realtime channel (`/v1/live-duels/ws`) for a room
 * and pipes every reducer-shaped server event into the `LiveDuelContext`
 * dispatcher, so questions posted by the host and chat from other clients land
 * in the room without any local simulation. Chat is sent back over the same
 * socket (`{"kind":"chat",...}`), which the backend fans out to the whole room.
 *
 * @example
 * ```ts
 * const { connected, sendChat } = useLiveDuelSocket({
 *   roomId: room.id,
 *   enabled: isBackendRoom,
 *   dispatch,
 * });
 * ```
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveDuelAction } from "@/modules/Competition/types/liveDuel";

const AUTH_SESSION_STORAGE_KEY = "dl.auth.session.v1";

/** Reducer actions the backend may legitimately broadcast for a room. */
const SERVER_ACTION_TYPES = new Set<string>([
  "POST_LIVE_QUESTION",
  "APPEND_CHAT_MESSAGE",
  "UPDATE_VIEWERS",
  "UPDATE_LEADERBOARD",
  "SET_LIVE_QUESTION",
  // The backend labels real joins as `JOIN_LIVE_DUEL`; forward them into the
  // reducer's participant action so every tab adds the joiner to the grid.
  "JOIN_LIVE_DUEL",
]);

const MAX_RECONNECT_ATTEMPTS = 3;

function readAccessToken(): string {
  if (typeof window === "undefined") {
    return "";
  }
  try {
    const raw = window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
    if (!raw) {
      return "";
    }
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken ?? "";
  } catch {
    return "";
  }
}

function buildSocketUrl(roomId: string, accessToken: string): string | null {
  try {
    const configuredBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    const sourceBase =
      configuredBase && configuredBase.length > 0 ? configuredBase : window.location.origin;
    const wsBase = sourceBase.replace(/^http/i, "ws");
    const socketUrl = new URL("/v1/live-duels/ws", wsBase.endsWith("/") ? wsBase : `${wsBase}/`);
    socketUrl.searchParams.set("room_id", roomId);
    socketUrl.searchParams.set("access_token", accessToken);
    return socketUrl.toString();
  } catch {
    return null;
  }
}

export interface UseLiveDuelSocketOptions {
  roomId?: string | null;
  /** Only connect when the room is backed by the realtime channel. */
  enabled: boolean;
  dispatch: (action: LiveDuelAction) => void;
}

export interface UseLiveDuelSocketResult {
  /** True while the WebSocket is open. */
  connected: boolean;
  /** Returns false when the socket is not open (caller falls back to demo). */
  sendChat: (text: string, emoji?: string) => boolean;
}

export function useLiveDuelSocket({
  roomId,
  enabled,
  dispatch,
}: Readonly<UseLiveDuelSocketOptions>): UseLiveDuelSocketResult {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const attemptRef = useRef(0);
  const disposedRef = useRef(false);
  const dispatchRef = useRef(dispatch);
  dispatchRef.current = dispatch;
  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;

  useEffect(() => {
    disposedRef.current = false;
    if (typeof window === "undefined" || !enabled || !roomIdRef.current) {
      setConnected(false);
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: number | undefined;

    const connect = () => {
      if (disposedRef.current || !roomIdRef.current) {
        return;
      }
      const token = readAccessToken();
      if (!token) {
        return;
      }
      const url = buildSocketUrl(roomIdRef.current, token);
      if (!url) {
        return;
      }
      let ws: WebSocket;
      try {
        ws = new window.WebSocket(url);
      } catch {
        return;
      }
      socket = ws;
      socketRef.current = ws;

      ws.onopen = () => {
        attemptRef.current = 0;
        setConnected(true);
      };
      ws.onclose = () => {
        setConnected(false);
        if (disposedRef.current) {
          return;
        }
        if (attemptRef.current < MAX_RECONNECT_ATTEMPTS) {
          attemptRef.current += 1;
          retryTimer = window.setTimeout(connect, 1000 * attemptRef.current);
        }
      };
      ws.onerror = () => {
        setConnected(false);
      };
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(String(event.data)) as {
            type?: string;
            room_id?: string;
            payload?: unknown;
          };
          if (!data.type || !SERVER_ACTION_TYPES.has(data.type)) {
            return;
          }
          if (data.room_id !== roomIdRef.current) {
            return;
          }
          const actionType: LiveDuelAction["type"] =
            data.type === "JOIN_LIVE_DUEL" ? "ADD_PARTICIPANT" : (data.type as LiveDuelAction["type"]);
          dispatchRef.current({
            type: actionType,
            payload: data.payload as never,
          });
        } catch {
          // Ignore malformed realtime events.
        }
      };
    };

    connect();

    return () => {
      disposedRef.current = true;
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
      socket?.close();
      socketRef.current = null;
      setConnected(false);
    };
  }, [enabled]);

  const sendChat = useCallback((text: string, emoji?: string): boolean => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !text.trim()) {
      return false;
    }
    ws.send(JSON.stringify({ kind: "chat", text: text.trim(), emoji }));
    return true;
  }, []);

  return { connected, sendChat };
}

export default useLiveDuelSocket;