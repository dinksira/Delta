"use client";

import { useQuery } from "@tanstack/react-query";

import { ApiError } from "@/lib/apiClient";
import { fetchSchoolGhostEvents } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function labelForEvent(type: string): string {
  switch (type) {
    case "created":
      return "Ghost created";
    case "property_updated":
      return "Property updated";
    case "variant_added":
      return "Variant added";
    case "variant_updated":
      return "Variant updated";
    case "edge_added":
      return "Chain connection added";
    case "edge_removed":
      return "Chain connection removed";
    case "submitted":
      return "Submitted for review";
    case "reviewed":
      return "Reviewed";
    case "upstream_completed":
      return "Upstream completed";
    case "notified_downstream":
      return "Downstream notified";
    case "downstream_unlocked":
      return "Downstream unlocked";
    case "branch_merged":
      return "Branch merged into base";
    case "fulfilled":
      return "Ghost fulfilled";
    default:
      return type.replaceAll("_", " ");
  }
}

/** History tab — append-only events (Figma clock tab). */
export function GhostHistoryTab({
  orgId,
  schoolId,
  ghostId,
}: Readonly<{
  orgId: string;
  schoolId: string;
  ghostId: string;
}>) {
  const query = useQuery({
    queryKey: schoolQueryKeys.ghostEvents(orgId, schoolId, ghostId),
    queryFn: () => fetchSchoolGhostEvents(orgId, schoolId, ghostId),
    enabled: Boolean(ghostId),
  });

  if (query.isPending) {
    return (
      <div className="space-y-2 px-4 py-4">
        <div className="h-10 animate-pulse rounded-lg bg-white/70" />
        <div className="h-10 animate-pulse rounded-lg bg-white/70" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <p className="px-4 py-6 text-sm text-red-600">
        {query.error instanceof ApiError ? query.error.message : "Could not load history."}
      </p>
    );
  }

  const items = query.data?.items ?? [];
  if (items.length === 0) {
    return <p className="px-4 py-10 text-center text-sm text-[#8a9aab]">No history yet.</p>;
  }

  return (
    <ul className="space-y-2 overflow-y-auto px-4 py-4">
      {items.map((ev) => (
        <li
          key={ev.id}
          className="rounded-xl border border-[#d5dee6] bg-white px-3.5 py-3 shadow-sm"
        >
          <p className="text-sm font-semibold text-[#0f2a3d]">{labelForEvent(ev.type)}</p>
          {typeof ev.meta.message === "string" && ev.meta.message ? (
            <p className="mt-1 text-xs text-[#5a6b7a]">{ev.meta.message}</p>
          ) : null}
          <p className="mt-0.5 text-xs text-[#8a9aab]">
            {new Date(ev.createdAt).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
