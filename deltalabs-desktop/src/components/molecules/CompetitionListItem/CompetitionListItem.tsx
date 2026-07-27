/**
 * CompetitionListItem
 * Row with status dot, title, subtitle, status badge, and fee text.
 */

import { Badge } from "@/components/atoms/Badge/Badge";
import { StatusDot } from "@/components/atoms/StatusDot/StatusDot";
import type { StatusDotVariant } from "@/components/atoms/StatusDot/StatusDot";
import { cn } from "@/lib/utils";

export interface CompetitionListItemProps {
  title: string;
  category: string;
  playerCount: number;
  status: StatusDotVariant;
  fee: string;
  className?: string;
}

const badgeVariantMap: Record<StatusDotVariant, "success" | "warning"> = {
  filling: "success",
  starting: "warning",
};

export function CompetitionListItem({
  title,
  category,
  playerCount,
  status,
  fee,
  className,
}: Readonly<CompetitionListItemProps>) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)}>
      <StatusDot variant={status} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary truncate">{title}</p>
        <p className="text-xs text-text-secondary">
          {category} &bull; {playerCount} players
        </p>
      </div>
      <div className="flex flex-col items-end gap-0.5 shrink-0">
        <Badge variant={badgeVariantMap[status]}>
          {status === "filling" ? "Filling" : "Starting"}
        </Badge>
        <span className="text-[11px] text-text-secondary">{fee}</span>
      </div>
    </div>
  );
}
