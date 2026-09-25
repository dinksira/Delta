/**
 * BattleStatusPanel — the "Battle Status" dashboard card for a Live Duel room
 * (top of the right sidebar). Shows active player count, a LIVE status badge,
 * the host identity, and a full-width "Leave Battle" action.
 *
 * @example
 * ```tsx
 * <BattleStatusPanel
 *   battleTitle="World Geography Challenge"
 *   hostName="Dr. Sarah Martinez"
 *   activePlayers={8}
 *   onLeave={handleLeave}
 * />
 * ```
 */

import { Crown, Radio, Swords, Users } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";

export interface BattleStatusPanelProps {
  battleTitle: string;
  hostName?: string;
  activePlayers: number;
  onLeave?: () => void;
  className?: string;
}

export function BattleStatusPanel({
  battleTitle,
  hostName,
  activePlayers,
  onLeave,
  className,
}: Readonly<BattleStatusPanelProps>) {
  return (
    <aside
      aria-label="Battle status"
      className={cn("rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm", className)}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Swords className="size-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-bold uppercase tracking-wide text-text-primary">
            Battle Status
          </h3>
          <p className="truncate text-xs text-text-secondary">{battleTitle}</p>
        </div>
      </div>

      <dl className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Users className="size-4 text-text-tertiary" aria-hidden />
            Active Players
          </dt>
          <dd className="text-sm font-bold tabular-nums text-text-primary">
            {activePlayers.toLocaleString()}
          </dd>
        </div>

        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2 text-sm font-medium text-text-secondary">
            <Radio className="size-4 text-text-tertiary" aria-hidden />
            Status
          </dt>
          <dd>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-error-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-error-600 dark:bg-error-900/40 dark:text-error-400">
              <span className="size-1.5 rounded-full bg-error-600" aria-hidden />
              Live
            </span>
          </dd>
        </div>

        {hostName ? (
          <div className="flex items-center justify-between gap-3">
            <dt className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Crown className="size-4 text-text-tertiary" aria-hidden />
              Host
            </dt>
            <dd className="max-w-[60%] truncate text-sm font-semibold text-text-primary">
              {hostName}
            </dd>
          </div>
        ) : null}
      </dl>

      <Button variant="primary" size="lg" onClick={onLeave} className="mt-4 w-full">
        Leave Battle
      </Button>
    </aside>
  );
}

export default BattleStatusPanel;