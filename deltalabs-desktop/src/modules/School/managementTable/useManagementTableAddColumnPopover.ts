"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useManagementTableAddColumnPopover() {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const anchorButtonRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [anchor, setAnchor] = useState<null | { top: number; left: number; width: number }>(null);

  const syncAnchorFromButton = useCallback(() => {
    const btn = anchorButtonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 8, left: rect.right - 360, width: rect.width });
  }, []);

  const openFromButton = useCallback((btn: HTMLButtonElement) => {
    anchorButtonRef.current = btn;
    const rect = btn.getBoundingClientRect();
    setAnchor({ top: rect.bottom + 8, left: rect.right - 360, width: rect.width });
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (event: PointerEvent) => {
      const btn = anchorButtonRef.current;
      const pop = popoverRef.current;
      if (!pop) return;
      if (event.target instanceof Node && btn?.contains(event.target)) return;
      if (event.target instanceof Node && pop.contains(event.target)) return;
      close();
    };
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (!open) return;
    syncAnchorFromButton();
    const onScrollOrResize = () => syncAnchorFromButton();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open, syncAnchorFromButton]);

  return {
    popoverRef,
    open,
    search,
    setSearch,
    anchor,
    openFromButton,
    close,
  };
}
