import { FileText, X } from "lucide-react";

import type { ClassRoadmapAttachedResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapAttachedItem({
  resource,
  onRemove,
  canMutate,
}: Readonly<{
  resource: ClassRoadmapAttachedResource;
  onRemove?: () => void;
  canMutate: boolean;
}>) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-muted/30 px-2.5 py-2">
      <FileText className="size-4 shrink-0 text-primary-600" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-text-primary">{resource.title}</p>
        {resource.subtitle ? (
          <p className="truncate text-[10px] text-text-tertiary">{resource.subtitle}</p>
        ) : null}
      </div>
      {canMutate && onRemove ? (
        <button
          type="button"
          className="rounded p-0.5 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
          aria-label={`Remove ${resource.title}`}
          onClick={onRemove}
        >
          <X className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}
