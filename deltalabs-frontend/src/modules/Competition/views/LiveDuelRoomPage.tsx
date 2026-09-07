/**
 * LiveDuelRoomPage
 * Entry view for the Live Duel competition room. Wraps the workspace in a
 * `LiveDuelProvider` seeded from the route `[id]` (falls back to a default demo
 * room when the id is missing/unknown) and drives a lightweight real-time
 * simulation while the real channel arrives: viewer-count drift, rotating host
 * questions (with an idle beat between cycles), and incoming chat chatter.
 *
 * When the duel was created by the current user (`entry.hostIsUser`), the room
 * renders in **host mode**: the question auto-rotation is disabled, the host
 * participant is the current user, and a `HostControlPanel` lets the host post
 * questions live round by round.
 *
 * @example
 * ```tsx
 * <LiveDuelRoomPage />
 * ```
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Radio } from "lucide-react";

import { LiveDuelWorkspaceTemplate } from "@/components/templates/LiveDuelWorkspaceTemplate";
import { HostControlPanel } from "@/components/organisms/HostControlPanel";
import { Button } from "@/components/theme/Button";
import { fetchLiveDuelRoom, postLiveDuelQuestion } from "@/modules/Competition/api";
import { LiveDuelProvider } from "@/modules/Competition/context/LiveDuelContext";
import { useLiveDuel, useLiveDuelSocket, useLiveMediaStream } from "@/modules/Competition/hooks";
import { DEMO_CHAT_ROTATION, DEMO_LIVE_QUESTIONS } from "@/modules/Competition/data/liveDuels";
import {
  buildLiveDuelRoom,
  getLiveDuelEntry,
  upsertLiveDuelEntry,
} from "@/modules/Competition/data/liveDuelsCatalog";
import type { LiveDuelAction, LiveDuelRoom } from "@/modules/Competition/types/liveDuel";

const VIEWER_TICK_MS = 6000;
const CHAT_TICK_MS = 7000;
const QUESTION_TICK_MS = 12000;
const SPEAKER_TICK_MS = 5200;
const SPEAKER_HOLD_MS = 4000;

function isBackendRoomId(id?: string): boolean {
  return Boolean(id && /^[0-9a-f]{24}$/i.test(id));
}

function LiveDuelRoom({
  isHost,
  isBackendRoom,
}: Readonly<{ isHost: boolean; isBackendRoom: boolean }>) {
  const router = useRouter();
  const {
    state,
    dispatch,
    sendMessage,
    postLiveQuestion,
    toggleMic,
    toggleCamera,
  } = useLiveDuel();
  const { room, isMicMuted, isCameraOff } = state;
  const { connected, sendChat } = useLiveDuelSocket({
    roomId: room.id,
    enabled: isBackendRoom,
    dispatch,
  });
  const {
    mediaStream,
    error: mediaError,
    isSpeaking,
    voiceLevel,
  } = useLiveMediaStream();
  const [speakingIds, setSpeakingIds] = useState<ReadonlySet<string>>(new Set());

  // Latest values read by the interval closures without re-subscribing.
  const viewersRef = useRef(room.viewers);
  viewersRef.current = room.viewers;
  const questionStepRef = useRef(0);
  const rosterRef = useRef(room.participants);
  rosterRef.current = room.participants;

  // Simulate which *other* participants are currently speaking so their voice
  // wave animates ("when someone talks"). The current user's card + host focal
  // point use the real mic level from `useLiveMediaStream`.
  useEffect(() => {
    let clearTimer = 0;
    const pickSpeaker = () => {
      const others = rosterRef.current.filter((participant) => !participant.isYou);
      if (others.length === 0) {
        setSpeakingIds(new Set());
        return;
      }
      const speaker = others[Math.floor(Math.random() * others.length)];
      if (!speaker) {
        return;
      }
      setSpeakingIds(new Set([speaker.id]));
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => setSpeakingIds(new Set()), SPEAKER_HOLD_MS);
    };
    const interval = window.setInterval(pickSpeaker, SPEAKER_TICK_MS);
    const bootTimer = window.setTimeout(pickSpeaker, 1200);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(bootTimer);
      window.clearTimeout(clearTimer);
    };
  }, []);

  // Reflect the current user's real media state on their own participant card.
  const onStageParticipants = useMemo(
    () =>
      room.participants.map((participant) =>
        participant.isYou
          ? { ...participant, micMuted: isMicMuted, cameraOff: isCameraOff }
          : participant,
      ),
    [room.participants, isMicMuted, isCameraOff],
  );

  // Backend rooms boot from the registry seed instantly, then reconcile with
  // the authoritative room detail once it arrives (rooms created by other
  // users are not registered locally).
  useEffect(() => {
    if (!isBackendRoom) {
      return;
    }
    let active = true;
    fetchLiveDuelRoom(room.id)
      .then((detail) => {
        if (!active) {
          return;
        }
        upsertLiveDuelEntry(detail);
        dispatch({
          type: "SET_ROOM",
          payload: buildLiveDuelRoom(detail.id, {
            hostIsUser: getLiveDuelEntry(detail.id)?.hostIsUser === true,
          }),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isBackendRoom, room.id, dispatch]);

  useEffect(() => {
    const viewerInterval = window.setInterval(() => {
      const drift = Math.floor(Math.random() * 50) - 8;
      const action: LiveDuelAction = {
        type: "UPDATE_VIEWERS",
        payload: Math.max(0, viewersRef.current + drift),
      };
      dispatch(action);
    }, VIEWER_TICK_MS);

    // Backend rooms receive real chat over the socket; never simulate chatter.
    const chatInterval = isBackendRoom
      ? undefined
      : window.setInterval(() => {
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

    // Host mode (and backend rooms) drive questions from the host control
    // panel; never auto-rotate there.
    const questionInterval =
      isHost || isBackendRoom
        ? undefined
        : window.setInterval(() => {
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
      if (chatInterval) {
        window.clearInterval(chatInterval);
      }
      if (questionInterval) {
        window.clearInterval(questionInterval);
      }
    };
  }, [dispatch, isHost, isBackendRoom]);

  const handleLeave = () => {
    router.push("/features/competitions");
  };

  const handleSendMessage = (text: string) => {
    if (isBackendRoom) {
      if (!sendChat(text)) {
        sendMessage(text);
      }
      return;
    }
    sendMessage(text);
  };

  const handlePostQuestion = (question: Parameters<typeof postLiveQuestion>[0]) => {
    if (isBackendRoom) {
      void postLiveDuelQuestion(room.id, {
        text: question.text,
        points: question.points,
        timeLabel: question.timeLabel,
      }).catch(() => {});
      return;
    }
    postLiveQuestion(question);
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
              {isHost ? <span className="font-semibold text-primary-700">· Hosting</span> : null}
              {isBackendRoom && connected ? (
                <span className="text-primary-600">· Live</span>
              ) : null}
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
        participants={onStageParticipants}
        leaderboard={room.leaderboard}
        activePlayers={room.participants.length}
        hostControlSlot={
          isHost ? (
            <HostControlPanel
              viewers={room.viewers}
              liveQuestion={room.liveQuestion}
              postedQuestions={room.postedQuestions}
              onPostQuestion={handlePostQuestion}
            />
          ) : undefined
        }
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isHost={isHost}
        mediaStream={mediaStream}
        mediaError={mediaError}
        isSpeaking={isSpeaking}
        voiceLevel={voiceLevel}
        speakingIds={speakingIds}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onSendMessage={handleSendMessage}
        onLeaveBattle={handleLeave}
      />
    </div>
  );
}

export function LiveDuelRoomPage() {
  const params = useParams<{ id?: string }>();
  const backendRoom = isBackendRoomId(params.id);
  const isHost = useMemo(
    () => getLiveDuelEntry(params.id)?.hostIsUser === true,
    [params.id],
  );
  const initialRoom = useMemo<LiveDuelRoom>(
    () => buildLiveDuelRoom(params.id, { hostIsUser: isHost }),
    [params.id, isHost],
  );
  return (
    <LiveDuelProvider initialRoom={initialRoom}>
      <LiveDuelRoom isHost={isHost} isBackendRoom={backendRoom} />
    </LiveDuelProvider>
  );
}

export default LiveDuelRoomPage;