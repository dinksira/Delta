"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  CheckSquare,
  Highlighter,
  ImageIcon,
  Indent,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Outdent,
  Quote,
  Redo2,
  RemoveFormatting,
  Search,
  Send,
  Strikethrough,
  Subscript,
  Superscript,
  Table,
  Underline,
  Undo2,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";

import { Button, Input, DOCUMENT_BLOCK_HTML, DocumentEditor, insertDocumentHtml } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  createCourseSummary,
  deleteCourseSummary,
  fetchCourseSummary,
  fetchOrgAccess,
  fetchSchoolGhost,
  updateCourseSummary,
} from "@/modules/School/api";
import { userCanManageSchoolWorkspace } from "@/modules/School/class/schoolClassPermissions";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

type WorkMode = "ai" | "write";
type RibbonTab = "Home" | "Insert" | "Layout" | "References" | "Review";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stubGenerateSummaryHtml(prompt: string, title: string): string {
  const safe = escapeHtml(prompt.trim());
  const heading = escapeHtml(title.trim() || "Fast Summary");
  return `<h1>${heading}</h1><p>${safe}</p><h2>Key points</h2><ul><li>First point</li><li>Second point</li><li>Third point</li></ul>`;
}

function wordCountFromText(text: string): number {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return cleaned.split(" ").filter(Boolean).length;
}

function plainTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
}

export function FastSummaryWorkspaceView({
  schoolId,
  courseItemId,
  summaryId,
}: Readonly<{
  schoolId: string;
  courseItemId: string;
  summaryId?: string | null;
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { activeOrgId, mySchools, mySchoolsPending } = useSchoolActiveOrgId();
  const orgId = activeOrgId ?? "";
  const enabled = Boolean(orgId && schoolId && courseItemId) && !mySchoolsPending;
  const editorRef = useRef<HTMLDivElement | null>(null);
  const findInputRef = useRef<HTMLInputElement | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schoolMembership = mySchools.find((row) => row.schoolId === schoolId.trim()) ?? null;
  const orgAccessQuery = useQuery({
    queryKey: schoolQueryKeys.orgAccess(userId, orgId || null),
    queryFn: () => fetchOrgAccess(orgId),
    enabled: isAuthenticated && isReady && Boolean(orgId),
    staleTime: 30_000,
    retry: false,
  });
  const canManage = userCanManageSchoolWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );

  const backHref = `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}?nav=summary`;

  const detailQuery = useQuery({
    queryKey: schoolQueryKeys.courseSummary(orgId, schoolId, courseItemId, summaryId ?? ""),
    queryFn: () => fetchCourseSummary(orgId, schoolId, courseItemId, summaryId!),
    enabled: enabled && Boolean(summaryId),
  });

  const ghostId = detailQuery.data?.ghostId?.trim() || "";
  const ghostQuery = useQuery({
    queryKey: schoolQueryKeys.ghost(orgId, schoolId, ghostId || "none"),
    queryFn: () => fetchSchoolGhost(orgId, schoolId, ghostId),
    enabled: enabled && Boolean(ghostId),
  });

  const canEditWork = useMemo(() => {
    if (!ghostId) return true;
    if (canManage) return true;
    const ghost = ghostQuery.data;
    if (!ghost) return false;
    const uid = session?.user?.id;
    if (!uid) return false;
    if (ghost.createdByUserId === uid) {
      const end =
        ghost.nodes.find((n) => n.role === "end") ??
        ghost.nodes.find((n) => n.isDefault) ??
        ghost.nodes[0];
      if (!end || end.assigneeUserIds.length === 0) return true;
    }
    const end =
      ghost.nodes.find((n) => n.role === "end") ??
      ghost.nodes.find((n) => n.isDefault) ??
      ghost.nodes[0];
    if (!end) return false;
    return end.assigneeUserIds.includes(uid);
  }, [canManage, ghostId, ghostQuery.data, session?.user?.id]);

  const [mode, setMode] = useState<WorkMode>("ai");
  const [title, setTitle] = useState("New Summary");
  const [bodyHtml, setBodyHtml] = useState("");
  const [layout, setLayout] = useState<"stack" | "split">("stack");
  const [pagePad, setPagePad] = useState<"normal" | "narrow" | "wide">("normal");
  const [pageWidth, setPageWidth] = useState<"standard" | "narrow" | "wide">("wide");
  const [aiPrompt, setAiPrompt] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [autoSaveOn, setAutoSaveOn] = useState(true);
  const [autoSaveState, setAutoSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(summaryId ?? null);
  const [hydrated, setHydrated] = useState(!summaryId);
  const [ribbonTab, setRibbonTab] = useState<RibbonTab>("Home");
  const [fontName, setFontName] = useState("Aptos");
  const [fontSize, setFontSize] = useState("3");

  const editLocked = Boolean(ghostId) && !canEditWork;

  useEffect(() => {
    if (!detailQuery.data || hydrated) return;
    const s = detailQuery.data;
    setTitle(s.title || "New Summary");
    setBodyHtml(s.bodyHtml || "");
    setLayout(s.layout === "stack" ? "stack" : "split");
    setCurrentId(s.id);
    setMode(s.bodyHtml?.replace(/<[^>]+>/g, "").trim() ? "write" : "ai");
    setHydrated(true);
  }, [detailQuery.data, hydrated]);

  useEffect(() => {
    if (mode !== "write") return;
    const el = editorRef.current;
    if (!el || !hydrated) return;
    if (el.innerHTML !== bodyHtml) el.innerHTML = bodyHtml || "";
  }, [bodyHtml, hydrated, mode]);

  const syncBodyFromEditor = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? "";
    setBodyHtml(html);
    return html;
  }, []);

  const runCmd = useCallback(
    (command: string, value?: string) => {
      if (editLocked) return;
      editorRef.current?.focus();
      document.execCommand(command, false, value);
      syncBodyFromEditor();
    },
    [editLocked, syncBodyFromEditor],
  );

  const insertHtml = useCallback(
    (html: string) => {
      if (editLocked) return;
      insertDocumentHtml(editorRef.current, html);
      syncBodyFromEditor();
    },
    [editLocked, syncBodyFromEditor],
  );

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      if (!canEditWork) throw new Error("You are not assigned to edit this ghost work.");
      const html = mode === "write" ? syncBodyFromEditor() : bodyHtml;
      const payload = {
        title: title.trim() || "New Summary",
        bodyHtml: html,
        layout,
        status,
      };
      if (currentId) {
        return updateCourseSummary(orgId, schoolId, courseItemId, currentId, payload);
      }
      return createCourseSummary(orgId, schoolId, courseItemId, payload);
    },
    onSuccess: async (s) => {
      setError(null);
      setCurrentId(s.id);
      setBodyHtml(s.bodyHtml || "");
      setAutoSaveState("saved");
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.courseSummaries(orgId, schoolId, courseItemId),
      });
      if (!summaryId) {
        router.replace(
          `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}/summaries/${encodeURIComponent(s.id)}/edit`,
        );
      }
      if (s.status === "published") router.push(backHref);
    },
    onError: (err) => {
      setAutoSaveState("idle");
      setError(err instanceof ApiError ? err.message : "Could not save summary.");
    },
  });

  const scheduleAutoSave = useCallback(() => {
    if (!autoSaveOn || editLocked) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveState("saving");
    autoSaveTimer.current = setTimeout(() => {
      saveMutation.mutate("draft");
    }, 900);
  }, [autoSaveOn, editLocked, saveMutation]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  const trashMutation = useMutation({
    mutationFn: async () => {
      if (!currentId) return;
      await deleteCourseSummary(orgId, schoolId, courseItemId, currentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.courseSummaries(orgId, schoolId, courseItemId),
      });
      router.push(backHref);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not delete summary.");
    },
  });

  const runAiGenerate = async () => {
    if (!aiPrompt.trim() || editLocked) return;
    setGenerating(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 350));
      setBodyHtml(stubGenerateSummaryHtml(aiPrompt, title));
      setMode("write");
      setAiPrompt("");
    } finally {
      setGenerating(false);
    }
  };

  const findInDocument = () => {
    const q = findQuery.trim();
    if (!q || !editorRef.current) return;
    // Clear previous marks
    editorRef.current.querySelectorAll("mark[data-find]").forEach((m) => {
      const parent = m.parentNode;
      if (!parent) return;
      parent.replaceChild(document.createTextNode(m.textContent || ""), m);
      parent.normalize();
    });
    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let node = walker.nextNode();
    while (node) {
      nodes.push(node as Text);
      node = walker.nextNode();
    }
    const lower = q.toLowerCase();
    for (const textNode of nodes) {
      const value = textNode.nodeValue || "";
      const idx = value.toLowerCase().indexOf(lower);
      if (idx < 0) continue;
      const range = document.createRange();
      range.setStart(textNode, idx);
      range.setEnd(textNode, idx + q.length);
      const mark = document.createElement("mark");
      mark.setAttribute("data-find", "1");
      mark.style.background = "#ffe566";
      range.surroundContents(mark);
      mark.scrollIntoView({ block: "center", behavior: "smooth" });
      break;
    }
    syncBodyFromEditor();
  };

  const outlineHeadings = useMemo(() => {
    if (typeof document === "undefined" || !bodyHtml) return [] as { tag: string; text: string }[];
    const tmp = document.createElement("div");
    tmp.innerHTML = bodyHtml;
    return Array.from(tmp.querySelectorAll("h1, h2, h3")).map((el) => ({
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || "").trim() || "Untitled",
    }));
  }, [bodyHtml]);

  if (!enabled && !mySchoolsPending) {
    return <p className="p-6 text-sm text-text-secondary">Select an organization to edit summaries.</p>;
  }
  if (summaryId && detailQuery.isPending && !hydrated) {
    return <p className="p-6 text-sm text-text-secondary">Loading summary…</p>;
  }
  if (summaryId && detailQuery.isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {detailQuery.error instanceof ApiError ? detailQuery.error.message : "Could not load summary."}
      </p>
    );
  }

  const busy = saveMutation.isPending || trashMutation.isPending || generating;
  const words = wordCountFromText(`${title} ${plainTextFromHtml(bodyHtml)}`);
  const pagePadClass =
    pagePad === "narrow" ? "px-6 py-5" : pagePad === "wide" ? "px-12 py-8" : "px-8 py-6";
  const pageWidthClass =
    pageWidth === "narrow"
      ? "max-w-[48rem]"
      : pageWidth === "wide"
        ? "max-w-[min(96rem,100%)]"
        : "max-w-[72rem]";

  return (
    <div
      className={[
        "mx-auto flex min-h-[calc(100vh-5rem)] max-w-[100rem] flex-col",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
      ].join(" ")}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 px-1">
        <button
          type="button"
          className="text-sm font-medium text-text-secondary hover:text-text-primary"
          onClick={() => router.push(backHref)}
        >
          ← Back
        </button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || editLocked}
            onClick={() => setMode(mode === "ai" ? "write" : "ai")}
          >
            {mode === "ai" ? "Write document" : "Generate with AI"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy || editLocked}
            onClick={() => saveMutation.mutate("draft")}
          >
            Save draft
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={busy || editLocked}
            onClick={() => saveMutation.mutate("published")}
          >
            Publish
          </Button>
        </div>
      </div>

      {editLocked ? (
        <p className="mb-2 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Read-only — only assignees can edit.
        </p>
      ) : null}
      {error ? (
        <p className="mb-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-default bg-white shadow-sm">
        {mode === "ai" ? (
          <div className="flex flex-1 flex-col bg-white">
            <div className="flex flex-1 flex-col items-center justify-center px-6">
              <div className="mb-5 flex size-[5.5rem] items-center justify-center rounded-full bg-[#e8eef2] text-primary-800">
                <span className="text-[1.75rem] font-bold tracking-tight">A+</span>
              </div>
              <p className="text-[1.35rem] font-semibold text-[#0f2a3d]">Generate Fast Summary</p>
            </div>
            <div className="px-6 pb-8">
              <div className="relative mx-auto max-w-3xl rounded-2xl border border-[#d5e0e8] bg-[#f0f3f5] px-4 py-3 pr-14">
                <textarea
                  value={aiPrompt}
                  rows={2}
                  disabled={editLocked || busy}
                  placeholder="Ask anything to generate fast summary..."
                  className="w-full resize-none bg-transparent text-sm text-[#0f2a3d] outline-none placeholder:text-[#8a9aab]"
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void runAiGenerate();
                    }
                  }}
                />
                <button
                  type="button"
                  disabled={editLocked || busy || !aiPrompt.trim()}
                  aria-label="Send"
                  className="absolute bottom-3 right-3 inline-flex size-10 items-center justify-center rounded-full bg-primary-800 text-white disabled:opacity-50"
                  onClick={() => void runAiGenerate()}
                >
                  <Send className="size-4" aria-hidden />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-[#e3ebf1] bg-[#f3f3f3] px-3 py-1.5">
              <label className="inline-flex items-center gap-1.5 text-[11px] text-[#5a6b7a]">
                <input
                  type="checkbox"
                  checked={autoSaveOn}
                  disabled={editLocked}
                  onChange={(e) => setAutoSaveOn(e.target.checked)}
                />
                AutoSave
                {autoSaveOn ? (
                  <span className="text-[#8a9aab]">
                    {autoSaveState === "saving" ? "· saving…" : autoSaveState === "saved" ? "· saved" : ""}
                  </span>
                ) : null}
              </label>
              <span className="mx-1 h-4 w-px bg-[#d0d7de]" aria-hidden />
              <ToolBtn label="Undo" onClick={() => runCmd("undo")}>
                <Undo2 className="size-3.5" />
              </ToolBtn>
              <ToolBtn label="Redo" onClick={() => runCmd("redo")}>
                <Redo2 className="size-3.5" />
              </ToolBtn>
              <p className="min-w-0 flex-1 truncate text-center text-sm font-medium text-[#0f2a3d]">
                {title || "Untitled"}
              </p>
              <div className="flex items-center gap-1 rounded-md border border-[#d0d7de] bg-white px-2 py-1">
                <Search className="size-3.5 text-[#8a9aab]" aria-hidden />
                <input
                  ref={findInputRef}
                  value={findQuery}
                  disabled={editLocked}
                  className="w-28 bg-transparent text-xs outline-none placeholder:text-[#8a9aab] sm:w-36"
                  placeholder="Find…"
                  onChange={(e) => setFindQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      findInDocument();
                    }
                  }}
                />
              </div>
            </div>

            {/* Ribbon tabs */}
            <div className="border-b border-[#e3ebf1] bg-[#fafafa]">
              <div className="flex gap-1 px-3 pt-1">
                {(["Home", "Insert", "Layout", "References", "Review"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    className={[
                      "rounded-t px-3 py-1.5 text-xs font-medium",
                      ribbonTab === tab
                        ? "bg-white text-[#0f2a3d] shadow-sm"
                        : "text-[#5a6b7a] hover:bg-white/70",
                    ].join(" ")}
                    onClick={() => setRibbonTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex h-9 flex-nowrap items-center gap-1 overflow-x-auto border-t border-[#e3ebf1] bg-white px-2">
                {ribbonTab === "Home" ? (
                  <>
                    <RibbonSelect
                      aria-label="Paragraph style"
                      defaultValue="p"
                      onChange={(e) => runCmd("formatBlock", e.target.value)}
                    >
                      <option value="p">Normal</option>
                      <option value="h1">Title</option>
                      <option value="h2">Heading 1</option>
                      <option value="h3">Heading 2</option>
                      <option value="blockquote">Quote</option>
                    </RibbonSelect>
                    <RibbonSelect
                      aria-label="Font"
                      value={fontName}
                      onChange={(e) => {
                        setFontName(e.target.value);
                        runCmd("fontName", e.target.value);
                      }}
                    >
                      <option value="Aptos">Aptos</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Courier New">Courier New</option>
                    </RibbonSelect>
                    <RibbonSelect
                      className="w-14"
                      aria-label="Font size"
                      value={fontSize}
                      onChange={(e) => {
                        setFontSize(e.target.value);
                        runCmd("fontSize", e.target.value);
                      }}
                    >
                      <option value="1">10</option>
                      <option value="2">13</option>
                      <option value="3">16</option>
                      <option value="4">18</option>
                      <option value="5">24</option>
                      <option value="6">32</option>
                      <option value="7">48</option>
                    </RibbonSelect>
                    <Sep />
                    <ToolBtn label="Bold" onClick={() => runCmd("bold")}>
                      <Bold className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Italic" onClick={() => runCmd("italic")}>
                      <Italic className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Underline" onClick={() => runCmd("underline")}>
                      <Underline className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Strikethrough" onClick={() => runCmd("strikeThrough")}>
                      <Strikethrough className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Subscript" onClick={() => runCmd("subscript")}>
                      <Subscript className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Superscript" onClick={() => runCmd("superscript")}>
                      <Superscript className="size-3.5" />
                    </ToolBtn>
                    <label className="inline-flex size-7 items-center justify-center rounded hover:bg-[#f0f3f5]" title="Text color">
                      <input
                        type="color"
                        className="size-4 cursor-pointer border-0 bg-transparent p-0"
                        defaultValue="#0f2a3d"
                        onChange={(e) => runCmd("foreColor", e.target.value)}
                      />
                    </label>
                    <ToolBtn label="Highlight" onClick={() => runCmd("hiliteColor", "#ffe566")}>
                      <Highlighter className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Clear formatting" onClick={() => runCmd("removeFormat")}>
                      <RemoveFormatting className="size-3.5" />
                    </ToolBtn>
                    <Sep />
                    <ToolBtn label="Bullets" onClick={() => runCmd("insertUnorderedList")}>
                      <List className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Numbered" onClick={() => runCmd("insertOrderedList")}>
                      <ListOrdered className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Indent" onClick={() => runCmd("indent")}>
                      <Indent className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Outdent" onClick={() => runCmd("outdent")}>
                      <Outdent className="size-3.5" />
                    </ToolBtn>
                    <Sep />
                    <ToolBtn label="Align left" onClick={() => runCmd("justifyLeft")}>
                      <AlignLeft className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Align center" onClick={() => runCmd("justifyCenter")}>
                      <AlignCenter className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Align right" onClick={() => runCmd("justifyRight")}>
                      <AlignRight className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Justify" onClick={() => runCmd("justifyFull")}>
                      <AlignJustify className="size-3.5" />
                    </ToolBtn>
                    <div className="ml-auto">
                      <button
                        type="button"
                        className="inline-flex h-7 items-center gap-1 rounded px-2 text-xs font-medium text-[#0f2a3d] hover:bg-[#f0f3f5]"
                        onClick={() =>
                          router.push(
                            `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}?nav=exercise`,
                          )
                        }
                      >
                        <Zap className="size-3.5 text-primary-700" aria-hidden />
                        Fast Exercise
                      </button>
                    </div>
                  </>
                ) : null}

                {ribbonTab === "Insert" ? (
                  <>
                    <ToolBtn
                      label="Link"
                      onClick={() => {
                        const url = window.prompt("Link URL", "https://");
                        if (url?.trim()) runCmd("createLink", url.trim());
                      }}
                    >
                      <Link2 className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn
                      label="Image"
                      onClick={() => {
                        const url = window.prompt("Image URL");
                        if (url?.trim()) runCmd("insertImage", url.trim());
                      }}
                    >
                      <ImageIcon className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Horizontal line" onClick={() => runCmd("insertHorizontalRule")}>
                      <Minus className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn
                      label="Table"
                      onClick={() => insertHtml(DOCUMENT_BLOCK_HTML.table)}
                    >
                      <Table className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn
                      label="Quote"
                      onClick={() => runCmd("formatBlock", "blockquote")}
                    >
                      <Quote className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn
                      label="To-do"
                      onClick={() => insertHtml(DOCUMENT_BLOCK_HTML.todo)}
                    >
                      <CheckSquare className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn
                      label="Callout"
                      onClick={() => insertHtml(DOCUMENT_BLOCK_HTML.callout)}
                    >
                      <Highlighter className="size-3.5" />
                    </ToolBtn>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() =>
                        insertHtml(`<p>${escapeHtml(new Date().toLocaleString())}</p>`)
                      }
                    >
                      Insert date
                    </RibbonChip>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() => insertHtml("<p><br></p>")}
                    >
                      New paragraph
                    </RibbonChip>
                  </>
                ) : null}

                {ribbonTab === "Layout" ? (
                  <>
                    <RibbonSelect
                      aria-label="Margins"
                      value={pagePad}
                      onChange={(e) => setPagePad(e.target.value as typeof pagePad)}
                    >
                      <option value="narrow">Margins: Narrow</option>
                      <option value="normal">Margins: Normal</option>
                      <option value="wide">Margins: Wide</option>
                    </RibbonSelect>
                    <RibbonSelect
                      aria-label="Page width"
                      value={pageWidth}
                      onChange={(e) => setPageWidth(e.target.value as typeof pageWidth)}
                    >
                      <option value="narrow">Width: Narrow</option>
                      <option value="standard">Width: Standard</option>
                      <option value="wide">Width: Wide</option>
                    </RibbonSelect>
                    <RibbonSelect
                      aria-label="Composer layout"
                      value={layout}
                      onChange={(e) => {
                        setLayout(e.target.value as "stack" | "split");
                        scheduleAutoSave();
                      }}
                    >
                      <option value="stack">Layout: Stack</option>
                      <option value="split">Layout: Split</option>
                    </RibbonSelect>
                    <Sep />
                    <ToolBtn label="Indent" onClick={() => runCmd("indent")}>
                      <Indent className="size-3.5" />
                    </ToolBtn>
                    <ToolBtn label="Outdent" onClick={() => runCmd("outdent")}>
                      <Outdent className="size-3.5" />
                    </ToolBtn>
                  </>
                ) : null}

                {ribbonTab === "References" ? (
                  <>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() => {
                        const cite = window.prompt("Citation text", "Author, Year");
                        if (cite?.trim()) {
                          insertHtml(
                            `<sup title="${escapeHtml(cite.trim())}">[${escapeHtml(cite.trim())}]</sup>`,
                          );
                        }
                      }}
                    >
                      Insert citation
                    </RibbonChip>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() => {
                        const note = window.prompt("Footnote");
                        if (note?.trim()) {
                          insertHtml(
                            `<sup>*</sup><p style="font-size:12px;color:#5a6b7a"><em>* ${escapeHtml(note.trim())}</em></p>`,
                          );
                        }
                      }}
                    >
                      Insert footnote
                    </RibbonChip>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() =>
                        insertHtml(`<h2>References</h2><ol><li></li><li></li></ol>`)
                      }
                    >
                      References list
                    </RibbonChip>
                  </>
                ) : null}

                {ribbonTab === "Review" ? (
                  <>
                    <input
                      className="h-7 w-40 shrink-0 rounded border border-[#d0d7de] bg-white px-2 text-xs text-[#0f2a3d] outline-none focus:border-primary-400"
                      value={findQuery}
                      placeholder="Find in document"
                      disabled={editLocked}
                      onChange={(e) => setFindQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          findInDocument();
                        }
                      }}
                    />
                    <RibbonChip
                      disabled={editLocked || !findQuery.trim()}
                      onClick={findInDocument}
                    >
                      Find next
                    </RibbonChip>
                    <RibbonChip disabled={editLocked} onClick={() => runCmd("selectAll")}>
                      Select all
                    </RibbonChip>
                    <span className="shrink-0 px-2 text-xs text-[#5a6b7a]">{words} words</span>
                    <RibbonChip
                      disabled={editLocked}
                      onClick={() => {
                        const note = window.prompt("Comment");
                        if (note?.trim()) {
                          insertHtml(
                            `<span style="background:#fff3cd;padding:0 4px" title="Comment">[Comment] ${escapeHtml(note.trim())}</span>`,
                          );
                        }
                      }}
                    >
                      Add comment
                    </RibbonChip>
                  </>
                ) : null}
              </div>
            </div>

            {/* Page */}
            <div className="flex-1 overflow-auto bg-[#eceff1] px-2 py-3 sm:px-4">
              <div
                className={[
                  "mx-auto min-h-[calc(100vh-16rem)] w-full bg-white shadow-sm",
                  pageWidthClass,
                  pagePadClass,
                  layout === "split" ? "lg:grid lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-6" : "",
                ].join(" ")}
              >
                {layout === "split" ? (
                  <aside className="mb-3 border-b border-[#e3ebf1] pb-3 lg:mb-0 lg:border-b-0 lg:border-r lg:pr-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8a9aab]">
                      Outline
                    </p>
                    {outlineHeadings.length === 0 ? (
                      <p className="mt-2 text-xs text-[#8a9aab]">
                        Type <kbd className="rounded bg-[#f0f3f5] px-1">/</kbd> Title or Heading
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-1">
                        {outlineHeadings.map((h, i) => (
                          <li
                            key={`${h.tag}-${i}-${h.text}`}
                            className={[
                              "truncate text-xs text-[#5a6b7a]",
                              h.tag === "h1" ? "font-semibold text-[#0f2a3d]" : "",
                              h.tag === "h3" ? "pl-2" : "",
                            ].join(" ")}
                          >
                            {h.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </aside>
                ) : null}
                <div>
                  <Input
                    value={title}
                    disabled={editLocked || busy}
                    className="mb-2 border-0 bg-transparent px-0 text-[1.65rem] font-bold leading-tight shadow-none focus:ring-0"
                    placeholder="Untitled"
                    onChange={(e) => {
                      setTitle(e.target.value);
                      scheduleAutoSave();
                    }}
                  />
                  <p className="mb-3 text-[11px] text-[#8a9aab]">
                    Press <span className="font-medium text-[#5a6b7a]">/</span> for blocks · select
                    text for formatting
                  </p>
                  <DocumentEditor
                    editorRef={editorRef}
                    disabled={editLocked || busy}
                    className="min-h-[20rem]"
                    runCmd={runCmd}
                    onChange={() => {
                      syncBodyFromEditor();
                      scheduleAutoSave();
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-[#e3ebf1] bg-[#f3f3f3] px-3 py-1 text-[11px] text-[#5a6b7a]">
              <span>Page 1 of 1</span>
              <span>{words} words</span>
              <span className="ml-auto">English (United States)</span>
              {currentId ? (
                <button
                  type="button"
                  className="text-red-600 hover:underline disabled:opacity-50"
                  disabled={busy || editLocked}
                  onClick={() => trashMutation.mutate()}
                >
                  Move to Trash
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sep() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-[#e3ebf1]" aria-hidden />;
}

function RibbonSelect({
  className,
  children,
  ...props
}: Readonly<SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <select
      className={[
        "h-7 shrink-0 rounded border border-[#d0d7de] bg-white px-1.5 text-xs text-[#0f2a3d] outline-none focus:border-primary-400",
        className ?? "",
      ].join(" ")}
      {...props}
    >
      {children}
    </select>
  );
}

function RibbonChip({
  children,
  disabled,
  onClick,
}: Readonly<{
  children: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      className="inline-flex h-7 shrink-0 items-center rounded border border-[#d0d7de] bg-white px-2 text-xs font-medium text-[#0f2a3d] hover:bg-[#f0f3f5] disabled:opacity-50"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function ToolBtn({
  children,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded text-[#3b4a57] hover:bg-[#f0f3f5]"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
