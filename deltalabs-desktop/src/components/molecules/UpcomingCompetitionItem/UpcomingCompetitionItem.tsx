import { Badge } from "@/components/atoms/Badge/Badge";
import { cn } from "@/lib/utils";

export type CompetitionStatusTone =
  | "filling"
  | "starting"
  | "live"
  | "finished"
  | "default";

export interface UpcomingCompetitionItemProps {
  id: string;
  title: string;
  /** Secondary line, e.g. "Physics • 32 players". */
  meta: string;
  statusLabel: string;
  statusTone?: CompetitionStatusTone;
  /** Fee caption, e.g. "Fee: 250 ETB" or "Free". */
  fee: string;
  onOpen?: (id: string) => void;
  className?: string;
}

const statusDotClasses: Record<CompetitionStatusTone, string> = {
  filling: "bg-success-500",
  starting: "bg-warning-500",
  live: "bg-error-500",
  finished: "bg-text-tertiary",
  default: "bg-text-tertiary",
};

const badgeVariantMap: Record<CompetitionStatusTone, "success" | "warning" | "error" | "info" | "default"> = {
  filling: "success",
  starting: "warning",
  live: "error",
  finished: "default",
  default: "default",
};

export function UpcomingCompetitionItem({
  id,
  title,
  meta,
  statusLabel,
  statusTone = "default",
  fee,
  onOpen,
  className,
}: Readonly<UpcomingCompetitionItemProps>) {
  const content = (
    <>
      <span
        aria-hidden
        className={cn(
          "mt-1.5 size-2.5 shrink-0 rounded-full",
          statusDotClasses[statusTone],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text-primary">
          {title}
        </p>
        <p className="truncate text-xs text-text-secondary">{meta}</p>
      </div>
      <Badge variant={badgeVariantMap[statusTone]}>{statusLabel}</Badge>
      <span className="w-20 shrink-0 text-right text-xs font-semibold text-text-secondary">
        {fee}
      </span>
    </>
  );

  const itemClasses = cn(
    "flex w-full items-center gap-3 rounded-xl border border-border-default bg-surface-muted px-4 py-3 text-left transition-colors",
    onOpen ? "cursor-pointer hover:border-primary-300 hover:bg-primary-50/40" : "cursor-default",
    className,
  );

  return onOpen ? (
    <button type="button" onClick={() => onOpen(id)} className={itemClasses}>
      {content}
    </button>
  ) : (
    <div className={itemClasses}>{content}</div>
  );
}

export default UpcomingCompetitionItem;
