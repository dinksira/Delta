/**
 * LiveDuelRoomPage
 * Entry view for the Live Duel competition room. Wraps the workspace in a
 * `LiveDuelProvider` seeded from the route `[id]` via `buildLiveDuelRoom`, then
 * subscribes the room over the backend WebSocket. The on-stage grid shows only
 * real users — the host, the current user, and (for backend rooms) joined
 * participants pushed over the room channel (`JOIN_LIVE_DUEL`). No mock
 * participants, simulated viewers or simulated chatter are rendered.
 *
 * When the current user is the host (`entry.hostIsUser` / room detail), the room
 * renders in **host mode**: the host participant is the current user, a
 * `HostControlPanel` lets the host post questions live, and an "End Duel"
 * action freezes the seat results (final leaderboard persisted for the lobby
 * history) and returns to the lobby.
 *
 * @example
 * ```tsx
 * <LiveDuelRoomPage />
 * ```
 */

"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Flag, Radio } from "lucide-react";

import { LiveDuelWorkspaceTemplate } from "@/components/templates/LiveDuelWorkspaceTemplate/LiveDuelWorkspaceTemplate";
import { HostControlPanel } from "@/components/organisms/HostControlPanel/HostControlPanel";
import { LeaveLiveDuelModal } from "@/components/organisms/LeaveLiveDuelModal/LeaveLiveDuelModal";
import { QuestionModal } from "@/components/organisms/QuestionModal/QuestionModal";
import { Button } from "@/components/theme/Button";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  fetchLiveDuelRoom,
  finishLiveDuel,
  postLiveDuelQuestion,
  submitLiveDuelAnswer,
} from "@/modules/Competition/api";
import { LiveDuelProvider } from "@/modules/Competition/context/LiveDuelContext";
import { useLiveDuel } from "@/modules/Competition/hooks/useLiveDuel";
import { useLiveDuelRTC } from "@/modules/Competition/hooks/useLiveDuelRTC";
import { useLiveDuelSocket } from "@/modules/Competition/hooks/useLiveDuelSocket";
import { useLiveMediaStream } from "@/modules/Competition/hooks/useLiveMediaStream";
import {
  buildLiveDuelRoom,
  getLiveDuelEntry,
  upsertLiveDuelEntry,
  type BuildLiveDuelRoomOptions,
} from "@/modules/Competition/data/liveDuelsCatalog";
import type { ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";
import type {
  LiveDuelRoom,
  LiveQuestion,
  LiveMediaSignal,
} from "@/modules/Competition/types/liveDuel";

function isBackendRoomId(id?: string): boolean {
  return Boolean(id && /^[0-9a-f]{24}$/i.test(id));
}

function LiveDuelRoom({
  isHost,
  isBackendRoom,
  currentUser,
  isReady,
}: Readonly<{
  isHost: boolean;
  isBackendRoom: boolean;
  currentUser?: BuildLiveDuelRoomOptions["currentUser"];
  /** Auth session storage has been read (client only); gates the room fetch. */
  isReady: boolean;
}>) {
  const router = useRouter();
  // Host mode is a runtime value: the session registry seeds it, but a backend
  // room fetched after a fresh page load must be allowed to promote the current
  // user to host (`detail.hostIsUser`). Kept in state so the Host Control panel
  // (with the question builder) appears once the fetch resolves.
  const [effectiveIsHost, setEffectiveIsHost] = useState(isHost);
  const { state, dispatch, sendMessage, postLiveQuestion, toggleMic, toggleCamera } = useLiveDuel();
  const { room, isMicMuted, isCameraOff } = state;
  // Signals arrive through the socket options object, so the page routes them
  // via a ref the RTC hook fills in below (avoids a circular hook ordering).
  const handleSignalRef = useRef<(signal: LiveMediaSignal) => void>(() => {});
  const { connected, sendChat, sendSignal } = useLiveDuelSocket({
    roomId: room.id,
    enabled: isBackendRoom,
    dispatch,
    onSignal: (signal: LiveMediaSignal) => {
      handleSignalRef.current(signal);
    },
  });
  const { mediaStream, error: mediaError, isSpeaking, voiceLevel } = useLiveMediaStream();

  // WebRTC mesh: one peer per remote stage participant, so both sides' cameras
  // render live once toggled on ("videos on show on both sides").
  const currentUserId = currentUser?.id ?? null;
  const remoteUserIds = useMemo(
    () =>
      room.participants
        .filter((participant) => !participant.isYou && participant.id !== currentUserId)
        .map((participant) => participant.id),
    [room.participants, currentUserId],
  );
  const { handleSignal, remoteStreams } = useLiveDuelRTC({
    enabled: isBackendRoom && connected && Boolean(currentUserId),
    userId: currentUserId,
    remoteUserIds,
    localStream: mediaStream,
    isCameraOff,
    isMicMuted,
    sendSignal,
    onRemoteMediaState: (participantId, media) =>
      dispatch({ type: "UPDATE_PARTICIPANT_MEDIA", payload: { id: participantId, ...media } }),
  });
  handleSignalRef.current = handleSignal;
  const [confirmingLeave, setConfirmingLeave] = useState(false);
  const [confirmingFinish, setConfirmingFinish] = useState(false);
  const [finishingDuel, setFinishingDuel] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [modalQuestion, setModalQuestion] = useState<LiveQuestion | null>(null);
  const [seenQuestionId, setSeenQuestionId] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState<string | null>(null);

  // Server entries carry `userId`; highlight the current user's row so the
  // (You) badge stays correct for every tab in the broadcast room.
  const displayLeaderboard = useMemo(
    () =>
      room.leaderboard.map((entry) => ({
        ...entry,
        isCurrentUser: Boolean(entry.userId && currentUserId && entry.userId === currentUserId),
      })),
    [room.leaderboard, currentUserId],
  );

  // Open the on-air question modal whenever a *new* question arrives in the
  // room state — whether the host posted it here (POST_LIVE_QUESTION) or it was
  // fanned out to this viewer over the backend WS. An idle (null) clears the
  // seen id so the next round re-opens the modal.
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
  // the authoritative room detail once the auth session is loaded — a fresh
  // page load does not know the current user until then, so an early fetch
  // would see `hostIsUser: false` and flip a hosting tab to the participant
  // side. `hostIsUser` only ever *promotes* host mode here (never demotes): a
  // real host always has a session, so the panel is safe to keep once granted.
  useEffect(() => {
    if (!isBackendRoom || !isReady) {
      return;
    }
    let active = true;
    fetchLiveDuelRoom(room.id)
      .then((detail) => {
        if (!active) {
          return;
        }
        upsertLiveDuelEntry(detail);
        if (detail.hostIsUser === true) {
          setEffectiveIsHost(true);
        }
        dispatch({
          type: "SET_ROOM",
          payload: buildLiveDuelRoom(detail.id, {
            hostIsUser: getLiveDuelEntry(detail.id)?.hostIsUser === true,
            currentUser,
            participants: detail.participants,
          }),
        });
        if (detail.leaderboard) {
          dispatch({ type: "UPDATE_LEADERBOARD", payload: detail.leaderboard });
        }
        for (const record of detail.answers ?? []) {
          if (currentUser?.id && record.userId === currentUser.id) {
            dispatch({
              type: "SET_LIVE_ANSWER_RESULT",
              payload: {
                questionId: record.questionId,
                answer: record.answer,
                correct: record.correct,
                earnedPoints: record.earnedPoints,
              },
            });
          }
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isBackendRoom, room.id, dispatch, currentUser, isReady]);

  const handleLeave = () => {
    setConfirmingLeave(true);
  };

  const handleConfirmLeave = () => {
    setConfirmingLeave(false);
    router.push("/features/competitions");
  };

  const handleRequestFinish = () => {
    setConfirmingFinish(true);
  };

  const handleConfirmFinish = async () => {
    if (!isBackendRoom || finishingDuel) {
      return;
    }
    setFinishingDuel(true);
    setFinishError(null);
    try {
      await finishLiveDuel(room.id);
      setConfirmingFinish(false);
      router.push("/features/competitions");
    } catch (error) {
      setFinishError(
        error instanceof Error ? error.message : "Failed to end the duel. Please try again.",
      );
    } finally {
      setFinishingDuel(false);
    }
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
    // host as soon as room.liveQuestion reflects the new question. In backend
    // rooms the host dispatches optimistically (same question id) and the POST
    // fans out to every tab; the backend echoes the id back so the reducer's
    // id-upsert never duplicates or re-opens the modal.
    if (isBackendRoom) {
      postLiveQuestion(question);
      void postLiveDuelQuestion(room.id, {
        id: question.id,
        text: question.text,
        points: question.points,
        timeLabel: question.timeLabel,
        question: question.question ?? null,
      }).catch(() => {});
      return;
    }
    postLiveQuestion(question);
  };

  const handleSubmitAnswer = async (answer: ParticipantAnswer) => {
    const question = modalQuestion;
    if (!question || !isBackendRoom || submittingAnswer) {
      return;
    }
    setSubmittingAnswer(true);
    setAnswerError(null);
    try {
      const result = await submitLiveDuelAnswer(room.id, question.id, { answer });
      dispatch({
        type: "SET_LIVE_ANSWER_RESULT",
        payload: {
          questionId: question.id,
          answer,
          correct: result.correct,
          earnedPoints: result.earnedPoints,
        },
      });
      // The answer endpoint also fans the board out over the room channel; the
      // HTTP echo keeps this tab in sync even if its socket dropped.
      dispatch({ type: "UPDATE_LEADERBOARD", payload: result.leaderboard });
    } catch (error) {
      setAnswerError(error instanceof Error ? error.message : "Failed to submit your answer.");
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const activeAnswer = modalQuestion ? (state.answers[modalQuestion.id] ?? null) : null;

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
              {effectiveIsHost ? (
                <span className="font-semibold text-primary-700">· Hosting</span>
              ) : null}
              {isBackendRoom && connected ? <span className="text-primary-600">· Live</span> : null}
            </p>
          </div>
        </div>
        {effectiveIsHost && isBackendRoom ? (
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              {confirmingFinish ? (
                <>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => {
                      setConfirmingFinish(false);
                      setFinishError(null);
                    }}
                    disabled={finishingDuel}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleConfirmFinish}
                    disabled={finishingDuel}
                  >
                    {finishingDuel ? "Ending…" : "Confirm end"}
                  </Button>
                </>
              ) : (
                <Button variant="secondary" size="md" onClick={handleRequestFinish}>
                  <Flag className="size-4" aria-hidden />
                  End Duel
                </Button>
              )}
            </div>
            {finishError ? (
              <p className="text-xs text-error-600" role="alert">
                {finishError}
              </p>
            ) : null}
          </div>
        ) : null}
      </header>

      <LiveDuelWorkspaceTemplate
        title={room.title}
        host={{ name: room.hostName, avatarUrl: room.hostAvatarUrl, subtitle: room.title }}
        viewerCount={room.viewers}
        liveQuestion={room.liveQuestion}
        chatMessages={room.chat}
        participants={onStageParticipants}
        leaderboard={displayLeaderboard}
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
        participantStreams={remoteStreams}
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
        interactive={Boolean(isBackendRoom && !effectiveIsHost && modalQuestion?.question)}
        result={activeAnswer}
        submitting={submittingAnswer}
        submitError={answerError}
        onSubmitAnswer={handleSubmitAnswer}
      />
    </div>
  );
}

export function LiveDuelRoomPage() {
  const params = useParams<{ id?: string }>();
  const { session, isReady } = useAuthSession();
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
  const isHost = useMemo(() => getLiveDuelEntry(params.id)?.hostIsUser === true, [params.id]);
  const initialRoom = useMemo<LiveDuelRoom>(
    () => buildLiveDuelRoom(params.id, { hostIsUser: isHost, currentUser }),
    [params.id, isHost, currentUser],
  );
  return (
    <LiveDuelProvider initialRoom={initialRoom}>
      <LiveDuelRoom
        isHost={isHost}
        isBackendRoom={backendRoom}
        currentUser={currentUser}
        isReady={isReady}
      />
    </LiveDuelProvider>
  );
}

export default LiveDuelRoomPage;
