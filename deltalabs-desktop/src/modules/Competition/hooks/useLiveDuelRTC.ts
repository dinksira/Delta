/**
 * useLiveDuelRTC
 * WebRTC mesh for a Live Duel room. Maintains one `RTCPeerConnection` per
 * remote participant (host + joiners), continuously negotiating offers/answers
 * and ICE candidates through the room channel (`sendSignal` per the
 * `MEDIA_SIGNAL` relay) and exposing the received remote camera streams keyed
 * by participant id so the participant grid can render every side's live video.
 *
 * Signalling avoids offer/answer glare with a deterministic role: the side with
 * the lexicographically smaller user id initiates the first offer, and both
 * sides refuse to offer while a negotiation is already in flight
 * (`signalingState !== "stable"`). Later track changes fall back to
 * `onnegotiationneeded` on whichever side changed. Inbound `media-state`
 * signals update remote tile indicators via `onRemoteMediaState`.
 *
 * The mesh relies on the local `mediaStream` produced by `useLiveMediaStream`
 * (a persistent audio track + live video track while the camera is on) —
 * toggling the camera off removes the video sender but keeps mic audio flowing.
 *
 * @example
 * ```tsx
 * const { handleSignal, remoteStreams } = useLiveDuelRTC({
 *   enabled: isBackendRoom && connected && Boolean(userId),
 *   userId,
 *   remoteUserIds,
 *   localStream: mediaStream,
 *   isCameraOff,
 *   isMicMuted,
 *   sendSignal,
 *   onRemoteMediaState: (id, media) =>
 *     dispatch({ type: "UPDATE_PARTICIPANT_MEDIA", payload: { id, ...media } }),
 * });
 * useLiveDuelSocket({ ..., onSignal: handleSignal });
 * ```
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { LiveMediaState, LiveMediaSignal } from "@/modules/Competition/types/liveDuel";

/** Public STUN (host candidates still cover the same-machine/LAN dev case). */
const RTC_ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export interface UseLiveDuelRTCOptions {
  /** Run the mesh only for backend rooms with an authenticated user + socket. */
  enabled: boolean;
  /** Current user's account id (backend roster `id`). */
  userId: string | null;
  /** Participant ids to peer with (everyone except the current user). */
  remoteUserIds: string[];
  /** Local camera+mic stream maintained by `useLiveMediaStream`. */
  localStream: MediaStream | null;
  isCameraOff: boolean;
  isMicMuted: boolean;
  sendSignal: (signal: Omit<LiveMediaSignal, "fromUserId">) => boolean;
  /** Remote hardware state (media-state signals) → tile indicators. */
  onRemoteMediaState?: (participantId: string, media: LiveMediaState) => void;
}

export interface UseLiveDuelRTCResult {
  /** Feed every inbound `MEDIA_SIGNAL` echo from the socket here. */
  handleSignal: (signal: LiveMediaSignal) => void;
  /** Remote camera streams keyed by participant id (rendered in the grid). */
  remoteStreams: Readonly<Record<string, MediaStream>>;
  /** Active peer connections (diagnostics). */
  peerCount: number;
}

export function useLiveDuelRTC({
  enabled,
  userId,
  remoteUserIds,
  localStream,
  isCameraOff,
  isMicMuted,
  sendSignal,
  onRemoteMediaState,
}: Readonly<UseLiveDuelRTCOptions>): UseLiveDuelRTCResult {
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteStreamsRef = useRef<Map<string, MediaStream>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
  const [remoteStreams, setRemoteStreams] = useState<Readonly<Record<string, MediaStream>>>({});
  const [peerCount, setPeerCount] = useState(0);

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const userIdRef = useRef(userId);
  userIdRef.current = userId;
  const sendSignalRef = useRef(sendSignal);
  sendSignalRef.current = sendSignal;
  const onRemoteMediaStateRef = useRef(onRemoteMediaState);
  onRemoteMediaStateRef.current = onRemoteMediaState;
  const localStreamRef = useRef(localStream);
  localStreamRef.current = localStream;

  const commitRemoteStreams = useCallback(() => {
    const next: Record<string, MediaStream> = {};
    remoteStreamsRef.current.forEach((stream, id) => {
      next[id] = stream;
    });
    setRemoteStreams(next);
  }, []);

  const syncTracksIntoPeer = useCallback((peerId: string) => {
    const pc = peersRef.current.get(peerId);
    if (!pc) {
      return;
    }
    const stream = localStreamRef.current;
    const audioTrack = stream?.getAudioTracks()[0] ?? null;
    const videoTrack = stream?.getVideoTracks()[0] ?? null;

    const senders = pc.getSenders();
    const audioSender = senders.find((sender) => sender.track?.kind === "audio");
    const videoSender = senders.find((sender) => sender.track?.kind === "video");

    if (audioSender && !audioTrack) {
      pc.removeTrack(audioSender);
    }
    if (videoSender && !videoTrack) {
      pc.removeTrack(videoSender);
    }
    if (audioTrack && !audioSender && stream) {
      pc.addTrack(audioTrack, stream);
    }
    if (videoTrack && !videoSender && stream) {
      pc.addTrack(videoTrack, stream);
    }
    // (removeTrack/addTrack above trigger `onnegotiationneeded` on the peer.)
  }, []);

  const createOfferAndSend = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    try {
      if (pc.signalingState !== "stable") {
        return;
      }
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (pc.localDescription) {
        sendSignalRef.current?.({
          type: "offer",
          toUserId: peerId,
          sdp: pc.localDescription.toJSON(),
        });
      }
    } catch {
      // Transient: another negotiation may have beaten us to this state.
    }
  }, []);

  const ensurePeer = useCallback(
    (peerId: string) => {
      const existing = peersRef.current.get(peerId);
      if (existing) {
        return existing;
      }

      const pc = new RTCPeerConnection({ iceServers: RTC_ICE_SERVERS });
      peersRef.current.set(peerId, pc);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalRef.current?.({
            type: "ice",
            toUserId: peerId,
            candidate: event.candidate.toJSON(),
          });
        }
      };

      pc.ontrack = (event) => {
        const stream = event.streams[0] ?? new MediaStream([event.track]);
        remoteStreamsRef.current.set(peerId, stream);
        commitRemoteStreams();
      };

      pc.onnegotiationneeded = () => {
        void createOfferAndSend(peerId, pc);
      };

      syncTracksIntoPeer(peerId);

      // Deterministic initiator: the smaller id offers first so both sides
      // never fire an offer for the same connection at once (glare).
      const localId = userIdRef.current;
      if (localId != null && localId < peerId) {
        void createOfferAndSend(peerId, pc);
      }

      setPeerCount(peersRef.current.size);
      return pc;
    },
    [commitRemoteStreams, createOfferAndSend, syncTracksIntoPeer],
  );

  const flushPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const pending = pendingCandidatesRef.current.get(peerId);
    if (!pending) {
      return;
    }
    pendingCandidatesRef.current.delete(peerId);
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(candidate);
      } catch {
        // Stale candidate for an already-renegotiated description.
      }
    }
  }, []);

  // Reconcile the peer set whenever the on-stage roster changes.
  useEffect(() => {
    if (!enabled || !userId) {
      return;
    }
    const remoteIds = new Set(remoteUserIds.filter((id) => id !== userId));
    for (const id of remoteIds) {
      ensurePeer(id);
    }
    for (const id of [...peersRef.current.keys()]) {
      if (!remoteIds.has(id)) {
        peersRef.current.get(id)?.close();
        peersRef.current.delete(id);
        remoteStreamsRef.current.delete(id);
        pendingCandidatesRef.current.delete(id);
      }
    }
    setPeerCount(peersRef.current.size);
    commitRemoteStreams();
  }, [enabled, userId, remoteUserIds, ensurePeer, commitRemoteStreams]);

  // Keep every peer's senders in sync with the local camera+mic stream, and
  // broadcast our hardware state so remote tiles update immediately.
  useEffect(() => {
    if (!enabled || !userId || peersRef.current.size === 0) {
      return;
    }
    for (const peerId of peersRef.current.keys()) {
      syncTracksIntoPeer(peerId);
    }
    sendSignalRef.current?.({
      type: "media-state",
      media: { cameraOff: isCameraOff, micMuted: isMicMuted },
    });
  }, [enabled, userId, localStream, isCameraOff, isMicMuted, syncTracksIntoPeer]);

  // Close every peer connection on unmount.
  useEffect(() => {
    const peers = peersRef.current;
    const remoteStreams = remoteStreamsRef.current;
    const pendingCandidates = pendingCandidatesRef.current;
    return () => {
      for (const pc of peers.values()) {
        pc.close();
      }
      peers.clear();
      remoteStreams.clear();
      pendingCandidates.clear();
    };
  }, []);

  const handleSignal = useCallback(
    (signal: LiveMediaSignal) => {
      if (!enabledRef.current || !userIdRef.current) {
        return;
      }
      const fromUserId = signal.fromUserId;
      if (!fromUserId || fromUserId === userIdRef.current) {
        return;
      }
      if (signal.toUserId && signal.toUserId !== userIdRef.current) {
        return;
      }

      switch (signal.type) {
        case "offer": {
          const pc = ensurePeer(fromUserId);
          if (pc.signalingState !== "stable") {
            return;
          }
          // Include our local tracks in the answer before replying.
          syncTracksIntoPeer(fromUserId);
          void pc
            .setRemoteDescription({ type: "offer", sdp: signal.sdp?.sdp ?? "" })
            .then(async () => {
              await flushPendingCandidates(fromUserId, pc);
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              if (pc.localDescription) {
                sendSignalRef.current?.({
                  type: "answer",
                  toUserId: fromUserId,
                  sdp: pc.localDescription.toJSON(),
                });
              }
            })
            .catch(() => {
              // Fall back: drop this peer; the next offer recreates it.
              pc.close();
              peersRef.current.delete(fromUserId);
              remoteStreamsRef.current.delete(fromUserId);
              setPeerCount(peersRef.current.size);
              commitRemoteStreams();
            });
          break;
        }
        case "answer": {
          const pc = ensurePeer(fromUserId);
          if (pc.signalingState === "stable") {
            return;
          }
          void pc
            .setRemoteDescription({ type: "answer", sdp: signal.sdp?.sdp ?? "" })
            .then(() => flushPendingCandidates(fromUserId, pc))
            .catch(() => {});
          break;
        }
        case "ice": {
          if (!signal.candidate) {
            return;
          }
          const pc = ensurePeer(fromUserId);
          if (pc.remoteDescription) {
            void pc.addIceCandidate(signal.candidate).catch(() => {});
          } else {
            const pending = pendingCandidatesRef.current.get(fromUserId) ?? [];
            pending.push(signal.candidate);
            pendingCandidatesRef.current.set(fromUserId, pending);
          }
          break;
        }
        case "media-state": {
          if (signal.media) {
            onRemoteMediaStateRef.current?.(fromUserId, signal.media);
          }
          break;
        }
        default:
          break;
      }
    },
    [ensurePeer, flushPendingCandidates, syncTracksIntoPeer, commitRemoteStreams],
  );

  return { handleSignal, remoteStreams, peerCount };
}

export default useLiveDuelRTC;