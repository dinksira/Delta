"use client";

/** ################################ IMPORT ############################# */
/** Workspace detail view imports. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Bot,
  EllipsisVertical,
  FileText,
  GraduationCap,
  HandHelping,
  LayoutGrid,
  Link2,
  List,
  Network,
  Plus,
  Pencil,
  Search,
  Share2,
  SlidersHorizontal,
  SquareArrowOutUpRight,
  Table2,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createSchoolWorkspaceItem,
  deleteSchoolWorkspaceItem,
  fetchSchoolWorkspaceItems,
  type SchoolWorkspaceItemTypeDto,
  updateSchoolWorkspaceItem,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this view. */
type SchoolWorkspaceDetailViewProps = Readonly<{
  schoolId?: string;
  schoolName?: string;
  initialView?: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const SCHOOL_DETAIL_SECTIONS = [
  { id: "all", label: "All" },
  { id: "departments", label: "Departments" },
  { id: "class", label: "Class" },
  { id: "course", label: "Course" },
  { id: "management-table", label: "Management Table" },
  { id: "resource", label: "Resource" },
  { id: "students", label: "Students" },
  { id: "service", label: "Service" },
] as const;
type SectionId = (typeof SCHOOL_DETAIL_SECTIONS)[number]["id"];

const ADDABLE_SECTION_OPTIONS = [
  { id: "departments", label: "Departments", icon: Network },
  { id: "class", label: "Class", icon: GraduationCap },
  { id: "course", label: "Course", icon: BookOpen },
  { id: "management-table", label: "Management Table", icon: Network },
  { id: "resource", label: "Resource", icon: BookOpen },
  { id: "students", label: "Students", icon: GraduationCap },
  { id: "service", label: "Service", icon: HandHelping },
] as const;
type AddableSectionId = (typeof ADDABLE_SECTION_OPTIONS)[number]["id"];

const SCHOOL_DETAIL_TABS_STORAGE_KEY = "deltalabs-school-detail-tabs-v1";
const SCHOOL_DETAIL_ACTIVE_TAB_STORAGE_KEY = "deltalabs-school-detail-active-tab-v1";

const CREATION_CHOICES = [
  { id: "folder", label: "Folder" },
  { id: "department", label: "Department" },
  { id: "class", label: "Class" },
  { id: "course", label: "Course" },
  { id: "management-table", label: "Management Table" },
  { id: "resource", label: "Resource" },
  { id: "student", label: "Student" },
  { id: "service", label: "Service" },
  { id: "staff", label: "Staff" },
] as const;
type CreationChoiceId = (typeof CREATION_CHOICES)[number]["id"];
type FormFieldConfig = Readonly<{ key: string; label: string; placeholder: string }>;
/** ################################ /CONSTANTS ############################# */

/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function DepartmentEmptyState({ onCreate }: Readonly<{ onCreate: () => void }>) {
  return (
    <div className="flex min-h-[420px] w-full items-center justify-center py-16">
      <div className="flex max-w-sm flex-col items-center text-center">
        <div className="relative mb-4 flex h-20 w-24 items-center justify-center">
          <div className="absolute inset-x-0 top-7 h-10 rounded-full bg-primary-50/80" />
          <div className="relative z-[1] rounded-xl border border-border-default bg-surface-default p-3 shadow-sm">
            <div className="space-y-1.5">
              <div className="h-2 w-10 rounded-full bg-surface-muted" />
              <div className="h-2 w-12 rounded-full bg-surface-muted" />
              <div className="h-2 w-8 rounded-full bg-surface-muted" />
            </div>
          </div>
          <div className="absolute right-1 top-2 z-[2] rounded-full border border-border-default bg-surface-default p-1.5 shadow-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-tertiary" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <circle cx="11" cy="11" r="6" />
              <path d="m20 20-4.1-4.1" />
            </svg>
          </div>
        </div>
        <p className="text-sm font-medium text-text-secondary">Nothing in the Root</p>
        <p className="mt-1 text-xs text-text-tertiary">Add departments, classes, or resources to get started.</p>
        <Button type="button" variant="primary" size="sm" className="mt-5 px-5" onClick={onCreate}>
          <Plus className="size-4" aria-hidden />
          New
        </Button>
      </div>
    </div>
  );
}

function CreationChooserModal({
  open,
  selected,
  onClose,
  onSelect,
  onNext,
}: Readonly<{
  open: boolean;
  selected: CreationChoiceId | null;
  onClose: () => void;
  onSelect: (choice: CreationChoiceId) => void;
  onNext: () => void;
}>) {
  if (!open) return null;
  return createPortal(
    <>
      <DialogOverlay onClose={onClose} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-[760px] px-5 py-4 sm:px-6 sm:py-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-text-primary">New</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close create menu"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 gap-x-12 gap-y-3 sm:grid-cols-2">
            {CREATION_CHOICES.map((choice) => (
              <label
                key={choice.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-lg text-text-secondary transition-colors hover:bg-surface-muted/70"
              >
                <input
                  type="radio"
                  name="school-create-target"
                  checked={selected === choice.id}
                  onChange={() => onSelect(choice.id)}
                  className="h-5 w-5 accent-primary-600"
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" className="min-w-44" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="min-w-44" onClick={onNext} disabled={!selected}>
              Next
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}

function CreationDetailsModal({
  open,
  title,
  fields,
  values,
  submitLabel,
  submitting,
  submitError,
  onClose,
  onChange,
  onSubmit,
}: Readonly<{
  open: boolean;
  title: string;
  fields: readonly FormFieldConfig[];
  values: Readonly<Record<string, string>>;
  submitLabel: string;
  submitting: boolean;
  submitError: string | null;
  onClose: () => void;
  onChange: (key: string, value: string) => void;
  onSubmit: () => void;
}>) {
  if (!open) return null;
  return createPortal(
    <>
      <DialogOverlay onClose={onClose} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-[760px] px-5 py-4 sm:px-6 sm:py-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-text-primary">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close create form"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {fields.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-2 block text-lg font-medium text-text-primary">{field.label}</span>
                <input
                  type="text"
                  value={values[field.key] ?? ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  className="h-12 w-full rounded-md border border-border-default bg-surface-default px-4 text-base text-text-primary outline-none ring-0 placeholder:text-text-tertiary focus:border-primary-400"
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>
          {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" className="min-w-44" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="min-w-44" onClick={onSubmit} disabled={submitting}>
              {submitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}

function EditWorkspaceItemModal({
  open,
  title,
  description,
  submitting,
  submitError,
  onTitleChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: Readonly<{
  open: boolean;
  title: string;
  description: string;
  submitting: boolean;
  submitError: string | null;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}>) {
  if (!open) return null;
  return createPortal(
    <>
      <DialogOverlay onClose={onClose} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-[760px] px-5 py-4 sm:px-6 sm:py-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold text-text-primary">Edit Item</h3>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close edit form"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>
          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-lg font-medium text-text-primary">Title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                className="h-12 w-full rounded-md border border-border-default bg-surface-default px-4 text-base text-text-primary outline-none ring-0 placeholder:text-text-tertiary focus:border-primary-400"
                placeholder="Name"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-lg font-medium text-text-primary">Description</span>
              <input
                type="text"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                className="h-12 w-full rounded-md border border-border-default bg-surface-default px-4 text-base text-text-primary outline-none ring-0 placeholder:text-text-tertiary focus:border-primary-400"
                placeholder="Description"
              />
            </label>
          </div>
          {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}
          <div className="mt-8 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" className="min-w-44" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="min-w-44" onClick={onSubmit} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}

function DeleteWorkspaceItemModal({
  open,
  submitting,
  onClose,
  onConfirm,
}: Readonly<{
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}>) {
  if (!open) return null;
  return createPortal(
    <>
      <DialogOverlay onClose={onClose} />
      <div className="fixed inset-0 z-[1310] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md px-5 py-4 sm:px-6 sm:py-5" onClick={(event) => event.stopPropagation()}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-red-50 p-2 text-red-600">
              <Trash2 className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-text-primary">Delete item?</h3>
              <p className="mt-1 text-sm text-text-secondary">This action cannot be undone.</p>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="button" variant="primary" className="bg-red-600 hover:bg-red-700" onClick={onConfirm} disabled={submitting}>
              {submitting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}

function WorkspaceUtilityActions() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-primary-700">
      <button type="button" className="inline-flex h-8 items-center gap-2 rounded-md px-1 text-sm font-medium transition-colors hover:bg-primary-50">
        <Wrench className="size-3.5" aria-hidden />
        Integrate
      </button>
      <button type="button" className="inline-flex h-8 items-center gap-2 rounded-md px-1 text-sm font-medium transition-colors hover:bg-primary-50">
        <Bot className="size-3.5" aria-hidden />
        Automate
      </button>
      <div className="inline-flex h-8 items-center overflow-hidden rounded-md border border-primary-200 bg-surface-default">
        <button type="button" className="inline-flex h-full items-center gap-2 px-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50">
          <SquareArrowOutUpRight className="size-3.5" aria-hidden />
          Invite
        </button>
        <span className="h-5 w-px bg-primary-200" aria-hidden />
        <button type="button" className="inline-flex h-full items-center px-2.5 text-primary-700 transition-colors hover:bg-primary-50" aria-label="Copy invite link">
          <Link2 className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
/** ################################ /SUBCOMPONENTS ############################# */
function WorkspaceLoadingShimmer() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading workspace</span>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 animate-pulse rounded-md bg-surface-muted" />
          <div className="h-10 w-10 animate-pulse rounded-md bg-surface-muted" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="h-10 w-[25rem] max-w-[70vw] animate-pulse rounded-full bg-surface-muted" />
          <div className="h-10 w-28 animate-pulse rounded-md bg-surface-muted" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`workspace-card-skeleton-${index}`}
            className="flex min-h-[190px] flex-col rounded-[0.9rem] border border-border-default bg-surface-default px-5 py-4 shadow-[0_1px_2px_rgba(2,24,43,0.06)]"
          >
            <div className="h-6 w-2/3 animate-pulse rounded bg-surface-muted" />
            <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-surface-muted" />
            <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
            <div className="mt-auto flex items-center justify-between pt-4">
              <div className="h-3 w-20 animate-pulse rounded bg-surface-muted" />
              <div className="h-9 w-28 animate-pulse rounded-md bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/** ################################ COMPONENT ############################# */
/** School detail workspace layout with per-school tab-state persistence. */
export function SchoolWorkspaceDetailView({ schoolId, schoolName, initialView }: SchoolWorkspaceDetailViewProps) {
  const queryClient = useQueryClient();
  const { mySchools, mySchoolsPending, orgsPending } = useSchoolActiveOrgId();
  const cleanSchoolId = (schoolId ?? "").trim();
  const displaySchoolName = (schoolName ?? "").trim();
  const workspaceLabel = displaySchoolName.length > 0 ? displaySchoolName : cleanSchoolId;
  const viewFromRoute = (initialView ?? "all").trim().toLowerCase();
  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const validViews = useMemo(() => new Set<SectionId>(SCHOOL_DETAIL_SECTIONS.map((section) => section.id)), []);
  const sectionById = useMemo(
    () => new Map<SectionId, (typeof SCHOOL_DETAIL_SECTIONS)[number]>(SCHOOL_DETAIL_SECTIONS.map((section) => [section.id, section])),
    [],
  );
  const [currentView, setCurrentView] = useState<SectionId>(
    validViews.has(viewFromRoute as SectionId) ? (viewFromRoute as SectionId) : "all",
  );
  const [visibleTabs, setVisibleTabs] = useState<SectionId[]>(() =>
    SCHOOL_DETAIL_SECTIONS.map((section) => section.id).filter((id) => id !== "service"),
  );
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [hydratedSchoolId, setHydratedSchoolId] = useState<string | null>(null);
  const [creationModalOpen, setCreationModalOpen] = useState(false);
  const [selectedCreateTarget, setSelectedCreateTarget] = useState<CreationChoiceId | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detailsFormValues, setDetailsFormValues] = useState<Record<string, string>>({});
  const [detailsSubmitError, setDetailsSubmitError] = useState<string | null>(null);
  const [openCardMenuId, setOpenCardMenuId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSubmitError, setEditSubmitError] = useState<string | null>(null);
  const [deleteTargetItemId, setDeleteTargetItemId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [layoutMode, setLayoutMode] = useState<"grid" | "list">("grid");
  const addMenuRef = useRef<HTMLDivElement | null>(null);
  const addButtonRef = useRef<HTMLButtonElement | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; right: number }>({ top: 0, right: 0 });

  const persistVisibleTabsForSchool = (targetSchoolId: string, tabs: SectionId[]) => {
    if (!targetSchoolId) return;
    try {
      localStorage.setItem(
        `${SCHOOL_DETAIL_TABS_STORAGE_KEY}:${targetSchoolId}`,
        JSON.stringify(tabs.filter((id) => id !== "all")),
      );
    } catch {}
  };
  const persistActiveTabForSchool = (targetSchoolId: string, tabId: SectionId) => {
    if (!targetSchoolId) return;
    try {
      localStorage.setItem(`${SCHOOL_DETAIL_ACTIVE_TAB_STORAGE_KEY}:${targetSchoolId}`, tabId);
    } catch {}
  };

  useEffect(() => {
    if (!isAddMenuOpen) return;
    const onWindowChange = () => {
      const rect = addButtonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({ top: rect.bottom + 8, right: Math.max(window.innerWidth - rect.right, 12) });
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!addMenuRef.current) return;
      if (event.target instanceof Node && !addMenuRef.current.contains(event.target)) setIsAddMenuOpen(false);
    };
    onWindowChange();
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("scroll", onWindowChange, true);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("scroll", onWindowChange, true);
    };
  }, [isAddMenuOpen]);
  useEffect(() => {
    if (!openCardMenuId) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!(event.target instanceof HTMLElement)) return;
      const root = event.target.closest("[data-card-menu-root='true']");
      if (!root) setOpenCardMenuId(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [openCardMenuId]);

  const addableTabs = useMemo(
    () => ADDABLE_SECTION_OPTIONS.filter((option) => !visibleTabs.includes(option.id as SectionId)),
    [visibleTabs],
  );
  const mapSectionToCreationChoice = (section: SectionId): CreationChoiceId => {
    if (section === "departments") return "department";
    if (section === "students") return "student";
    return section as CreationChoiceId;
  };
  const mapCreationChoiceToItemType = (choice: CreationChoiceId): SchoolWorkspaceItemTypeDto =>
    choice === "department" ? "department" : choice;
  const mapSectionToItemType = (section: SectionId | "all"): SchoolWorkspaceItemTypeDto | null => {
    if (section === "all") return null;
    return mapCreationChoiceToItemType(mapSectionToCreationChoice(section));
  };
  const itemTypeForCurrentView = mapSectionToItemType(currentView);

  const workspaceItemsQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItems(activeOrgId ?? "unknown-org", cleanSchoolId, itemTypeForCurrentView ?? "all"),
    queryFn: () => fetchSchoolWorkspaceItems(activeOrgId ?? "", cleanSchoolId, itemTypeForCurrentView ?? undefined),
    enabled: Boolean(activeOrgId && cleanSchoolId),
    staleTime: 15_000,
    retry: false,
  });
  const workspaceItems = useMemo(
    () => (workspaceItemsQuery.data?.items ?? []).filter((item) => !item.isRoot),
    [workspaceItemsQuery.data?.items],
  );
  const filteredWorkspaceItems = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return workspaceItems;
    return workspaceItems.filter((item) =>
      `${item.title} ${item.type} ${item.description ?? ""}`.toLowerCase().includes(q),
    );
  }, [searchText, workspaceItems]);
  const isWorkspaceBootstrapLoading = Boolean(cleanSchoolId) && (orgsPending || mySchoolsPending);
  const shouldShowWorkspaceLoading =
    isWorkspaceBootstrapLoading || workspaceItemsQuery.isPending || (workspaceItemsQuery.isFetching && !workspaceItemsQuery.data);

  const createWorkspaceItemMutation = useMutation({
    mutationFn: async (payload: {
      type: SchoolWorkspaceItemTypeDto;
      title: string;
      description?: string;
      metadata?: Record<string, unknown>;
    }) => {
      if (!activeOrgId || !cleanSchoolId) throw new Error("School workspace is not ready.");
      return createSchoolWorkspaceItem(activeOrgId, cleanSchoolId, payload);
    },
    onSuccess: () => {
      setDetailsModalOpen(false);
      setDetailsSubmitError(null);
      setDetailsFormValues({});
      setCreationModalOpen(false);
      if (!activeOrgId || !cleanSchoolId) return;
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, "all"),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, itemTypeForCurrentView ?? "all"),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setDetailsSubmitError(error.message);
        return;
      }
      if (error instanceof Error) {
        setDetailsSubmitError(error.message);
        return;
      }
      setDetailsSubmitError("Could not create item. Please try again.");
    },
  });
  const updateWorkspaceItemMutation = useMutation({
    mutationFn: async (payload: { itemId: string; title: string; description?: string }) => {
      if (!activeOrgId || !cleanSchoolId) throw new Error("School workspace is not ready.");
      return updateSchoolWorkspaceItem(activeOrgId, cleanSchoolId, payload.itemId, {
        title: payload.title,
        ...(payload.description !== undefined ? { description: payload.description } : {}),
      });
    },
    onSuccess: () => {
      setEditingItemId(null);
      setEditSubmitError(null);
      setOpenCardMenuId(null);
      if (!activeOrgId || !cleanSchoolId) return;
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, "all"),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, itemTypeForCurrentView ?? "all"),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setEditSubmitError(error.message);
        return;
      }
      if (error instanceof Error) {
        setEditSubmitError(error.message);
        return;
      }
      setEditSubmitError("Could not update item. Please try again.");
    },
  });
  const deleteWorkspaceItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!activeOrgId || !cleanSchoolId) throw new Error("School workspace is not ready.");
      return deleteSchoolWorkspaceItem(activeOrgId, cleanSchoolId, itemId);
    },
    onSuccess: () => {
      setOpenCardMenuId(null);
      if (!activeOrgId || !cleanSchoolId) return;
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, "all"),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItems(activeOrgId, cleanSchoolId, itemTypeForCurrentView ?? "all"),
      });
    },
  });

  const onRemoveTab = (tabId: SectionId) => {
    if (tabId === "all") return;
    setVisibleTabs((prev) => {
      const nextTabs = prev.filter((id) => id !== tabId);
      persistVisibleTabsForSchool(cleanSchoolId, nextTabs);
      return nextTabs;
    });
    if (currentView === tabId) {
      setCurrentView("all");
      persistActiveTabForSchool(cleanSchoolId, "all");
    }
  };
  const onAddTab = (tabId: AddableSectionId) => {
    if (!visibleTabs.includes(tabId)) {
      setVisibleTabs((prev) => {
        const nextTabs = [...prev, tabId];
        persistVisibleTabsForSchool(cleanSchoolId, nextTabs);
        return nextTabs;
      });
    }
    setCurrentView(tabId);
    persistActiveTabForSchool(cleanSchoolId, tabId);
    setIsAddMenuOpen(false);
  };

  const creationFormConfig = useMemo((): Readonly<{
    title: string;
    submitLabel: string;
    fields: readonly FormFieldConfig[];
  }> => {
    const target = selectedCreateTarget ?? "department";
    if (target === "department") {
      return {
        title: "Add Department",
        submitLabel: "ADD",
        fields: [
          { key: "title", label: "Department Name", placeholder: "Name" },
          { key: "description", label: "Description", placeholder: "This will be a very detailed description" },
        ],
      };
    }
    if (target === "class") {
      return {
        title: "Create Class",
        submitLabel: "ADD",
        fields: [
          { key: "title", label: "Class Name", placeholder: "Name" },
          { key: "grade", label: "Grade", placeholder: "Grade" },
          { key: "homeRoomTeacher", label: "Set Home Room Teacher", placeholder: "Search for teacher" },
        ],
      };
    }
    if (target === "student") {
      return {
        title: "Create Student Holder",
        submitLabel: "ADD",
        fields: [
          { key: "title", label: "Title", placeholder: "title" },
          { key: "description", label: "Description", placeholder: "Description" },
        ],
      };
    }
    return {
      title: `Create ${target.replace("-", " ").replace(/\b\w/g, (s) => s.toUpperCase())}`,
      submitLabel: "ADD",
      fields: [
        { key: "title", label: "Title", placeholder: "Name" },
        { key: "description", label: "Description", placeholder: "Description" },
      ],
    };
  }, [selectedCreateTarget]);

  const openDetailsFormFor = (target: CreationChoiceId) => {
    setSelectedCreateTarget(target);
    setDetailsSubmitError(null);
    setDetailsFormValues({});
    setDetailsModalOpen(true);
  };

  const onNewClick = () => {
    if (currentView === "all") {
      setCreationModalOpen(true);
      return;
    }
    openDetailsFormFor(mapSectionToCreationChoice(currentView));
  };
  const onEditItem = (item: (typeof filteredWorkspaceItems)[number]) => {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description ?? "");
    setEditSubmitError(null);
    setOpenCardMenuId(null);
  };
  const onDeleteItem = (itemId: string) => {
    setOpenCardMenuId(null);
    setDeleteTargetItemId(itemId);
  };

  const itemPrimaryMeta = (item: (typeof filteredWorkspaceItems)[number]): string => {
    const meta = item.metadata ?? {};
    if (item.type === "class") return `${(meta.grade as string) ?? "Grade 12"}`;
    if (item.type === "course") return "Introduction Course";
    if (item.type === "management-table") return "Template Based";
    if (item.type === "resource") return "Category Based";
    if (item.type === "student") return `${(meta.count as string) ?? "23"} Students`;
    return item.type.replace("-", " ");
  };

  const itemSecondaryMeta = (item: (typeof filteredWorkspaceItems)[number]): string => {
    const meta = item.metadata ?? {};
    if (item.type === "class") return `No of Students: ${(meta.studentCount as string) ?? "20"}`;
    if (item.type === "course") return item.description ?? "For grade students";
    if (item.type === "management-table") return "Self Owned";
    if (item.type === "resource") return "Abebe Kebede";
    if (item.type === "student") return item.description ?? "Student Registration";
    return item.description ?? "";
  };

  useEffect(() => {
    if (!cleanSchoolId) return;
    const defaultVisibleTabs: SectionId[] = SCHOOL_DETAIL_SECTIONS.map((section) => section.id).filter(
      (id) => id !== "service",
    );
    let nextVisibleTabs: SectionId[] = defaultVisibleTabs;
    try {
      const raw = localStorage.getItem(`${SCHOOL_DETAIL_TABS_STORAGE_KEY}:${cleanSchoolId}`);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const restored = parsed.filter(
            (id): id is SectionId =>
              typeof id === "string" && validViews.has(id as SectionId) && id !== "all",
          );
          nextVisibleTabs = ["all", ...Array.from(new Set(restored))];
        }
      }
    } catch {}
    setVisibleTabs(nextVisibleTabs);
    setHydratedSchoolId(cleanSchoolId);

    try {
      const rawActive = localStorage.getItem(`${SCHOOL_DETAIL_ACTIVE_TAB_STORAGE_KEY}:${cleanSchoolId}`);
      if (typeof rawActive === "string" && validViews.has(rawActive as SectionId)) {
        const restoredActive = rawActive as SectionId;
        setCurrentView(nextVisibleTabs.includes(restoredActive) ? restoredActive : "all");
        return;
      }
    } catch {}
    const nextInitialView = validViews.has(viewFromRoute as SectionId) ? (viewFromRoute as SectionId) : "all";
    setCurrentView(nextVisibleTabs.includes(nextInitialView) ? nextInitialView : "all");
  }, [cleanSchoolId, validViews, viewFromRoute]);

  useEffect(() => setIsAddMenuOpen(false), [cleanSchoolId]);

  useEffect(() => {
    if (!cleanSchoolId || hydratedSchoolId !== cleanSchoolId) return;
    persistVisibleTabsForSchool(cleanSchoolId, visibleTabs);
  }, [cleanSchoolId, hydratedSchoolId, visibleTabs]);
  useEffect(() => {
    if (!cleanSchoolId || hydratedSchoolId !== cleanSchoolId) return;
    persistActiveTabForSchool(cleanSchoolId, currentView);
  }, [cleanSchoolId, currentView, hydratedSchoolId]);
  useEffect(() => {
    if (visibleTabs.includes(currentView)) return;
    setCurrentView("all");
  }, [currentView, visibleTabs]);

  return (
    <section className="min-h-[calc(100vh-10rem)] bg-surface-canvas py-2 md:py-3" aria-label={`School workspace for ${workspaceLabel}`}>
      <div className="space-y-6">
        <header className="space-y-3">
          <WorkspaceUtilityActions />
          <h1 className="text-[2.25rem] font-semibold tracking-tight text-text-primary sm:text-[2.35rem]">
            Root Department
          </h1>
        </header>

        <nav className="relative flex w-full items-end gap-3 overflow-x-auto overflow-y-visible pb-1 text-[13px] text-text-secondary [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="School sections">
          <div className="flex min-w-0 items-center gap-7">
            {visibleTabs.map((tabId) => {
              const section = sectionById.get(tabId);
              if (!section) return null;
              const isPinned = section.id === "all";
              return (
                <div
                  key={section.id}
                  className={[
                    "group inline-flex shrink-0 items-center gap-1.5 pb-2 transition-colors",
                    currentView === section.id ? "text-primary-900" : "text-text-tertiary hover:text-text-secondary",
                  ].join(" ")}
                  role="tab"
                  aria-selected={currentView === section.id}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentView(section.id);
                      persistActiveTabForSchool(cleanSchoolId, section.id);
                    }}
                    className={[
                      "inline-flex shrink-0 items-center border-b-2 pb-0.5 font-medium",
                      currentView === section.id ? "border-primary-700" : "border-transparent",
                    ].join(" ")}
                    aria-current={currentView === section.id ? "page" : undefined}
                  >
                    {section.label}
                  </button>
                  {isPinned ? null : (
                    <button
                      type="button"
                      aria-label={`Remove ${section.label} tab`}
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemoveTab(section.id);
                      }}
                      className="inline-flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity hover:bg-surface-muted group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <div className="relative shrink-0">
            <button
              ref={addButtonRef}
              type="button"
              className="inline-flex h-6 items-center pb-2 text-text-tertiary transition-colors hover:text-text-secondary"
              aria-label="Add section tab"
              aria-expanded={isAddMenuOpen}
              aria-haspopup="menu"
              onClick={() => setIsAddMenuOpen((prev) => !prev)}
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </nav>

        {isAddMenuOpen
          ? createPortal(
              <div
                ref={addMenuRef}
                className="fixed z-[120] w-64 rounded-2xl border border-border-default bg-surface-default p-3 shadow-lg"
                style={{ top: `${menuPosition.top}px`, right: `${menuPosition.right}px` }}
                role="menu"
                aria-label="Add section tabs"
              >
                {addableTabs.length === 0 ? (
                  <p className="px-2 py-2 text-sm text-text-tertiary">All available tabs are already added.</p>
                ) : (
                  addableTabs.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitem"
                        onClick={() => onAddTab(option.id)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
                      >
                        <Icon className="size-4 text-text-primary" aria-hidden />
                        <span>{option.label}</span>
                      </button>
                    );
                  })
                )}
              </div>,
              document.body,
            )
          : null}

        {shouldShowWorkspaceLoading ? (
          <WorkspaceLoadingShimmer />
        ) : workspaceItems.length > 0 ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-text-tertiary">
                <button
                  type="button"
                  onClick={() => setLayoutMode("grid")}
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                    layoutMode === "grid"
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-border-default bg-surface-default hover:bg-surface-muted",
                  ].join(" ")}
                  aria-label="Grid layout"
                >
                  <LayoutGrid className="size-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutMode("list")}
                  className={[
                    "inline-flex h-10 w-10 items-center justify-center rounded-md border transition-colors",
                    layoutMode === "list"
                      ? "border-primary-600 bg-primary-600 text-white"
                      : "border-border-default bg-surface-default hover:bg-surface-muted",
                  ].join(" ")}
                  aria-label="List layout"
                >
                  <List className="size-4" aria-hidden />
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex h-10 w-[25rem] max-w-[70vw] items-center gap-2 rounded-full border border-border-default bg-surface-default px-4">
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search...!"
                    className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
                  />
                  <Search className="size-4 text-text-tertiary" aria-hidden />
                  <SlidersHorizontal className="size-4 text-text-tertiary" aria-hidden />
                </label>
                <Button type="button" variant="primary" size="sm" className="h-10 px-5" onClick={onNewClick}>
                  <Plus className="size-4" aria-hidden />
                  New
                </Button>
              </div>
            </div>

            {layoutMode === "grid" ? (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredWorkspaceItems.map((item) => (
                  <article key={item.id} className="flex min-h-[190px] flex-col rounded-[0.9rem] border border-border-default bg-surface-default px-5 py-4 shadow-[0_1px_2px_rgba(2,24,43,0.06)]">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[1.05rem] font-semibold leading-snug text-text-primary">{item.title}</p>
                      <div className="relative" data-card-menu-root="true">
                        <button
                          type="button"
                          className="text-text-tertiary hover:text-text-secondary"
                          aria-label="More options"
                          onClick={() => setOpenCardMenuId((prev) => (prev === item.id ? null : item.id))}
                        >
                          <EllipsisVertical className="size-4" aria-hidden />
                        </button>
                        {openCardMenuId === item.id ? (
                          <div className="absolute right-0 top-6 z-30 w-36 rounded-lg border border-border-default bg-surface-default p-1 shadow-lg" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
                              onClick={() => onEditItem(item)}
                            >
                              <Pencil className="size-4" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-text-secondary">
                      <span className="inline-flex items-center gap-1">
                        {item.type === "class" ? <GraduationCap className="size-3.5" aria-hidden /> : null}
                        {item.type === "course" ? <BookOpen className="size-3.5" aria-hidden /> : null}
                        {item.type === "management-table" ? <Table2 className="size-3.5" aria-hidden /> : null}
                        {item.type === "resource" ? <FileText className="size-3.5" aria-hidden /> : null}
                        {itemPrimaryMeta(item)}
                      </span>
                      {item.type === "management-table" ? (
                        <span className="inline-flex items-center gap-1">
                          <Share2 className="size-3.5" aria-hidden />
                          Sharable
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-3 line-clamp-2 text-[12px] text-text-secondary">{itemSecondaryMeta(item)}</p>
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className="text-[11px] text-text-tertiary">
                        {item.type === "resource" ? "2 minutes ago" : item.type === "course" ? "(4.8 Reviews)" : ""}
                      </span>
                      <Button type="button" variant="primary" size="sm" className="h-9 px-4 text-xs">
                        {item.type === "course"
                          ? "Go to course"
                          : item.type === "management-table"
                              ? "Go to Tables"
                              : "View"}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredWorkspaceItems.map((item) => (
                  <article key={item.id} className="flex items-center justify-between rounded-lg border border-border-default bg-surface-default px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="text-xs text-text-tertiary">{item.type.replace("-", " ")}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="secondary" size="sm">Open</Button>
                      <div className="relative" data-card-menu-root="true">
                        <button
                          type="button"
                          className="text-text-tertiary hover:text-text-secondary"
                          aria-label="More options"
                          onClick={() => setOpenCardMenuId((prev) => (prev === item.id ? null : item.id))}
                        >
                          <EllipsisVertical className="size-4" aria-hidden />
                        </button>
                        {openCardMenuId === item.id ? (
                          <div className="absolute right-0 top-6 z-30 w-36 rounded-lg border border-border-default bg-surface-default p-1 shadow-lg" role="menu">
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
                              onClick={() => onEditItem(item)}
                            >
                              <Pencil className="size-4" aria-hidden />
                              Edit
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-red-600 transition-colors hover:bg-red-50"
                              onClick={() => onDeleteItem(item.id)}
                            >
                              <Trash2 className="size-4" aria-hidden />
                              Delete
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        ) : (
          <DepartmentEmptyState onCreate={onNewClick} />
        )}
        <EditWorkspaceItemModal
          open={editingItemId !== null}
          title={editTitle}
          description={editDescription}
          submitting={updateWorkspaceItemMutation.isPending}
          submitError={editSubmitError}
          onTitleChange={setEditTitle}
          onDescriptionChange={setEditDescription}
          onClose={() => setEditingItemId(null)}
          onSubmit={() => {
            if (!editingItemId) return;
            const cleanTitle = editTitle.trim();
            if (!cleanTitle) {
              setEditSubmitError("Title is required.");
              return;
            }
            updateWorkspaceItemMutation.mutate({
              itemId: editingItemId,
              title: cleanTitle,
              description: editDescription.trim(),
            });
          }}
        />
        <DeleteWorkspaceItemModal
          open={deleteTargetItemId !== null}
          submitting={deleteWorkspaceItemMutation.isPending}
          onClose={() => setDeleteTargetItemId(null)}
          onConfirm={() => {
            if (!deleteTargetItemId) return;
            deleteWorkspaceItemMutation.mutate(deleteTargetItemId, {
              onSuccess: () => setDeleteTargetItemId(null),
            });
          }}
        />
        <CreationChooserModal
          open={creationModalOpen}
          selected={selectedCreateTarget}
          onClose={() => setCreationModalOpen(false)}
          onSelect={setSelectedCreateTarget}
          onNext={() => {
            if (!selectedCreateTarget) return;
            setCreationModalOpen(false);
            openDetailsFormFor(selectedCreateTarget);
          }}
        />
        <CreationDetailsModal
          open={detailsModalOpen}
          title={creationFormConfig.title}
          fields={creationFormConfig.fields}
          values={detailsFormValues}
          submitLabel={creationFormConfig.submitLabel}
          submitting={createWorkspaceItemMutation.isPending}
          submitError={detailsSubmitError}
          onClose={() => setDetailsModalOpen(false)}
          onChange={(key, value) => setDetailsFormValues((prev) => ({ ...prev, [key]: value }))}
          onSubmit={() => {
            const target = selectedCreateTarget ?? "department";
            const title = (detailsFormValues.title ?? "").trim();
            if (!title) {
              setDetailsSubmitError("Title is required.");
              return;
            }
            const description = (detailsFormValues.description ?? "").trim();
            const metadata = Object.entries(detailsFormValues).reduce<Record<string, unknown>>((acc, [key, value]) => {
              if (key === "title" || key === "description") return acc;
              const clean = value.trim();
              if (!clean) return acc;
              acc[key] = clean;
              return acc;
            }, {});
            createWorkspaceItemMutation.mutate({
              type: mapCreationChoiceToItemType(target),
              title,
              ...(description ? { description } : {}),
              metadata,
            });
          }}
        />
      </div>
    </section>
  );
}
/** ################################ /COMPONENT ############################# */
