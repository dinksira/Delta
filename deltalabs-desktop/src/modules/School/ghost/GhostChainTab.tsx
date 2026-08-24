"use client";

import { Maximize2, Minimize2, Plus, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/theme";
import type { GhostDto, GhostEdgeDto, GhostNodeDto } from "@/modules/School/api";

type Point = { x: number; y: number };
type CanvasSize = "normal" | "minimized" | "maximized";

const NODE_W = 148;
const NODE_H = 64;
const LAYOUT_KEY = (ghostId: string) => `ghost-chain-layout:${ghostId}`;

function statusLabel(status: GhostNodeDto["status"]): string {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "in_progress":
      return "In progress";
    default:
      return "Open";
  }
}

function loadLayout(ghostId: string): Record<string, Point> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY(ghostId));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Point>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveLayout(ghostId: string, positions: Record<string, Point>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LAYOUT_KEY(ghostId), JSON.stringify(positions));
  } catch {
    /* ignore quota */
  }
}

/** Seed missing node positions without forcing a left→right auto layout. */
function ensurePositions(
  nodes: readonly GhostNodeDto[],
  edges: readonly GhostEdgeDto[],
  existing: Record<string, Point>,
): Record<string, Point> {
  const next = { ...existing };
  const parentOf = new Map<string, string>();
  for (const e of edges) {
    if (!parentOf.has(e.toVariantId)) parentOf.set(e.toVariantId, e.fromVariantId);
  }

  nodes.forEach((n, i) => {
    if (next[n.id]) return;
    const parentId = parentOf.get(n.id);
    const parentPos = parentId ? next[parentId] : null;
    if (parentPos) {
      const siblingIndex = edges
        .filter((edge) => edge.fromVariantId === parentId)
        .findIndex((edge) => edge.toVariantId === n.id);
      next[n.id] = {
        x: parentPos.x + NODE_W + 56,
        y: parentPos.y + Math.max(0, siblingIndex) * (NODE_H + 28),
      };
      return;
    }
    next[n.id] = {
      x: 32 + (i % 3) * (NODE_W + 40),
      y: 48 + Math.floor(i / 3) * (NODE_H + 48),
    };
  });
  return next;
}

function edgeAnchors(from: Point, to: Point): { x1: number; y1: number; x2: number; y2: number } {
  const fromCx = from.x + NODE_W / 2;
  const fromCy = from.y + NODE_H / 2;
  const toCx = to.x + NODE_W / 2;
  const toCy = to.y + NODE_H / 2;
  const dx = toCx - fromCx;
  const dy = toCy - fromCy;
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= 0) {
      return { x1: from.x + NODE_W, y1: fromCy, x2: to.x, y2: toCy };
    }
    return { x1: from.x, y1: fromCy, x2: to.x + NODE_W, y2: toCy };
  }
  if (dy >= 0) {
    return { x1: fromCx, y1: from.y + NODE_H, x2: toCx, y2: to.y };
  }
  return { x1: fromCx, y1: from.y, x2: toCx, y2: to.y + NODE_H };
}

/** Chain tab — free drag, directed requirement edges (you choose the flow). */
export function GhostChainTab({
  ghost,
  canMutate,
  currentUserId,
  busy,
  onAddVariant,
  onConnectEdge,
  onDisconnectEdge,
  onReverseEdge,
  onSubmit,
  onApprove,
  onOpenWork,
}: Readonly<{
  ghost: GhostDto;
  canMutate: boolean;
  /** When set, assignees can Open work / Submit on their nodes without school:manage. */
  currentUserId?: string | null;
  busy?: boolean;
  onAddVariant: (fromNodeId?: string | null) => void;
  onConnectEdge: (fromVariantId: string, toVariantId: string) => void;
  onDisconnectEdge?: (edgeId: string) => void;
  onReverseEdge?: (edge: { edgeId: string; fromVariantId: string; toVariantId: string }) => void;
  onSubmit: (variantId: string) => void;
  onApprove: (variantId: string) => void;
  onOpenWork?: (variantId: string) => void;
}>) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState<CanvasSize>("normal");
  const [positions, setPositions] = useState<Record<string, Point>>(() =>
    ensurePositions(ghost.nodes, ghost.edges, loadLayout(ghost.id)),
  );
  /** Active wire-draw: `out` = this node is requirement → drop on dependent; `in` = this depends on → drop on requirement. */
  const [linkDraft, setLinkDraft] = useState<null | {
    startNodeId: string;
    mode: "out" | "in";
  }>(null);
  const [linkCursor, setLinkCursor] = useState<Point | null>(null);
  const [pendingPair, setPendingPair] = useState<null | { a: string; b: string }>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const canvasRef = useRef<HTMLDivElement>(null);
  const linkDraftRef = useRef(linkDraft);
  linkDraftRef.current = linkDraft;
  const ignoreLinkUpRef = useRef(false);
  const linkMovedRef = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setLinkDraft(null);
        setLinkCursor(null);
        setPendingPair(null);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setPositions((prev) => {
      const merged = ensurePositions(ghost.nodes, ghost.edges, {
        ...loadLayout(ghost.id),
        ...prev,
      });
      const ids = new Set(ghost.nodes.map((n) => n.id));
      const pruned: Record<string, Point> = {};
      for (const [id, pos] of Object.entries(merged)) {
        if (ids.has(id)) pruned[id] = pos;
      }
      saveLayout(ghost.id, pruned);
      return pruned;
    });
  }, [ghost.id, ghost.nodes, ghost.edges]);

  const persist = useCallback(
    (next: Record<string, Point>) => {
      setPositions(next);
      saveLayout(ghost.id, next);
    },
    [ghost.id],
  );

  const selected = ghost.nodes.find((n) => n.id === selectedId) ?? null;
  const canWorkSelected = Boolean(
    selected &&
      (canMutate ||
        (currentUserId && selected.assigneeUserIds.some((id) => id === currentUserId)) ||
        (currentUserId &&
          ghost.createdByUserId === currentUserId &&
          selected.assigneeUserIds.length === 0)),
  );
  const nodeById = useMemo(() => new Map(ghost.nodes.map((n) => [n.id, n])), [ghost.nodes]);

  const canvasBounds = useMemo(() => {
    const vals = Object.values(positions);
    if (vals.length === 0) return { width: 480, height: 280 };
    return {
      width: Math.max(480, ...vals.map((p) => p.x + NODE_W + 120)),
      height: Math.max(280, ...vals.map((p) => p.y + NODE_H + 120)),
    };
  }, [positions]);

  const clientToCanvas = useCallback((clientX: number, clientY: number): Point => {
    const el = canvasRef.current;
    if (!el) return { x: clientX, y: clientY };
    const rect = el.getBoundingClientRect();
    return {
      x: clientX - rect.left + el.scrollLeft,
      y: clientY - rect.top + el.scrollTop,
    };
  }, []);

  const hitNodeId = useCallback(
    (clientX: number, clientY: number): string | null => {
      const pt = clientToCanvas(clientX, clientY);
      for (const n of ghost.nodes) {
        const pos = positionsRef.current[n.id];
        if (!pos) continue;
        if (pt.x >= pos.x && pt.x <= pos.x + NODE_W && pt.y >= pos.y && pt.y <= pos.y + NODE_H) {
          return n.id;
        }
      }
      return null;
    },
    [clientToCanvas, ghost.nodes],
  );

  const commitEdge = useCallback(
    (fromId: string, toId: string) => {
      if (fromId === toId) return;
      const exists = ghost.edges.some(
        (edge) => edge.fromVariantId === fromId && edge.toVariantId === toId,
      );
      if (!exists) onConnectEdge(fromId, toId);
    },
    [ghost.edges, onConnectEdge],
  );

  const resolveLinkDrop = useCallback(
    (endNodeId: string) => {
      const draft = linkDraftRef.current;
      if (!draft || draft.startNodeId === endNodeId) {
        setLinkDraft(null);
        setLinkCursor(null);
        return;
      }
      if (draft.mode === "out") {
        // start is requirement → end depends on it
        commitEdge(draft.startNodeId, endNodeId);
      } else {
        // start depends on end → end is requirement
        commitEdge(endNodeId, draft.startNodeId);
      }
      setLinkDraft(null);
      setLinkCursor(null);
    },
    [commitEdge],
  );

  const beginHandleLink = (nodeId: string, mode: "out" | "in", e: ReactPointerEvent) => {
    if (!canMutate || busy) return;
    e.preventDefault();
    e.stopPropagation();
    setSelectedEdgeId(null);
    setPendingPair(null);
    ignoreLinkUpRef.current = true;
    linkMovedRef.current = false;
    setLinkDraft({ startNodeId: nodeId, mode });
    setLinkCursor(clientToCanvas(e.clientX, e.clientY));
  };

  // Global pointer tracking while drawing a wire (handles survive outside the node).
  useEffect(() => {
    if (!linkDraft) return;
    const onMove = (e: PointerEvent) => {
      linkMovedRef.current = true;
      setLinkCursor(clientToCanvas(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      if (ignoreLinkUpRef.current) {
        ignoreLinkUpRef.current = false;
        // Click-to-arm: keep draft alive until next click/drop on another node.
        if (!linkMovedRef.current) return;
      }
      const targetId = hitNodeId(e.clientX, e.clientY);
      if (targetId) resolveLinkDrop(targetId);
      else if (linkMovedRef.current) {
        setLinkDraft(null);
        setLinkCursor(null);
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [linkDraft, clientToCanvas, hitNodeId, resolveLinkDrop]);

  const onNodePointerDown = (nodeId: string, e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest("[data-connect-handle]")) return;
    if (linkDraftRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = positionsRef.current[nodeId] ?? { x: 24, y: 56 };
    const pt = clientToCanvas(e.clientX, e.clientY);
    dragRef.current = {
      id: nodeId,
      offsetX: pt.x - pos.x,
      offsetY: pt.y - pos.y,
      moved: false,
    };
    setSelectedId(nodeId);
    setSelectedEdgeId(null);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onNodePointerMove = (e: ReactPointerEvent) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pt = clientToCanvas(e.clientX, e.clientY);
    const nextPos = {
      x: Math.max(8, pt.x - drag.offsetX),
      y: Math.max(8, pt.y - drag.offsetY),
    };
    if (
      Math.abs(nextPos.x - (positionsRef.current[drag.id]?.x ?? 0)) > 2 ||
      Math.abs(nextPos.y - (positionsRef.current[drag.id]?.y ?? 0)) > 2
    ) {
      drag.moved = true;
    }
    const next = { ...positionsRef.current, [drag.id]: nextPos };
    positionsRef.current = next;
    setPositions(next);
  };

  const onNodePointerUp = (e: ReactPointerEvent) => {
    if (!dragRef.current) return;
    const wasDrag = dragRef.current.moved;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    persist(positionsRef.current);
    dragRef.current = null;
    if (!wasDrag && linkDraftRef.current) {
      const nodeId = (e.currentTarget as HTMLElement).dataset.nodeId;
      if (nodeId) resolveLinkDrop(nodeId);
    }
  };

  const openDirectionPicker = (a: string, b: string) => {
    if (a === b) return;
    setPendingPair({ a, b });
    setLinkDraft(null);
    setLinkCursor(null);
  };

  const onMinimize = () => {
    setCanvasSize((s) => (s === "maximized" ? "normal" : "minimized"));
  };
  const onMaximize = () => {
    setCanvasSize((s) => (s === "minimized" ? "normal" : "maximized"));
  };

  const linkPreviewFrom = linkDraft ? positions[linkDraft.startNodeId] : null;
  const linkPreviewStart =
    linkDraft && linkPreviewFrom
      ? linkDraft.mode === "out"
        ? { x: linkPreviewFrom.x + NODE_W, y: linkPreviewFrom.y + NODE_H / 2 }
        : { x: linkPreviewFrom.x, y: linkPreviewFrom.y + NODE_H / 2 }
      : null;

  const toolbar = (
    <div className="flex items-center justify-between border-b border-[#d5dee6] bg-white px-3 py-2">
      <div className="min-w-0">
        <span className="text-xs font-medium text-[#8a9aab]">Tool bar</span>
        {linkDraft ? (
          <p className="truncate text-[11px] text-primary-800">
            {linkDraft.mode === "out"
              ? "Drop on the variant that depends on this one (arrow →)"
              : "Drop on the requirement this variant needs (← arrow)"}
            {" · Esc cancel"}
          </p>
        ) : (
          <p className="truncate text-[11px] text-[#8a9aab]">
            Red = requirement → · Teal = depends on ← · Drag freely · Click an arrow to manage it
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-[#5a6b7a] hover:bg-surface-muted"
          aria-label="Minimize chain canvas"
          title="Minimize"
          onClick={onMinimize}
        >
          <Minimize2 className="size-3.5" aria-hidden />
        </button>
        <button
          type="button"
          className="inline-flex size-7 items-center justify-center rounded-md text-[#5a6b7a] hover:bg-surface-muted"
          aria-label="Maximize chain canvas"
          title="Maximize"
          onClick={onMaximize}
        >
          <Maximize2 className="size-3.5" aria-hidden />
        </button>
        {canvasSize === "maximized" ? (
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-md text-[#5a6b7a] hover:bg-surface-muted"
            aria-label="Exit maximized chain"
            title="Exit maximize"
            onClick={() => setCanvasSize("normal")}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );

  const canvasBody =
    canvasSize === "minimized" ? (
      <button
        type="button"
        onClick={() => setCanvasSize("normal")}
        className="flex w-full items-center justify-between bg-[#e8eef2] px-4 py-3 text-left text-sm text-[#5a6b7a] hover:bg-[#dfe7ed]"
      >
        <span>
          Chain minimized — {ghost.nodes.length} node{ghost.nodes.length === 1 ? "" : "s"},{" "}
          {ghost.edges.length} link{ghost.edges.length === 1 ? "" : "s"}
        </span>
        <span className="font-semibold text-primary-800">Restore</span>
      </button>
    ) : (
      <div
        ref={canvasRef}
        className="relative min-h-0 flex-1 overflow-auto bg-[#e8eef2] p-4"
      >
        {ghost.nodes.length === 0 ? (
          <p className="pt-10 text-center text-sm text-[#8a9aab]">No chain nodes yet.</p>
        ) : (
          <div
            className="relative"
            style={{ width: canvasBounds.width, height: canvasBounds.height }}
          >
            <svg className="absolute inset-0 h-full w-full" aria-hidden>
              <defs>
                <marker
                  id={`ghost-arrow-${ghost.id}`}
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="3"
                  orient="auto"
                >
                  <path d="M0,0 L6,3 L0,6 Z" fill="#0f2a3d" />
                </marker>
              </defs>
              {ghost.edges.map((e) => {
                const from = positions[e.fromVariantId];
                const to = positions[e.toVariantId];
                if (!from || !to) return null;
                const { x1, y1, x2, y2 } = edgeAnchors(from, to);
                const mx = (x1 + x2) / 2;
                const my = (y1 + y2) / 2;
                const active = selectedEdgeId === e.id;
                return (
                  <g key={e.id}>
                    {/* Wider invisible hit target */}
                    <path
                      d={`M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="14"
                      className="cursor-pointer"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelectedEdgeId(e.id);
                        setSelectedId(null);
                      }}
                    />
                    <path
                      d={`M ${x1} ${y1} Q ${mx} ${my}, ${x2} ${y2}`}
                      fill="none"
                      stroke={active ? "#0b6e99" : "#0f2a3d"}
                      strokeWidth={active ? 3 : 2}
                      markerEnd={`url(#ghost-arrow-${ghost.id})`}
                      className="pointer-events-none"
                    />
                    <title>
                      {(nodeById.get(e.fromVariantId)?.name || "Upstream") +
                        " is a requirement for " +
                        (nodeById.get(e.toVariantId)?.name || "downstream")}
                    </title>
                  </g>
                );
              })}
              {linkPreviewStart && linkCursor ? (
                <path
                  d={`M ${linkPreviewStart.x} ${linkPreviewStart.y} L ${linkCursor.x} ${linkCursor.y}`}
                  fill="none"
                  stroke="#0f2a3d"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                  className="pointer-events-none"
                  markerEnd={`url(#ghost-arrow-${ghost.id})`}
                />
              ) : null}
            </svg>

            {ghost.nodes.map((node) => {
              const pos = positions[node.id] ?? { x: 24, y: 56 };
              const active = selectedId === node.id;
              const linkingHere = linkDraft?.startNodeId === node.id;
              const showDefaultBadge =
                node.isDefault && !/\(\s*default\s*\)/i.test(node.name);
              return (
                <div
                  key={node.id}
                  className="absolute flex flex-col items-center"
                  style={{ left: pos.x, top: pos.y, width: NODE_W }}
                >
                  <button
                    type="button"
                    data-node-id={node.id}
                    onPointerDown={(e) => onNodePointerDown(node.id, e)}
                    onPointerMove={onNodePointerMove}
                    onPointerUp={onNodePointerUp}
                    onPointerCancel={onNodePointerUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (linkDraft) {
                        resolveLinkDrop(node.id);
                        return;
                      }
                      setSelectedId(node.id);
                      setSelectedEdgeId(null);
                    }}
                    className={[
                      "relative flex min-h-16 w-full cursor-grab flex-col items-center justify-center rounded-xl border bg-white px-3 py-2 text-center shadow-sm active:cursor-grabbing",
                      active || linkingHere
                        ? "border-primary-700 ring-2 ring-primary-700/20"
                        : "border-[#c5d0da]",
                      node.blocked ? "opacity-70" : "",
                      node.status === "approved" ? "border-emerald-500/60" : "",
                    ].join(" ")}
                  >
                    <span className="text-sm font-semibold leading-tight text-[#0f2a3d]">
                      {node.name}
                      {showDefaultBadge ? (
                        <span className="ml-1 text-[10px] font-medium text-[#8a9aab]">
                          (default)
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#8a9aab]">
                      {node.blocked ? "Blocked" : statusLabel(node.status)}
                    </span>
                    {canMutate ? (
                      <>
                        <span
                          data-connect-handle
                          role="button"
                          tabIndex={0}
                          title="Depends on… (drag to a requirement)"
                          aria-label={`${node.name} depends on`}
                          className="absolute -left-2 top-1/2 z-10 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-white bg-teal-600 shadow"
                          onPointerDown={(e) => beginHandleLink(node.id, "in", e)}
                        />
                        <span
                          data-connect-handle
                          role="button"
                          tabIndex={0}
                          title="Is a requirement for… (drag to a dependent)"
                          aria-label={`${node.name} is requirement for`}
                          className="absolute -right-2 top-1/2 z-10 size-3.5 -translate-y-1/2 cursor-crosshair rounded-full border-2 border-white bg-primary-800 shadow"
                          onPointerDown={(e) => beginHandleLink(node.id, "out", e)}
                        />
                      </>
                    ) : null}
                  </button>
                  {canMutate ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddVariant(node.id);
                      }}
                      className="mt-2 inline-flex size-7 items-center justify-center rounded-full border border-[#c5d0da] bg-white text-primary-800 shadow-sm hover:bg-surface-muted disabled:opacity-50"
                      aria-label={`Add variant from ${node.name}`}
                      title="Add another variant from this node"
                    >
                      <Plus className="size-3.5" aria-hidden />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );

  const selectedEdge = ghost.edges.find((e) => e.id === selectedEdgeId) ?? null;
  const pendingA = pendingPair ? nodeById.get(pendingPair.a) : null;
  const pendingB = pendingPair ? nodeById.get(pendingPair.b) : null;

  const details = (
    <>
      {pendingA && pendingB && pendingPair ? (
        <div className="space-y-2 border-t border-[#d5dee6] bg-white px-4 py-3">
          <p className="text-sm font-semibold text-[#0f2a3d]">Choose flow direction</p>
          <p className="text-xs text-[#5a6b7a]">
            Arrow means: requirement → dependent (who must finish first).
          </p>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => {
                commitEdge(pendingPair.a, pendingPair.b);
                setPendingPair(null);
              }}
            >
              {pendingA.name} → {pendingB.name}
              <span className="font-normal opacity-80"> (A is requirement)</span>
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy}
              onClick={() => {
                commitEdge(pendingPair.b, pendingPair.a);
                setPendingPair(null);
              }}
            >
              {pendingB.name} → {pendingA.name}
              <span className="font-normal opacity-80"> (B is requirement)</span>
            </Button>
            <button
              type="button"
              className="text-xs text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() => setPendingPair(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {selectedEdge && !pendingPair ? (
        <div className="space-y-2 border-t border-[#d5dee6] bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0f2a3d]">Flow link</p>
              <p className="text-xs text-[#5a6b7a]">
                <span className="font-medium text-[#0f2a3d]">
                  {nodeById.get(selectedEdge.fromVariantId)?.name || "Upstream"}
                </span>
                {" → "}
                <span className="font-medium text-[#0f2a3d]">
                  {nodeById.get(selectedEdge.toVariantId)?.name || "Downstream"}
                </span>
              </p>
              <p className="mt-1 text-[11px] text-[#8a9aab]">
                Upstream is the requirement; downstream waits until it is done.
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() => setSelectedEdgeId(null)}
            >
              Close
            </button>
          </div>
          {canMutate ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy || !onReverseEdge}
                onClick={() => {
                  onReverseEdge?.({
                    edgeId: selectedEdge.id,
                    fromVariantId: selectedEdge.fromVariantId,
                    toVariantId: selectedEdge.toVariantId,
                  });
                  setSelectedEdgeId(null);
                }}
              >
                Reverse direction
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy || !onDisconnectEdge}
                onClick={() => {
                  onDisconnectEdge?.(selectedEdge.id);
                  setSelectedEdgeId(null);
                }}
              >
                Remove link
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {selected && !pendingPair && !selectedEdge ? (
        <div className="space-y-2 border-t border-[#d5dee6] bg-white px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-[#0f2a3d]">{selected.name}</p>
              <p className="text-xs text-[#8a9aab]">
                {selected.implementationType === "branch_base" ? "Branch Base" : "Same Base"}
                {" · "}v{selected.workingHeadVersion}
                {selected.forkedFromVariantId ? " · forked" : ""}
                {" · "}
                {selected.blocked
                  ? `Waiting on ${selected.blockedByVariantIds.length} upstream link(s)`
                  : statusLabel(selected.status)}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-[#8a9aab] hover:text-[#0f2a3d]"
              onClick={() => setSelectedId(null)}
            >
              Close
            </button>
          </div>
          {selected.availableInputs.length > 0 ? (
            <div className="rounded-lg bg-[#e8eef2] px-2.5 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5a6b7a]">
                Ready inputs
              </p>
              <ul className="mt-1 space-y-0.5">
                {selected.availableInputs.map((inp, idx) => (
                  <li key={idx} className="text-xs text-[#0f2a3d]">
                    {String(inp.fromName || inp.name || "Upstream output")} — use this
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {onOpenWork &&
          (selected.role === "end" || selected.isDefault) &&
          (ghost.resourceKind === "exercise" ||
            ghost.resourceKind === "test" ||
            ghost.resourceKind === "fast_summary") ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => onOpenWork(selected.id)}
              >
                Open work
              </Button>
            </div>
          ) : null}
          {canWorkSelected &&
          !selected.blocked &&
          selected.status !== "submitted" &&
          selected.status !== "approved" ? (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => onSubmit(selected.id)}
              >
                Submit
              </Button>
            </div>
          ) : null}
          {canMutate ? (
            <div className="flex flex-wrap gap-2">
              {selected.status === "submitted" ||
              (!selected.blocked &&
                selected.status !== "approved" &&
                selected.status !== "rejected") ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy || selected.status === "approved"}
                  onClick={() => onApprove(selected.id)}
                >
                  Approve
                </Button>
              ) : null}
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => onAddVariant(selected.id)}
              >
                + Branch from here
              </Button>
              {ghost.nodes
                .filter((n) => n.id !== selected.id)
                .slice(0, 6)
                .map((n) => (
                  <Button
                    key={n.id}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={busy}
                    onClick={() => openDirectionPicker(selected.id, n.id)}
                  >
                    Link to {n.name}
                  </Button>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );

  const addVariantBar = canMutate ? (
    <div className="border-t border-[#d5dee6] bg-[#eef3f6] px-4 py-3">
      <Button
        type="button"
        variant="primary"
        size="md"
        className="w-full"
        disabled={busy}
        onClick={() => onAddVariant(null)}
      >
        + Add Variant
      </Button>
    </div>
  ) : null;

  const panel = (
    <div className="flex h-full min-h-0 flex-col">
      {toolbar}
      {canvasBody}
      {details}
      {addVariantBar}
    </div>
  );

  if (canvasSize === "maximized" && typeof document !== "undefined") {
    return (
      <>
        <div className="flex h-full min-h-0 flex-col items-center justify-center bg-[#e8eef2] px-4 text-center text-sm text-[#5a6b7a]">
          <p>Chain is maximized</p>
          <button
            type="button"
            className="mt-2 font-semibold text-primary-800 hover:underline"
            onClick={() => setCanvasSize("normal")}
          >
            Restore to drawer
          </button>
        </div>
        {createPortal(
          <div className="fixed inset-0 z-[1700] flex flex-col bg-[#e8eef2] shadow-2xl">
            {panel}
          </div>,
          document.body,
        )}
      </>
    );
  }

  return panel;
}
