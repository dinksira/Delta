import { CONTENT_TYPE_META } from "@/modules/School/roadmap/contentTypeMeta";
import { CLASS_ROADMAP_DRAG_MIME, type ClassRoadmapSidebarResource } from "@/modules/School/roadmap/types";

export function ClassRoadmapResourceRow({
  resource,
  draggable = true,
}: Readonly<{
  resource: ClassRoadmapSidebarResource;
  draggable?: boolean;
}>) {
  const meta = CONTENT_TYPE_META[resource.contentType] ?? CONTENT_TYPE_META.session;
  const Icon = meta.icon;

  return (
    <div
      draggable={draggable}
      onDragStart={(e) => {
        e.dataTransfer.setData(CLASS_ROADMAP_DRAG_MIME, JSON.stringify(resource));
        e.dataTransfer.effectAllowed = "copy";
      }}
      className="flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-border-default hover:bg-surface-muted/50 active:cursor-grabbing"
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-text-primary">{resource.title}</span>
        {resource.subtitle ? (
          <span className="block truncate text-xs text-text-tertiary">{resource.subtitle}</span>
        ) : (
          <span className="block truncate text-xs text-text-tertiary">{meta.label}</span>
        )}
      </span>
    </div>
  );
}
