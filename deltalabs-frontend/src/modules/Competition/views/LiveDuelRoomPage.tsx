/**
 * LiveDuelRoomPage
 * Entry view for the Live Duel competition page. Wraps the workspace in a
 * `LiveDuelProvider` seeded from the route `[id]` (falls back to a default
 * demo room when the id is missing/unknown) and drives a lightweight real-time
 * simulation while the real channel arrives: viewer-count drift, rotating host
 * questions (with an idle beat between cycles), and incoming chat chatter. Back
 * navigation wraps the immersive workspace in a slim brand header.
 *
 * @example
 * ```tsx
 * <LiveDuelRoomPage />
 * ```
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";

import { LiveDuelWorkspaceTemplate } from "@/components/templates/LiveDuelWorkspaceTemplate";
import { Button } from "@/components/theme/Button";
import { LiveDuelProvider } from "@/modules/Competition/context/LiveDuelContext";
import { useLiveDuel } from "@/modules/Competition/hooks";
import { DEMO_CHAT_ROTATION, DEMO_LIVE_QUESTIONS } from "@/modules/Competition/data/liveDuels";
import { buildLiveDuelRoom } from "@/modules/Competition/data/liveDuelsCatalog";
import type { LiveDuelAction, LiveDuelRoom } from "@/modules/Competition/types/liveDuel";

const VIEWER_TICK_MS = 6000;
const CHAT_TICK_MS = 7000;
const QUESTION_TICK_MS = 12000;

function LiveDuelRoom() {
  const router = useRouter();
  const { state, dispatch, sendMessage, toggleMic, toggleCamera } = useLiveDuel();
  const { room, isMicMuted, isCameraOff } = state;

  // Latest values read by the interval closures without re-subscribing.
  const viewersRef = useRef(room.viewers);
  viewersRef.current = room.viewers;
  const questionStepRef = useRef(0);

  useEffect(() => {
    const viewerInterval = window.setInterval(() => {
      const drift = Math.floor(Math.random() * 50) - 8;
      const action: LiveDuelAction = {
        type: "UPDATE_VIEWERS",
        payload: Math.max(0, viewersRef.current + drift),
      };
      dispatch(action);
    }, VIEWER_TICK_MS);

    const chatInterval = window.setInterval(() => {
      const sample = DEMO_CHAT_ROTATION[Math.floor(Math.random() * DEMO_CHAT_ROTATION.length)];
      if (!sample) {
        return;
      }
      const action: LiveDuelAction = {
        type: "APPEND_CHAT_MESSAGE",
        payload: { ...sample, id: crypto.randomUUID(), sentAt: Date.now() },
      };
      dispatch(action);
    }, CHAT_TICK_MS);

    const questionInterval = window.setInterval(() => {
      const step = questionStepRef.current + 1;
      questionStepRef.current = step;
      // Every (deckLength + 1)th beat is an idle pause before the deck loops.
      const index = (step - 1) % (DEMO_LIVE_QUESTIONS.length + 1);
      const action: LiveDuelAction =
        index === DEMO_LIVE_QUESTIONS.length
          ? { type: "SET_LIVE_QUESTION", payload: null }
          : {
              type: "SET_LIVE_QUESTION",
              payload: DEMO_LIVE_QUESTIONS[index % DEMO_LIVE_QUESTIONS.length],
            };
      dispatch(action);
    }, QUESTION_TICK_MS);

    return () => {
      window.clearInterval(viewerInterval);
      window.clearInterval(chatInterval);
      window.clearInterval(questionInterval);
    };
  }, [dispatch]);

  const handleLeave = () => {
    router.push("/features/competitions");
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLeave}
            className="px-3"
            aria-label="Back to competitions"
          >
            <ArrowLeft className="size-4" aria-hidden />
            <span className="sr-only">Back</span>
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight text-text-primary">Live Duels</h1>
            <p className="flex items-center gap-1.5 text-xs text-text-secondary">
              <Radio className="size-3.5 text-error-500" aria-hidden />
              Arena · {room.title}
            </p>
          </div>
        </div>
      </header>

      <LiveDuelWorkspaceTemplate
        title={room.title}
        host={{ name: room.hostName, avatarUrl: room.hostAvatarUrl, subtitle: room.title }}
        viewerCount={room.viewers}
        liveQuestion={room.liveQuestion}
        chatMessages={room.chat}
        participants={room.participants}
        leaderboard={room.leaderboard}
        activePlayers={room.participants.length}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onSendMessage={sendMessage}
        onLeaveBattle={handleLeave}
      />
    </div>
  );
}

export function LiveDuelRoomPage() {
  const params = useParams<{ id?: string }>();
  const initialRoom = useMemo<LiveDuelRoom>(
    () => buildLiveDuelRoom(params.id),
    [params.id],
  );
  return (
    <LiveDuelProvider initialRoom={initialRoom}>
      <LiveDuelRoom />
    </LiveDuelProvider>
  );
}

export default LiveDuelRoomPage;