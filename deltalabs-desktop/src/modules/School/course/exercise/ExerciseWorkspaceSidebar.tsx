"use client";

import { ChevronDown, Ghost, Package } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/theme";
import { fetchOrgMedia } from "@/modules/School/api";
import {
  EXERCISE_RESOURCE_DRAG_MIME,
  encodeExerciseResourceDrag,
} from "@/modules/School/course/exercise/exerciseResourceDrag";

export type ExerciseSidebarState = Readonly<{
  title: string;
  totalMark: string;
  timeMinutes: string;
  takeWithFriend: boolean;
  visibility: "public" | "private" | "unlisted";
}>;

export type ExerciseSidebarResource = Readonly<{
  id: string;
  name: string;
  status: string;
  kind: "resource" | "variant" | "input";
  detail?: string;
  mediaId?: string;
  previewUrl?: string;
  fileName?: string;
  /** Approved (or ready input) — can drag into questions. */
  usable?: boolean;
}>;

function ResourceCard({
  orgId,
  resource,
  readOnly,
}: Readonly<{
  orgId: string;
  resource: ExerciseSidebarResource;
  readOnly?: boolean;
}>) {
  const [previewUrl, setPreviewUrl] = useState(resource.previewUrl?.trim() || "");

  useEffect(() => {
    setPreviewUrl(resource.previewUrl?.trim() || "");
  }, [resource.previewUrl]);

  useEffect(() => {
    const mediaId = resource.mediaId?.trim();
    if (!orgId || !mediaId || previewUrl) return;
    let cancelled = false;
    void (async () => {
      try {
        const asset = await fetchOrgMedia(orgId, mediaId);
        const url = String(
          asset.playbackUrl ||
            (asset as { playback_url?: string }).playback_url ||
            asset.hlsUrl ||
            (asset as { hls_url?: string }).hls_url ||
            "",
        ).trim();
        if (!cancelled && url) setPreviewUrl(url);
      } catch {
        // Keep placeholder.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orgId, previewUrl, resource.mediaId]);

  const canDrag = Boolean(resource.usable && (previewUrl || resource.mediaId) && !readOnly);

  return (
    <li
      draggable={canDrag}
      onDragStart={(e) => {
        if (!canDrag) return;
        const payload = encodeExerciseResourceDrag({
          id: resource.id,
          name: resource.name,
          mediaId: resource.mediaId,
          previewUrl: previewUrl || resource.previewUrl,
          fileName: resource.fileName || resource.name,
        });
        e.dataTransfer.setData(EXERCISE_RESOURCE_DRAG_MIME, payload);
        e.dataTransfer.setData("text/plain", payload);
        e.dataTransfer.effectAllowed = "copy";
      }}
      className={[
        "overflow-hidden rounded-xl border border-[#d5dee6] bg-[#f7fafc]",
        canDrag ? "cursor-grab active:cursor-grabbing hover:border-primary-400" : "",
      ].join(" ")}
      title={
        canDrag
          ? "Drag onto the question stem or an option"
          : resource.usable
            ? "Resource has no preview yet"
            : "Approve this variant before using it in questions"
      }
    >
      {previewUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt={resource.fileName || resource.name} className="h-28 w-full object-cover" />
      ) : (
        <div className="flex h-20 items-center justify-center bg-[#e8eef2] text-[#8a9aab]">
          {resource.kind === "resource" || resource.kind === "input" ? (
            <Package className="size-7" aria-hidden />
          ) : (
            <Ghost className="size-7" aria-hidden />
          )}
        </div>
      )}
      <div className="px-3 py-2.5">
        <p className="truncate text-sm font-semibold text-[#0f2a3d]">{resource.name}</p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[#8a9aab]">
          {resource.kind === "input" ? "Ready input" : resource.kind} · {resource.status}
          {canDrag ? " · drag to use" : ""}
        </p>
        {resource.fileName || resource.detail ? (
          <p className="mt-1 truncate text-xs text-[#5a6b7a]">{resource.fileName || resource.detail}</p>
        ) : null}
      </div>
    </li>
  );
}

export function ExerciseWorkspaceSidebar({
  state,
  sidebarTab,
  busy,
  readOnly = false,
  orgId = "",
  resources = [],
  productKind = "exercise",
  onSidebarTabChange,
  onChange,
  onSaveDraft,
  onPublish,
  onTrash,
}: Readonly<{
  state: ExerciseSidebarState;
  sidebarTab: "features" | "resources";
  busy?: boolean;
  readOnly?: boolean;
  orgId?: string;
  resources?: readonly ExerciseSidebarResource[];
  productKind?: "exercise" | "test";
  onSidebarTabChange: (tab: "features" | "resources") => void;
  onChange: (patch: Partial<ExerciseSidebarState>) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onTrash: () => void;
}>) {
  const [configureOpen, setConfigureOpen] = useState(true);
  const [visibilityOpen, setVisibilityOpen] = useState(true);
  const controlsDisabled = Boolean(busy || readOnly);

  return (
    <aside className="flex h-full w-full flex-col border-l border-[#e3ebf1] bg-white lg:w-[22rem]">
      <div className="flex gap-2 border-b border-[#e3ebf1] p-4">
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="flex-1"
          disabled={controlsDisabled}
          onClick={onSaveDraft}
        >
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          className="flex-1"
          disabled={controlsDisabled}
          onClick={onPublish}
        >
          Publish
        </Button>
      </div>

      <div className="flex gap-4 border-b border-[#e3ebf1] px-4 pt-3">
        {(
          [
            ["features", productKind === "test" ? "Test Features" : "Exercise Features"],
            ["resources", "Resources"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={[
              "border-b-2 pb-2.5 text-sm font-medium transition-colors",
              sidebarTab === id
                ? "border-primary-700 text-primary-900"
                : "border-transparent text-[#8a9aab] hover:text-[#0f2a3d]",
            ].join(" ")}
            onClick={() => onSidebarTabChange(id)}
          >
            {label}
            {id === "resources" && resources.length > 0 ? (
              <span className="ml-1 text-[11px] text-[#8a9aab]">({resources.length})</span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {sidebarTab === "resources" ? (
          resources.length === 0 ? (
            <p className="text-sm text-[#8a9aab]">
              Approved ghost variants appear here with a preview. Drag them onto the question stem
              (or an option) to insert.
            </p>
          ) : (
            <ul className="space-y-2">
              {resources.map((r) => (
                <ResourceCard key={r.id} orgId={orgId} resource={r} readOnly={readOnly} />
              ))}
            </ul>
          )
        ) : (
          <div className="space-y-4">
            <Section
              title="Configure"
              open={configureOpen}
              onToggle={() => setConfigureOpen((o) => !o)}
            >
              <Field label="Rename">
                <input
                  value={state.title}
                  disabled={controlsDisabled}
                  className="w-full border-b border-[#c5d0da] bg-transparent py-1 text-sm font-medium text-[#0f2a3d] outline-none focus:border-primary-600 disabled:opacity-70"
                  onChange={(e) => onChange({ title: e.target.value })}
                />
              </Field>
              <Field label="Total Mark">
                <input
                  value={state.totalMark}
                  placeholder="—"
                  inputMode="numeric"
                  disabled={controlsDisabled}
                  className="w-full rounded-lg border border-[#c5d0da] px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 disabled:opacity-70"
                  onChange={(e) => onChange({ totalMark: e.target.value })}
                />
              </Field>
              <Field label="Time Given">
                <div className="flex items-center gap-2">
                  <input
                    value={state.timeMinutes}
                    placeholder="—"
                    inputMode="numeric"
                    disabled={controlsDisabled}
                    className="w-20 rounded-lg border border-[#c5d0da] px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 disabled:opacity-70"
                    onChange={(e) => onChange({ timeMinutes: e.target.value })}
                  />
                  <span className="text-xs text-[#8a9aab]">minutes</span>
                </div>
              </Field>
              <label className="flex items-center gap-2 text-sm text-[#0f2a3d]">
                <input
                  type="checkbox"
                  checked={state.takeWithFriend}
                  disabled={controlsDisabled}
                  onChange={(e) => onChange({ takeWithFriend: e.target.checked })}
                />
                Take with friend
              </label>
            </Section>

            <Section
              title="Visibility"
              open={visibilityOpen}
              onToggle={() => setVisibilityOpen((o) => !o)}
            >
              <select
                value={state.visibility}
                disabled={controlsDisabled}
                className="w-full rounded-lg border border-[#c5d0da] px-2.5 py-1.5 text-sm outline-none focus:border-primary-500 disabled:opacity-70"
                onChange={(e) =>
                  onChange({
                    visibility: e.target.value as ExerciseSidebarState["visibility"],
                  })
                }
              >
                <option value="public">Public</option>
                <option value="unlisted">Unlisted</option>
                <option value="private">Private</option>
              </select>
            </Section>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full text-red-700"
              disabled={controlsDisabled}
              onClick={onTrash}
            >
              Move to trash
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: Readonly<{
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}>) {
  return (
    <div className="rounded-xl border border-[#e3ebf1]">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-semibold text-[#0f2a3d]"
        onClick={onToggle}
      >
        {title}
        <ChevronDown
          className={["size-4 text-[#8a9aab] transition-transform", open ? "rotate-180" : ""].join(" ")}
          aria-hidden
        />
      </button>
      {open ? <div className="space-y-3 border-t border-[#e3ebf1] px-3 py-3">{children}</div> : null}
    </div>
  );
}

function Field({
  label,
  children,
}: Readonly<{
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-[#5a6b7a]">{label}</span>
      {children}
    </label>
  );
}
