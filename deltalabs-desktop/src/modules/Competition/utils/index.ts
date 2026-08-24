/**
 * Competition display helpers and hub stat derivation.
 *
 * @example
 * ```ts
 * const stats = deriveHubStats(battles);
 * ```
 */

import type { CompetitionStatusTone } from "@/components/molecules/UpcomingCompetitionItem/UpcomingCompetitionItem";
import type { HubStats } from "@/modules/Competition/types/hub";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";

export function toStatusTone(status: string): CompetitionStatusTone {
  switch (status.toLowerCase()) {
    case "filling":
      return "filling";
    case "scheduled":
      return "starting";
    case "live":
      return "live";
    case "finished":
      return "finished";
    default:
      return "default";
  }
}

export function toUpcomingItem(battle: TopicBattle): {
  id: string;
  title: string;
  meta: string;
  statusLabel: string;
  statusTone: CompetitionStatusTone;
  fee: string;
} {
  const isFree = battle.entryFee.trim().toLowerCase() === "free";
  return {
    id: battle.id,
    title: battle.title,
    meta: `${battle.subject} • ${battle.playersJoined} player${battle.playersJoined === 1 ? "" : "s"}`,
    statusLabel: getStatusLabel(battle.status),
    statusTone: toStatusTone(battle.status),
    fee: isFree ? "Free" : `Fee: ${battle.entryFee}`,
  };
}

export function getCategoryLabel(category: string): string {
  switch (category) {
    case "active":
      return "Active Competition";
    case "recent":
      return "Recent Competition";
    case "community":
      return "Community Competition";
    default:
      return category;
  }
}

export function formatEndsDate(value: string | null | undefined): string {
  if (!value) {
    return "Open now";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getStatusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "filling":
      return "Filling";
    case "scheduled":
      return "Starting";
    case "live":
      return "Live";
    case "finished":
      return "Finished";
    default:
      return status;
  }
}

export function getFormatLabel(formatId: string): string {
  switch (formatId) {
    case "1v1":
      return "1 VS 1 Duel";
    case "mini":
      return "Mini Tournament";
    case "t8":
      return "Tournament (8)";
    case "t16":
      return "Tournament (16)";
    case "t32":
      return "Tournament (32)";
    default:
      return formatId;
  }
}

export function getPrizeRuleLabel(prizeRule: string): string {
  switch (prizeRule) {
    case "winner-takes-all":
      return "Winner Takes All";
    case "top-3-split":
      return "Top 3 Split";
    case "split-pot":
      return "Split Pot";
    default:
      return prizeRule;
  }
}

export function getVisibilityLabel(visibility: string): string {
  switch (visibility) {
    case "public":
      return "Public Match";
    case "private":
      return "Private Match";
    default:
      return visibility;
  }
}

export function getTimingLabel(timing: string): string {
  switch (timing) {
    case "instant":
      return "Starts instantly";
    case "schedule":
      return "Scheduled";
    default:
      return timing;
  }
}

/** Status badge tones, shared by TopicBattleCard and BattleSummaryPanel. */
export const statusBadgeClasses: Record<string, string> = {
  filling: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  scheduled: "bg-success-600 text-white",
  live: "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300",
  finished: "bg-surface-muted text-text-secondary",
};

export function getStatusBadgeClass(status: string): string {
  return statusBadgeClasses[status.toLowerCase()] ?? "bg-surface-muted text-text-secondary";
}

/** Two-letter monogram from a name, e.g. "Delta Labs" -> "DL". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function deriveHubStats(battles: TopicBattle[]): HubStats {
  const fillingNow = battles.filter((battle) => battle.status.toLowerCase() === "filling").length;

  const prizeValues = battles
    .map((battle) => {
      const match = battle.prizePool.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      return match ? Number(match[1]) : 0;
    })
    .filter((value) => value > 0);

  const topPrizePool =
    prizeValues.length > 0
      ? `${
          Math.max(...prizeValues) >= 1000
            ? Math.round(Math.max(...prizeValues) / 1000) + "K"
            : Math.round(Math.max(...prizeValues)).toString()
        }+`
      : "—";

  return {
    totalCompetitions: battles.length,
    totalPlayers: battles.reduce((sum, battle) => sum + battle.playersJoined, 0),
    fillingNow,
    topPrizePool,
  };
}
