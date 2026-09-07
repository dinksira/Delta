/**
 * LiveDuelWorkspaceTemplate — page-level layout for a streaming Live Duel
 * room. Desktop (lg+) uses a 70/30 two-column split: the left column stacks the
 * host stage, on-stage participant grid, and live message bar; the right column
 * stacks the Battle Status and Live Leaderboard panels. Below `lg` everything
 * stacks vertically in reading order.
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
 *   onSendMessage={sendMessage}
 *   onLeaveBattle={handleLeave}
 * />
 * ```
 */

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
  isMicMuted: boolean;
  isCameraOff: boolean;
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
  isMicMuted,
  isCameraOff,
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
          onToggleMic={onToggleMic}
          onToggleCamera={onToggleCamera}
          onLeave={onLeaveBattle}
        />
        <ParticipantGrid participants={participants} />
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