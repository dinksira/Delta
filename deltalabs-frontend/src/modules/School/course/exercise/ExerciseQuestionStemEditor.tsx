"use client";

import {
  Bold,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ExerciseGhostBlockButton } from "@/modules/School/course/exercise/ExerciseGhostBlockButton";
import {
  insertImageIntoHtml,
  parseExerciseResourceDrag,
} from "@/modules/School/course/exercise/exerciseResourceDrag";

/** Stem editor with Figma-like toolbar; stores HTML string (contentEditable). */
export function ExerciseQuestionStemEditor({
  value,
  ghosted,
  onChange,
  onToggleGhost,
  placeholder = "Describe question briefly.",
}: Readonly<{
  value: string;
  ghosted?: boolean;
  onChange: (html: string) => void;
  onToggleGhost: () => void;
  placeholder?: string;
}>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const run = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };

  const acceptResourceDrop = (dataTransfer: DataTransfer | null) => {
    const payload = parseExerciseResourceDrag(dataTransfer);
    if (!payload?.previewUrl && !payload?.mediaId) return false;
    const src = payload.previewUrl?.trim();
    if (!src) return false;
    onChange(
      insertImageIntoHtml(value, {
        src,
        alt: payload.fileName || payload.name,
        resourceId: payload.id,
      }),
    );
    return true;
  };

  return (
    <div
      className={[
        "overflow-hidden rounded-xl border bg-white shadow-sm",
        dragOver ? "border-primary-500 ring-2 ring-primary-500/25" : "border-[#c5d0da]",
      ].join(" ")}
      onDragOver={(e) => {
        if (!parseExerciseResourceDrag(e.dataTransfer)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        if (acceptResourceDrop(e.dataTransfer)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e3ebf1] bg-[#f7fafc] px-2 py-1.5">
        <ToolbarBtn label="Undo" onClick={() => run("undo")}>
          <Undo2 className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Redo" onClick={() => run("redo")}>
          <Redo2 className="size-3.5" />
        </ToolbarBtn>
        <span className="mx-1 h-4 w-px bg-[#d5e0e8]" aria-hidden />
        <select
          className="h-7 rounded-md border border-transparent bg-transparent px-1 text-xs text-[#0f2a3d] outline-none hover:bg-white"
          defaultValue="p"
          onChange={(e) => run("formatBlock", e.target.value)}
          aria-label="Text style"
        >
          <option value="p">Normal text</option>
          <option value="h3">Heading</option>
        </select>
        <ToolbarBtn label="Bold" onClick={() => run("bold")}>
          <Bold className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Italic" onClick={() => run("italic")}>
          <Italic className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Underline" onClick={() => run("underline")}>
          <Underline className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Strikethrough" onClick={() => run("strikeThrough")}>
          <Strikethrough className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Bulleted list" onClick={() => run("insertUnorderedList")}>
          <List className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn label="Numbered list" onClick={() => run("insertOrderedList")}>
          <ListOrdered className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Link"
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) run("createLink", url);
          }}
        >
          <Link2 className="size-3.5" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Image"
          onClick={() => {
            const url = window.prompt("Image URL");
            if (url) run("insertImage", url);
          }}
        >
          <ImageIcon className="size-3.5" />
        </ToolbarBtn>
      </div>
      <div className="relative">
        <div
          ref={ref}
          role="textbox"
          aria-multiline
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          className={[
            "dl-stem-editor min-h-[8.5rem] px-3.5 py-3 text-sm leading-relaxed text-[#0f2a3d] outline-none",
            "empty:before:pointer-events-none empty:before:text-[#8a9aab] empty:before:content-[attr(data-placeholder)]",
            "[&_img]:inline-block [&_img]:max-w-full [&_img]:rounded-lg [&_img]:align-middle",
            "[&_img]:min-h-[48px] [&_img]:min-w-[64px] [&_img]:resize-both [&_img]:overflow-auto",
            "[&_img]:cursor-grab active:[&_img]:cursor-grabbing",
          ].join(" ")}
          onInput={() => onChange(ref.current?.innerHTML ?? "")}
        />
        <div className="absolute bottom-2 right-2">
          <ExerciseGhostBlockButton active={ghosted} onToggle={onToggleGhost} />
        </div>
      </div>
    </div>
  );
}

function ToolbarBtn({
  children,
  label,
  onClick,
}: Readonly<{
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex size-7 items-center justify-center rounded-md text-[#5a7184] hover:bg-white hover:text-[#0f2a3d]"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
