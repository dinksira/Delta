import { Activity } from "lucide-react";

import { ProgressBar } from "@/components/atoms/ProgressBar/ProgressBar";
import type { UserStatus } from "@/modules/Competition/types/hub";
import { cn } from "@/lib/utils";

export interface UserStatusCardProps {
  status: UserStatus;
  className?: string;
}

export function UserStatusCard({ status, className }: Readonly<UserStatusCardProps>) {
  return (
    <section
      aria-label="Your status"
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-full bg-secondary-600 text-white dark:bg-secondary-500">
          <Activity className="size-5" />
        </div>
        <h2 className="text-base font-semibold text-text-primary">Your Status</h2>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xl font-bold text-text-primary">LVL {status.level}</span>
        <span className="rounded-full bg-primary-700 px-2.5 py-1 text-xs font-bold text-white">
          {status.rank}
        </span>
      </div>

      <ProgressBar
        progress={status.progressValue}
        label={status.progressLabel}
        valueText={status.progressText}
      />

      <div className="flex items-center justify-between border-t border-border-default pt-4">
        <div>
          <p className="text-xs text-text-secondary">Total Earnings</p>
          <p className="mt-0.5 text-lg font-semibold text-text-primary">
            {status.earnings}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-secondary">Won</p>
          <p className="mt-0.5 text-lg font-semibold text-text-primary">
            {status.won}
          </p>
        </div>
      </div>
    </section>
  );
}

export default UserStatusCard;
