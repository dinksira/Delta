/**
 * MyCompetitionToolbar
 * Right-aligned toolbar shown when My Competitions tab is active:
 * DateRangeSelector + TableTagSelector + Host Competition button.
 */

import { Plus } from "lucide-react";

import { DateRangeSelector } from "@/components/molecules/DateRangeSelector/DateRangeSelector";
import { TableTagSelector } from "@/components/molecules/TableTagSelector/TableTagSelector";
import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";

export interface MyCompetitionToolbarProps {
  onHostCompetition?: () => void;
  className?: string;
}

export function MyCompetitionToolbar({
  onHostCompetition,
  className,
}: Readonly<MyCompetitionToolbarProps>) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <DateRangeSelector />
      <TableTagSelector />
      <Button variant="primary" size="sm" onClick={onHostCompetition}>
        <Plus className="size-4" />
        Host Competition
      </Button>
    </div>
  );
}
