/**
 * LiveDuelWorkspaceTemplate — page-level layout for a streaming Live Duel
 * room. Desktop (lg+) uses a 70/30 two-column split: the left column stacks the
 * host stage, on-stage participant grid, and live message bar; the right column
 * stacks the Battle Status and Live Leaderboard panels. Below `lg` everything
 * stacks vertically in reading order. The template threads the current user's
 * live media (camera self-view + voice-activity) to the host stage and
 * participant grid, plus the room's simulated speaker rotation.
 *
 * @example
 * ```tsx
 * <LiveDuelWorkspaceTemplate
 *   title="World Geography Challenge"
 *   host={{ name: "Dr. Sarah Martinez", subtitle: "World Geography Challenge" }}
 *   viewerCount={1247}
 *   liveQuestion={liveQuestion}
 *   chatMessages={chat}
 *   participants={roster}
 *   leaderboard={scores}
 *   isMicMuted={false}
 *   isCameraOff={false}
 *   isHost
 *   mediaStream={mediaStream}
 *   voiceLevel={voiceLevel}
 *   isSpeaking={userSpeaking}
 *   speakingIds={speakingIds}
 *   onSendMessage={sendMessage}
 *   onLeaveBattle={handleLeave}
 * />
 * ```
 */

import type { ReactNode } from "react";

import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import type {
  LiveChatMessage,
  LiveParticipant,
  LiveQuestion,
} from "@/modules/Competition/types/liveDuel";
import { LiveHostStage } from "@/components/organisms/LiveHostStage";
import { ParticipantGrid } from "@/components/organisms/ParticipantGrid";
import { BattleStatusPanel } from "@/components/organisms/BattleStatusPanel";
import { LiveLeaderboardPanel } from "@/components/organisms/LiveLeaderboardPanel";
import { LiveMessageBar } from "@/components/molecules/LiveMessageBar";
import type { LiveHostStageHost } from "@/components/organisms/LiveHostStage";
import { cn } from "@/lib/utils";

export interface LiveDuelWorkspaceTemplateProps {
  /** Room / battle title shown in the right-sidebar status panel. */
  title: string;
  host: LiveHostStageHost;
  viewerCount: number;
  liveQuestion: LiveQuestion | null;
  chatMessages: LiveChatMessage[];
  participants: LiveParticipant[];
  leaderboard: DuelLeaderboardEntry[];
  /** Total active players; defaults to the on-stage roster size. */
  activePlayers?: number;
  /** Host-only content (e.g. `HostControlPanel`) rendered under the stage. */
  hostControlSlot?: ReactNode;
  isMicMuted: boolean;
  isCameraOff: boolean;
  /** True when the current user is the room host (broadcaster). */
  isHost?: boolean;
  /** Current-user live camera stream (host stage + own participant tile). */
  mediaStream?: MediaStream | null;
  /** Non-null when getUserMedia failed (permission denied, no device, etc.). */
  mediaError?: string | null;
  /** Real voice-activity state for the current user's voice ripple. */
  isSpeaking?: boolean;
  /** Normalized voice level 0–1 (scales the speaker's ocean ripple). */
  voiceLevel?: number;
  /** Remote camera streams keyed by participant id (WebRTC mesh). */
  participantStreams?: Readonly<Record<string, MediaStream>>;
  /** Participant ids whose cards should show the speaking ripple. */
  speakingIds?: ReadonlySet<string>;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onSendMessage: (text: string) => void;
  onLeaveBattle?: () => void;
  className?: string;
}

export function LiveDuelWorkspaceTemplate({
  title,
  host,
  viewerCount,
  liveQuestion,
  chatMessages,
  participants,
  leaderboard,
  activePlayers = participants.length,
  hostControlSlot,
  isMicMuted,
  isCameraOff,
  isHost = false,
  mediaStream = null,
  mediaError = null,
  isSpeaking = false,
  voiceLevel = 0,
  participantStreams,
  speakingIds,
  onToggleMic,
  onToggleCamera,
  onSendMessage,
  onLeaveBattle,
  className,
}: Readonly<LiveDuelWorkspaceTemplateProps>) {
  return (
    <div className={cn("flex flex-col gap-5 lg:flex-row lg:items-stretch", className)}>
      <main className="flex min-w-0 flex-1 flex-col gap-5">
        <LiveHostStage
          host={host}
          viewerCount={viewerCount}
          liveQuestion={liveQuestion}
          chatMessages={chatMessages}
          isMicMuted={isMicMuted}
          isCameraOff={isCameraOff}
          isHost={isHost}
          mediaStream={mediaStream}
          mediaError={mediaError}
          isSpeaking={isSpeaking}
          voiceLevel={voiceLevel}
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onLeave={onLeaveBattle}
        />
        {hostControlSlot}
        <ParticipantGrid
          participants={participants}
          userMediaStream={mediaStream}
          userIsSpeaking={isSpeaking}
          userVoiceLevel={voiceLevel}
          remoteStreams={participantStreams}
          speakingIds={speakingIds}
        />
        <LiveMessageBar onSend={onSendMessage} />
      </main>

      <aside className="flex w-full shrink-0 flex-col gap-5 lg:w-[340px]">
        <BattleStatusPanel
          battleTitle={title}
          hostName={host.name}
          activePlayers={activePlayers}
          onLeave={onLeaveBattle}
        />
        <LiveLeaderboardPanel entries={leaderboard} />
      </aside>
    </div>
  );
}

export default LiveDuelWorkspaceTemplate;