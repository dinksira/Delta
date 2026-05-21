"use client";

/** ################################ IMPORT ############################# */
import type { ComponentType, CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CalendarDays,
  CalendarClock,
  Boxes,
  Dna,
  UserRound,
  Layers,
  FlaskConical,
  GraduationCap,
  EllipsisVertical,
  GripVertical,
  Pencil,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  X,
} from "lucide-react";

import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { Button, Card, DialogOverlay, DialogPanel, Input, SearchInput, Typography } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import { fetchFeaturesLayout, fetchFeaturesList, upsertFeaturesLayout } from "@/modules/Features/api";
import { featuresQueryKeys } from "@/modules/Features/hooks/featuresQueryKeys";
import { useFeaturesLayoutAccess } from "@/modules/Features/hooks/useFeaturesLayoutAccess";
import {
  pathnameWithoutHiddenNotice,
  readHiddenFeatureNotice,
} from "@/modules/Features/featureHiddenNotice";
import { resolveFeatureKeyFromPath } from "@/modules/Features/featureWorkspaceRoutes";

/** ################################ CONSTANTS ############################# */
const iconByFeatureKey = {
  school: CalendarDays,
  course: Boxes,
  competitions: Dna,
  tutorials: UserRound,
  research: Layers,
  rent_lab: FlaskConical,
  certification: CalendarDays,
  chatroom: Boxes,
  planner: CalendarClock,
  specialization: GraduationCap,
} as const;

const chipClassByFeatureKey = {
  school: "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
  course: "bg-[color:var(--color-features-chip-orange-bg)] text-[color:var(--color-features-chip-orange-fg)]",
  competitions: "bg-[color:var(--color-features-chip-indigo-bg)] text-[color:var(--color-features-chip-indigo-fg)]",
  tutorials: "bg-[color:var(--color-features-chip-emerald-bg)] text-[color:var(--color-features-chip-emerald-fg)]",
  research: "bg-[color:var(--color-features-chip-amber-bg)] text-[color:var(--color-features-chip-amber-fg)]",
  rent_lab: "bg-[color:var(--color-features-chip-rose-bg)] text-[color:var(--color-features-chip-rose-fg)]",
  certification: "bg-[color:var(--color-features-chip-cyan-bg)] text-[color:var(--color-features-chip-cyan-fg)]",
  chatroom: "bg-[color:var(--color-features-chip-teal-bg)] text-[color:var(--color-features-chip-teal-fg)]",
  planner: "bg-[color:var(--color-features-chip-violet-bg)] text-[color:var(--color-features-chip-violet-fg)]",
  specialization:
    "bg-[color:var(--color-features-chip-fuchsia-bg)] text-[color:var(--color-features-chip-fuchsia-fg)]",
} as const;

type FeatureCard = Readonly<{
  id: string;
  title: string;
  description: string;
  linkLabel: string;
  chipClass: string;
  disabled: boolean;
  icon: ComponentType<{ className?: string }>;
}>;

function displayTitle(card: FeatureCard, titleOverride?: string): string {
  const custom = titleOverride?.trim();
  return custom && custom.length > 0 ? custom : card.title;
}

function featureLabel(
  featureKey: string,
  cardById: Map<string, FeatureCard>,
  labels: Readonly<Record<string, string>>,
): string {
  const card = cardById.get(featureKey);
  if (card) return displayTitle(card, labels[featureKey]);
  const custom = labels[featureKey]?.trim();
  if (custom) return custom;
  return featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type FeatureCardMenuItemProps = Readonly<{
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}>;

function FeatureCardMenuItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  tone = "default",
}: FeatureCardMenuItemProps) {
  const iconWrap =
    tone === "danger"
      ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
      : "bg-primary-50 text-primary-600 dark:bg-primary-950/40 dark:text-primary-400";

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      className={[
        "flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm font-medium transition-colors",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-surface-muted",
        tone === "danger" && !disabled ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-text-primary",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
    >
      <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${iconWrap}`}>
        <Icon className="size-4" aria-hidden />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  );
}

function FeatureSortableCard({
  card,
  displayName,
  menuOpen,
  canMoveLeft,
  canMoveRight,
  onMenuToggle,
  onRename,
  onDelete,
  onMoveLeft,
  onMoveRight,
  onOpen,
}: Readonly<{
  card: FeatureCard;
  displayName: string;
  menuOpen: boolean;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  onMenuToggle: (open: boolean) => void;
  onRename: () => void;
  onDelete: () => void;
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onOpen: () => void;
}>) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition ?? "transform 220ms cubic-bezier(0.22, 1, 0.36, 1)",
    zIndex: isDragging ? 20 : undefined,
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (menuRef.current?.contains(event.target)) return;
      onMenuToggle(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen, onMenuToggle]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={[
        "relative h-full",
        menuOpen ? "z-50" : undefined,
        isDragging ? "scale-[1.02] opacity-90 shadow-lg" : undefined,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="absolute right-2 top-2 z-[30]">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30"
          aria-label="Card options"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.stopPropagation();
            onMenuToggle(!menuOpen);
          }}
        >
          <EllipsisVertical className="size-5" aria-hidden />
        </button>

        {menuOpen ? (
          <div
            ref={menuRef}
            className="absolute right-0 top-10 z-[40] w-60 origin-top-right animate-in fade-in zoom-in-95 rounded-2xl border border-border-default/80 bg-surface-default p-1.5 shadow-2xl ring-1 ring-black/5 duration-150 dark:ring-white/10"
            role="menu"
            aria-label={`Options for ${displayName}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 border-b border-border-default/70 px-3 py-2.5">
              <Typography variant="small" className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary">
                Card options
              </Typography>
              <Typography className="mt-0.5 truncate text-sm font-semibold text-text-primary">
                {displayName}
              </Typography>
            </div>
            <div className="flex flex-col gap-0.5 p-1">
              <FeatureCardMenuItem
                icon={Pencil}
                label="Rename"
                onClick={() => {
                  onMenuToggle(false);
                  onRename();
                }}
              />
              <FeatureCardMenuItem
                icon={ArrowLeft}
                label="Move left"
                disabled={!canMoveLeft}
                onClick={() => {
                  onMenuToggle(false);
                  onMoveLeft();
                }}
              />
              <FeatureCardMenuItem
                icon={ArrowRight}
                label="Move right"
                disabled={!canMoveRight}
                onClick={() => {
                  onMenuToggle(false);
                  onMoveRight();
                }}
              />
            </div>
            <div className="my-1 h-px bg-border-default/70" role="separator" />
            <div className="p-1">
              <FeatureCardMenuItem
                icon={Trash2}
                label="Remove"
                tone="danger"
                onClick={() => {
                  onMenuToggle(false);
                  onDelete();
                }}
              />
            </div>
          </div>
        ) : null}
      </div>

      <Card
        className={[
          "relative flex h-[200px] flex-col gap-2 overflow-visible rounded-2xl border-features-card-border bg-features-card-surface px-4 py-3 shadow-sm transition-[box-shadow,border-color] hover:border-features-card-hover-border hover:shadow-md",
          card.disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer",
        ].join(" ")}
        onClick={() => {
          if (card.disabled) return;
          onOpen();
        }}
        onKeyDown={(e) => {
          if (card.disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        <div
          className="flex items-start gap-2 pr-12"
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <span
            className="mt-0.5 inline-flex cursor-grab items-center text-text-tertiary active:cursor-grabbing"
            aria-hidden
          >
            <GripVertical className="size-4" />
          </span>
          <span
            className={`inline-flex size-10 shrink-0 items-center justify-center rounded-full ${card.chipClass}`}
          >
            <card.icon className="size-6" />
          </span>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Typography
            as="h3"
            className="line-clamp-2 min-h-[3.25rem] shrink-0 text-xl font-semibold leading-tight text-primary-600 sm:text-[29px] sm:leading-tight"
          >
            {displayName}
          </Typography>
          <Typography className="line-clamp-2 min-h-[2.5rem] flex-1 text-xs leading-[1.35] text-text-secondary">
            {card.description}
          </Typography>
          <Typography
            as="p"
            variant="small"
            className="mt-auto shrink-0 pt-1 text-xs font-medium text-secondary-500"
            aria-hidden
          >
            {card.linkLabel}
          </Typography>
        </div>
      </Card>
    </div>
  );
}

/** ################################ COMPONENT ############################# */
export function FeaturesPageView() {
  const { isAuthenticated, isReady, session } = useAuthSession();
  const { openWorkspaceTabByKey, removeTabsForFeatureKey } = useFeatureTabs();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isFeatureHidden } = useFeaturesLayoutAccess();
  const userId = session?.user?.id ?? "anon";

  const [query, setQuery] = useState("");
  const [localLayout, setLocalLayout] = useState<Readonly<{
    orderKeys: string[];
    hiddenKeys: string[];
  }> | null>(null);
  const [localLabels, setLocalLabels] = useState<Readonly<Record<string, string>> | null>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [menuOpenFor, setMenuOpenFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<null | { id: string; value: string }>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [addCardsOpen, setAddCardsOpen] = useState(false);
  const [addCardsQuery, setAddCardsQuery] = useState("");

  const {
    data: featureData,
    isPending: featuresPending,
    isError: featuresError,
  } = useQuery({
    queryKey: featuresQueryKeys.list(userId),
    queryFn: fetchFeaturesList,
    enabled: isReady && isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 24 * 60 * 60 * 1000,
    refetchOnMount: false,
    retry: false,
  });

  const { data: layoutData } = useQuery({
    queryKey: featuresQueryKeys.layout(userId),
    queryFn: fetchFeaturesLayout,
    enabled: isReady && isAuthenticated,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const activeWorkspace = searchParams.get("tab");
  const cards = useMemo(() => {
    return (featureData?.items ?? []).map((feature, index) => {
      const featureKey = feature.featureKey.toLowerCase();
      const title =
        typeof feature.title === "string" && feature.title.trim().length > 0
          ? feature.title
          : featureKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const description =
        typeof feature.description === "string" && feature.description.trim().length > 0
          ? feature.description
          : "Feature workspace";
      const canAccess = Boolean(feature.enabled) && Boolean(feature.capabilities?.canView);
      return {
        id: feature.featureKey || `feature-${index}`,
        title,
        linkLabel: canAccess ? `Enter ${title}` : "Not available",
        icon: iconByFeatureKey[featureKey as keyof typeof iconByFeatureKey] ?? CalendarDays,
        chipClass:
          chipClassByFeatureKey[featureKey as keyof typeof chipClassByFeatureKey] ??
          "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
        disabled: !canAccess,
        description,
      };
    });
  }, [featureData?.items]);

  const effectiveLayout = localLayout ?? {
    orderKeys: [...(layoutData?.orderKeys ?? [])],
    hiddenKeys: [...(layoutData?.hiddenKeys ?? [])],
  };
  const effectiveLabels = localLabels ?? (layoutData?.labels ?? {});

  const cardById = useMemo(() => new Map(cards.map((c) => [c.id, c] as const)), [cards]);

  const filteredCards = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((c) => {
      const label = displayTitle(c, effectiveLabels[c.id]);
      return `${label} ${c.description} ${c.id}`.toLowerCase().includes(q);
    });
  }, [cards, effectiveLabels, query]);

  const hiddenSet = useMemo(() => new Set(effectiveLayout.hiddenKeys), [effectiveLayout.hiddenKeys]);

  const visibleCards = useMemo(() => {
    const matchIds = new Set(filteredCards.map((c) => c.id));
    const ordered: FeatureCard[] = [];
    for (const id of effectiveLayout.orderKeys) {
      const c = cardById.get(id);
      if (c && !hiddenSet.has(id) && matchIds.has(id)) ordered.push(c);
    }
    for (const c of filteredCards) {
      if (hiddenSet.has(c.id)) continue;
      if (ordered.some((o) => o.id === c.id)) continue;
      ordered.push(c);
    }
    return ordered;
  }, [cardById, effectiveLayout.orderKeys, filteredCards, hiddenSet]);

  const hiddenCards = useMemo(() => {
    return effectiveLayout.hiddenKeys
      .map((id) => cardById.get(id))
      .filter((c): c is FeatureCard => Boolean(c));
  }, [cardById, effectiveLayout.hiddenKeys]);

  const hiddenNoticeFeatureKey = readHiddenFeatureNotice(searchParams);

  const filteredAddableCards = useMemo(() => {
    const q = addCardsQuery.trim().toLowerCase();
    if (!q) return hiddenCards;
    return hiddenCards.filter((c) => {
      const label = displayTitle(c, effectiveLabels[c.id]);
      return `${label} ${c.description}`.toLowerCase().includes(q);
    });
  }, [addCardsQuery, effectiveLabels, hiddenCards]);

  const persistLayout = useCallback(
    async (next: { orderKeys: string[]; hiddenKeys: string[]; labels: Record<string, string> }) => {
      setLocalLayout({ orderKeys: next.orderKeys, hiddenKeys: next.hiddenKeys });
      setLocalLabels(next.labels);
      try {
        await upsertFeaturesLayout({
          order_keys: next.orderKeys,
          hidden_keys: next.hiddenKeys,
          labels: next.labels,
        });
      } catch {
        // Optimistic UI; refresh reconciles with server.
      }
    },
    [],
  );

  const ensureOrder = useCallback(() => {
    if (effectiveLayout.orderKeys.length > 0) return [...effectiveLayout.orderKeys];
    return cards.map((c) => c.id);
  }, [cards, effectiveLayout.orderKeys]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const toggleHidden = useCallback(
    async (id: string, hide: boolean) => {
      const hidden = new Set(effectiveLayout.hiddenKeys);
      if (hide) hidden.add(id);
      else hidden.delete(id);
      const order = ensureOrder();
      await persistLayout({
        orderKeys: order.includes(id) ? order : [...order, id],
        hiddenKeys: Array.from(hidden),
        labels: { ...effectiveLabels },
      });
      if (hide) {
        removeTabsForFeatureKey(id);
        const routeKey = resolveFeatureKeyFromPath(pathname, searchParams.get("tab"));
        if (routeKey === id.trim().toLowerCase()) {
          router.replace(pathnameWithoutHiddenNotice(searchParams));
        }
      }
    },
    [
      effectiveLabels,
      effectiveLayout.hiddenKeys,
      ensureOrder,
      pathname,
      persistLayout,
      removeTabsForFeatureKey,
      router,
      searchParams,
    ],
  );

  const moveLeftRight = useCallback(
    async (id: string, dir: -1 | 1) => {
      const order = ensureOrder();
      const idx = order.indexOf(id);
      if (idx < 0) return;
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= order.length) return;
      await persistLayout({
        orderKeys: arrayMove(order, idx, nextIdx),
        hiddenKeys: effectiveLayout.hiddenKeys,
        labels: { ...effectiveLabels },
      });
    },
    [effectiveLabels, effectiveLayout.hiddenKeys, ensureOrder, persistLayout],
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
    setMenuOpenFor(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const activeId = String(event.active.id);
      const overId = event.over ? String(event.over.id) : null;
      setActiveDragId(null);
      if (!overId || activeId === overId) return;
      const order = ensureOrder();
      const oldIndex = order.indexOf(activeId);
      const newIndex = order.indexOf(overId);
      if (oldIndex < 0 || newIndex < 0) return;
      void persistLayout({
        orderKeys: arrayMove(order, oldIndex, newIndex),
        hiddenKeys: effectiveLayout.hiddenKeys,
        labels: { ...effectiveLabels },
      });
    },
    [effectiveLabels, effectiveLayout.hiddenKeys, ensureOrder, persistLayout],
  );

  const startRename = useCallback(
    (id: string) => {
      const current = effectiveLabels[id] ?? cardById.get(id)?.title ?? "";
      setRenaming({ id, value: current });
      setMenuOpenFor(null);
    },
    [cardById, effectiveLabels],
  );

  const saveRename = useCallback(async () => {
    if (!renaming) return;
    const name = renaming.value.trim();
    const nextLabels = { ...effectiveLabels };
    if (!name) delete nextLabels[renaming.id];
    else nextLabels[renaming.id] = name;
    await persistLayout({
      orderKeys: ensureOrder(),
      hiddenKeys: effectiveLayout.hiddenKeys,
      labels: nextLabels,
    });
    setRenaming(null);
  }, [effectiveLabels, effectiveLayout.hiddenKeys, ensureOrder, persistLayout, renaming]);

  const activeDragCard = activeDragId ? cardById.get(activeDragId) : null;

  return (
    <div className="pl-2 pr-6 md:pl-2 md:pr-8 xl:pl-2 xl:pr-10">
      <div className="mx-auto flex w-full max-w-[var(--dl-layout-features-page-max)] flex-col gap-6 pb-6">
      {activeWorkspace ? (
        <section
          className="rounded-xl border border-features-card-border bg-features-card-surface px-4 py-6 text-center"
          aria-live="polite"
        >
          <Typography as="h2" variant="h2" className="text-lg sm:text-xl">
            {activeWorkspace.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Typography>
          <Typography variant="body" className="mt-2 text-text-secondary">
            Workspace view for this tab will load here when the module is connected.
          </Typography>
        </section>
      ) : null}

      {hiddenNoticeFeatureKey ? (
        <div
          className="flex items-start justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100"
          role="status"
          aria-live="polite"
        >
          <Typography as="p" variant="small" className="font-medium">
            This feature is hidden. Use{" "}
            <button
              type="button"
              className="font-semibold underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-50"
              onClick={() => setAddCardsOpen(true)}
            >
              Add card
            </button>{" "}
            to show {featureLabel(hiddenNoticeFeatureKey, cardById, effectiveLabels)} on your dashboard
            again.
          </Typography>
          <button
            type="button"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-amber-800 transition-colors hover:bg-amber-100/80 dark:text-amber-200 dark:hover:bg-amber-900/60"
            aria-label="Dismiss"
            onClick={() => router.replace(pathnameWithoutHiddenNotice(searchParams))}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <SchoolWorkspaceHeader
        title="Features"
        actionSlot={
          <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shrink-0 gap-1.5"
              disabled={hiddenCards.length === 0}
              onClick={() => setAddCardsOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Add card
            </Button>
            <div className="min-w-0 w-full max-w-[19rem] shrink-0 sm:max-w-[22rem]">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder="Search features"
                aria-label="Search features"
                className="h-9 gap-1 px-2 py-0.5 [&_svg]:size-4"
                inputClassName="py-1 text-xs"
              />
            </div>
          </div>
        }
      />

      <section className="grid auto-rows-[200px] gap-5 overflow-visible sm:grid-cols-2 lg:grid-cols-4">
        {featuresPending ? (
          Array.from({ length: 8 }).map((_, index) => (
            <Card
              key={`feature-skeleton-${index}`}
              className="h-[200px] gap-3 rounded-2xl border-features-card-border bg-features-card-surface px-4 py-3 shadow-sm"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <span className="sr-only">Loading features</span>
              <div className="inline-flex size-10 animate-pulse rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
              <div className="h-7 w-3/5 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
                <div className="h-3 w-4/5 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
              </div>
              <div className="mt-auto h-3 w-1/2 animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-700/70" />
            </Card>
          ))
        ) : featuresError ? (
          <Card className="rounded-2xl border-features-card-border bg-features-card-surface px-5 py-6 text-center sm:col-span-2 lg:col-span-4">
            <Typography as="h3" className="text-lg font-semibold text-primary-600">
              Could not load features
            </Typography>
            <Typography className="mt-2 text-sm text-text-secondary">
              Please refresh the page and try again.
            </Typography>
          </Card>
        ) : cards.length === 0 ? (
          <Card className="rounded-2xl border-features-card-border bg-features-card-surface px-5 py-6 text-center sm:col-span-2 lg:col-span-4">
            <Typography as="h3" className="text-lg font-semibold text-primary-600">
              No features available yet
            </Typography>
            <Typography className="mt-2 text-sm text-text-secondary">
              Your account does not have feature access right now.
            </Typography>
          </Card>
        ) : visibleCards.length === 0 && query.trim() ? (
          <Card className="rounded-2xl border-features-card-border bg-features-card-surface px-5 py-6 text-center sm:col-span-2 lg:col-span-4">
            <Typography as="h3" className="text-lg font-semibold text-primary-600">
              No matching features
            </Typography>
            <Typography className="mt-2 text-sm text-text-secondary">
              Try a different search term or clear the search field.
            </Typography>
          </Card>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={() => setActiveDragId(null)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={visibleCards.map((c) => c.id)} strategy={rectSortingStrategy}>
              {visibleCards.map((card, index) => (
                <FeatureSortableCard
                  key={card.id}
                  card={card}
                  displayName={displayTitle(card, effectiveLabels[card.id])}
                  menuOpen={menuOpenFor === card.id}
                  canMoveLeft={index > 0}
                  canMoveRight={index < visibleCards.length - 1}
                  onMenuToggle={(open) => setMenuOpenFor(open ? card.id : null)}
                  onRename={() => startRename(card.id)}
                  onDelete={() => setDeleteTarget(card.id)}
                  onMoveLeft={() => moveLeftRight(card.id, -1)}
                  onMoveRight={() => moveLeftRight(card.id, 1)}
                  onOpen={() => {
                    if (isFeatureHidden(card.id)) return;
                    openWorkspaceTabByKey(
                      card.id,
                      displayTitle(card, effectiveLabels[card.id]),
                    );
                  }}
                />
              ))}
            </SortableContext>
            <DragOverlay dropAnimation={{ duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}>
              {activeDragCard ? (
                <div className="w-[min(20rem,90vw)] rotate-1 scale-[1.03] cursor-grabbing">
                  <Card className="h-[200px] gap-3 rounded-2xl border-features-card-border bg-features-card-surface px-4 py-3 shadow-xl">
                    <div className={`inline-flex size-10 items-center justify-center rounded-full ${activeDragCard.chipClass}`}>
                      <activeDragCard.icon className="size-6" />
                    </div>
                    <Typography as="h3" className="text-xl font-semibold text-primary-600">
                      {displayTitle(activeDragCard, effectiveLabels[activeDragCard.id])}
                    </Typography>
                  </Card>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </section>

      {addCardsOpen ? (
        <DialogOverlay
          aria-label="Add feature cards"
          onClose={() => {
            setAddCardsOpen(false);
            setAddCardsQuery("");
          }}
          className="flex items-center justify-center p-3"
        >
          <DialogPanel className="w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
            <Typography as="h2" className="text-lg font-semibold text-text-primary">
              Add card
            </Typography>
            <Typography className="mt-1 text-sm text-text-secondary">
              Restore hidden features to your dashboard.
            </Typography>
            <div className="mt-4">
              <SearchInput
                value={addCardsQuery}
                onChange={(e) => setAddCardsQuery(e.currentTarget.value)}
                placeholder="Search hidden cards"
                aria-label="Search hidden cards"
                className="h-9 gap-1 px-2 py-0.5 [&_svg]:size-4"
                inputClassName="py-1 text-xs"
              />
            </div>
            <ul className="mt-4 max-h-[min(20rem,50vh)] space-y-2 overflow-y-auto">
              {filteredAddableCards.length === 0 ? (
                <li className="rounded-xl border border-dashed border-border-default px-4 py-8 text-center text-sm text-text-secondary">
                  {hiddenCards.length === 0
                    ? "No hidden cards. Remove a card from the grid to add it here later."
                    : "No cards match your search."}
                </li>
              ) : (
                filteredAddableCards.map((c) => (
                  <li key={c.id}>
                    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default px-3 py-2.5">
                      <span
                        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full ${c.chipClass}`}
                      >
                        <c.icon className="size-5" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <Typography className="truncate text-sm font-semibold text-text-primary">
                          {displayTitle(c, effectiveLabels[c.id])}
                        </Typography>
                        <Typography className="line-clamp-1 text-xs text-text-secondary">
                          {c.description}
                        </Typography>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        className="shrink-0 gap-1"
                        onClick={() => {
                          void toggleHidden(c.id, false);
                          setAddCardsOpen(false);
                          setAddCardsQuery("");
                          if (hiddenNoticeFeatureKey === c.id) {
                            router.replace(pathnameWithoutHiddenNotice(searchParams));
                          }
                        }}
                      >
                        <Plus className="size-4" aria-hidden />
                        Add
                      </Button>
                    </div>
                  </li>
                ))
              )}
            </ul>
            <div className="mt-5 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setAddCardsOpen(false);
                  setAddCardsQuery("");
                }}
              >
                Close
              </Button>
            </div>
          </DialogPanel>
        </DialogOverlay>
      ) : null}

      {renaming ? (
        <DialogOverlay
          aria-label="Rename feature card"
          onClose={() => setRenaming(null)}
          className="flex items-center justify-center p-3"
        >
          <DialogPanel className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <Typography as="h2" className="text-lg font-semibold text-text-primary">
              Rename card
            </Typography>
            <Typography className="mt-1 text-sm text-text-secondary">
              This name is saved to your account.
            </Typography>
            <div className="mt-4">
              <Input
                value={renaming.value}
                onChange={(e) => setRenaming({ ...renaming, value: e.currentTarget.value })}
                placeholder="Card name"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void saveRename();
                }}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button onClick={() => void saveRename()}>Save</Button>
            </div>
          </DialogPanel>
        </DialogOverlay>
      ) : null}

      {deleteTarget ? (
        <DialogOverlay
          aria-label="Remove feature card"
          onClose={() => setDeleteTarget(null)}
          className="flex items-center justify-center p-3"
        >
          <DialogPanel className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <Typography as="h2" className="text-lg font-semibold text-text-primary">
              Remove card?
            </Typography>
            <Typography className="mt-2 text-sm text-text-secondary">
              {displayTitle(cardById.get(deleteTarget)!, effectiveLabels[deleteTarget])} will be hidden from
              your dashboard. You can add it back anytime with Add card.
            </Typography>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  void toggleHidden(deleteTarget, true);
                  setDeleteTarget(null);
                }}
              >
                Remove
              </Button>
            </div>
          </DialogPanel>
        </DialogOverlay>
      ) : null}
      </div>
    </div>
  );
}
