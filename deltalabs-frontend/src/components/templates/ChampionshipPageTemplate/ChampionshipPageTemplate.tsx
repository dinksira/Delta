import type { ReactNode } from "react";

import { Bot, Link2, Plug, Trophy, UserPlus } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { ChampionshipSeasonCard } from "@/components/organisms/ChampionshipSeasonCard";
import { ChampionshipStageCard } from "@/components/molecules/ChampionshipStageCard";
import { LeaderboardPanel } from "@/components/organisms/LeaderboardPanel";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";
import type {
  ChampionshipNextSeason,
  ChampionshipSeason,
  ChampionshipStage,
} from "@/modules/Competition/types/championship";
import { cn } from "@/lib/utils";

export interface ChampionshipPageTemplateProps {
  onBack?: () => void;
  onIntegrate?: () => void;
  onAutomate?: () => void;
  onInvite?: () => void;
  onCopyLink?: () => void;
  onCreateNew?: () => void;

  season: ChampionshipSeason | null;
  nextSeason: ChampionshipNextSeason | null;
  stages: ChampionshipStage[];
  standings: DuelLeaderboardEntry[];
  onPlayStage?: (stage: ChampionshipStage) => void;

  statusSlot?: ReactNode;
  className?: string;
}

export function ChampionshipPageTemplate({
  onBack,
  onIntegrate,
  onAutomate,
  onInvite,
  onCopyLink,
  onCreateNew,

  season,
  nextSeason,
  stages,
  standings,
  onPlayStage,

  statusSlot,
  className,
}: Readonly<ChampionshipPageTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      {/* Header row: back + trophy icon + title, then Integrate / Automate / Invite + Copy Link */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="" onClick={onBack} />}
          <Trophy className="size-6 shrink-0 text-secondary-600" />
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            Championship
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          {onCreateNew && (
            <Button variant="primary" size="sm" onClick={onCreateNew}>
              <Trophy className="size-4" />
              Create New
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onIntegrate}>
            <Plug className="size-4" />
            Integrate
          </Button>
          <Button variant="ghost" size="sm" onClick={onAutomate}>
            <Bot className="size-4" />
            Automate
          </Button>
          <button
            type="button"
            onClick={onInvite}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-default px-3.5 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <UserPlus className="size-4" />
            Invite
          </button>
          <div className="h-4 w-px bg-border-default" aria-hidden />
          <button
            type="button"
            onClick={onCopyLink}
            aria-label="Copy link"
            className="flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
          >
            <Link2 className="size-4" />
          </button>
        </div>
      </div>

      {statusSlot}

      {/* Season panel */}
      <ChampionshipSeasonCard
        season={season ?? emptySeason}
        nextSeason={nextSeason ?? emptyNextSeason}
      />

      {/* Stages + standings */}
      <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-3">
        <section
          aria-labelledby="championship-stages-heading"
          className="lg:col-span-2"
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <Typography
              as="h2"
              id="championship-stages-heading"
              className="text-lg font-semibold text-text-primary"
            >
              Season Stages
            </Typography>
            <span className="text-sm tabular-nums text-text-secondary">
              {stages.length} stages
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {stages.map((stage) => (
              <ChampionshipStageCard key={stage.id} stage={stage} onPlay={onPlayStage} />
            ))}
          </div>
        </section>

        <LeaderboardPanel entries={standings} />
      </div>
    </div>
  );
}

const emptySeason: ChampionshipSeason = {
  id: "",
  number: 1,
  title: "Championship",
  status: "active",
  startsAt: "",
  endsAt: "",
  totalStages: 0,
  completedStages: 0,
  currentStageOrder: null,
  pointsEarned: 0,
  totalPoints: 0,
  playerRank: 0,
  totalPlayers: 0,
};

const emptyNextSeason: ChampionshipNextSeason = {
  number: 2,
  title: "Next Season",
  isUnlocked: false,
  unlockHint: "Complete the current season to unlock the next one.",
};

export default ChampionshipPageTemplate;