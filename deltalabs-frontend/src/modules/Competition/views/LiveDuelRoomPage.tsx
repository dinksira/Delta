/**
 * LiveDuelRoomPage
 * Entry view for the Live Duel competition room. Wraps the workspace in a
 * `LiveDuelProvider` seeded from the route `[id]` (falls back to a default demo
 * room when the id is missing/unknown) and drives a lightweight real-time
 * simulation while the real channel arrives: viewer-count drift and rotating
 * host questions (with an idle beat between cycles). The on-stage grid shows
 * only real users — the host, the current user, and (for backend rooms) joined
 * participants pushed over the room WebSocket (`JOIN_LIVE_DUEL`). No mock
 * participants or simulated chatter are rendered.
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
import { LeaveLiveDuelModal } from "@/components/organisms/LeaveLiveDuelModal";
import { QuestionModal } from "@/components/organisms/QuestionModal";
import { Button } from "@/components/theme/Button";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchLiveDuelRoom, postLiveDuelQuestion } from "@/modules/Competition/api";
import { LiveDuelProvider } from "@/modules/Competition/context/LiveDuelContext";
import { useLiveDuel, useLiveDuelSocket, useLiveMediaStream } from "@/modules/Competition/hooks";
import { DEMO_LIVE_QUESTIONS } from "@/modules/Competition/data/liveDuels";
import {
  buildLiveDuelRoom,
  getLiveDuelEntry,
  upsertLiveDuelEntry,
  type BuildLiveDuelRoomOptions,
} from "@/modules/Competition/data/liveDuelsCatalog";
import type { LiveDuelAction, LiveDuelRoom, LiveQuestion } from "@/modules/Competition/types/liveDuel";

const VIEWER_TICK_MS = 6000;
const QUESTION_TICK_MS = 12000;

function isBackendRoomId(id?: string): boolean {
  return Boolean(id && /^[0-9a-f]{24}$/i.test(id));
}

function LiveDuelRoom({
  isHost,
  isBackendRoom,
  currentUser,
}: Readonly<{
  isHost: boolean;
  isBackendRoom: boolean;
  currentUser?: BuildLiveDuelRoomOptions["currentUser"];
}>) {
  const router = useRouter();
  // Host mode is a runtime value: the session registry seeds it, but a backend
  // room fetched after a fresh page load must be allowed to promote the current
  // user to host (`detail.hostIsUser`). Kept in state so the Host Control panel
  // (with the question builder) appears once the fetch resolves.
  const [effectiveIsHost, setEffectiveIsHost] = useState(isHost);
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
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [modalQuestion, setModalQuestion] = useState<LiveQuestion | null>(null);
  const [seenQuestionId, setSeenQuestionId] = useState<string | null>(null);

  // Open the on-air question modal whenever a *new* question arrives in the
  // room state — whether the host posted it here (POST_LIVE_QUESTION) or it was
  // fanned out to this viewer (demo SET_LIVE_QUESTION / backend WS). An idle
  // beat (null) clears the seen id so the deck loop re-opens the next question.
  useEffect(() => {
    if (!room.liveQuestion) {
      setSeenQuestionId(null);
      return;
    }
    if (room.liveQuestion.id !== seenQuestionId) {
      setSeenQuestionId(room.liveQuestion.id);
      setModalQuestion(room.liveQuestion);
    }
  }, [room.liveQuestion, seenQuestionId]);

  // Latest values read by the interval closures without re-subscribing.
  const viewersRef = useRef(room.viewers);
  viewersRef.current = room.viewers;
  const questionStepRef = useRef(0);

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
  // users are not registered locally). The response carries `hostIsUser` so a
  // refreshing host re-gains their Host Control panel after the round-trip.
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
        if (detail.hostIsUser !== undefined) {
          setEffectiveIsHost(detail.hostIsUser === true);
        }
        dispatch({
          type: "SET_ROOM",
          payload: buildLiveDuelRoom(detail.id, {
            hostIsUser: getLiveDuelEntry(detail.id)?.hostIsUser === true,
            currentUser,
            participants: detail.participants,
          }),
        });
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isBackendRoom, room.id, dispatch, currentUser]);

  useEffect(() => {
    const viewerInterval = window.setInterval(() => {
      const drift = Math.floor(Math.random() * 50) - 8;
      const action: LiveDuelAction = {
        type: "UPDATE_VIEWERS",
        payload: Math.max(0, viewersRef.current + drift),
      };
      dispatch(action);
    }, VIEWER_TICK_MS);

    // Backend rooms receive real chat + roster over the socket; never simulate.
    // Host mode (and backend rooms) drive questions from the host control
    // panel; never auto-rotate there.
    const questionInterval =
      effectiveIsHost || isBackendRoom
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
      if (questionInterval) {
        window.clearInterval(questionInterval);
      }
    };
  }, [dispatch, effectiveIsHost, isBackendRoom]);

  const handleLeave = () => {
    setConfirmingLeave(true);
  };

  const handleConfirmLeave = () => {
    setConfirmingLeave(false);
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
    // The room-level effect opens the QuestionModal for participants AND the
    // host as soon as room.liveQuestion reflects the new question (frontend
    // POST_LIVE_QUESTION dispatch or the backend WS fan-out).
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
              {effectiveIsHost ? <span className="font-semibold text-primary-700">· Hosting</span> : null}
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
          effectiveIsHost ? (
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
        isHost={effectiveIsHost}
        mediaStream={mediaStream}
        mediaError={mediaError}
        isSpeaking={isSpeaking}
        voiceLevel={voiceLevel}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onSendMessage={handleSendMessage}
        onLeaveBattle={handleLeave}
      />

      <LeaveLiveDuelModal
        open={confirmingLeave}
        title={room.title}
        onClose={() => setConfirmingLeave(false)}
        onConfirm={handleConfirmLeave}
      />

      <QuestionModal
        open={Boolean(modalQuestion)}
        question={modalQuestion}
        onClose={() => setModalQuestion(null)}
      />
    </div>
  );
}

export function LiveDuelRoomPage() {
  const params = useParams<{ id?: string }>();
  const { session } = useAuthSession();
  const backendRoom = isBackendRoomId(params.id);
  // Real account identity for the on-stage self card (instead of placeholder
  // "You") so a logged-in participant sees their own username in the grid.
  const currentUser = useMemo<BuildLiveDuelRoomOptions["currentUser"]>(
    () =>
      session?.user
        ? {
            id: session.user.id,
            name: session.user.username || session.user.fullName || "You",
            avatarUrl: session.user.avatarUrl,
          }
        : undefined,
    [session],
  );
  const isHost = useMemo(
    () => getLiveDuelEntry(params.id)?.hostIsUser === true,
    [params.id],
  );
  const initialRoom = useMemo<LiveDuelRoom>(
    () => buildLiveDuelRoom(params.id, { hostIsUser: isHost, currentUser }),
    [params.id, isHost, currentUser],
  );
  return (
    <LiveDuelProvider initialRoom={initialRoom}>
      <LiveDuelRoom isHost={isHost} isBackendRoom={backendRoom} currentUser={currentUser} />
    </LiveDuelProvider>
  );
}

export default LiveDuelRoomPage;