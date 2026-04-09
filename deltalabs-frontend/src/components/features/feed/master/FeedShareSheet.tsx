"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Copy, Link2, MessageCircleMore, Send, X } from "lucide-react";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for TikTok-style feed share sheet. */
type FeedShareSheetProps = Readonly<{
  open: boolean;
  onClose: () => void;
  onShareSelect: () => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Share sheet inspired by TikTok: quick share actions in a horizontal row. */
export function FeedShareSheet({ open, onClose, onShareSelect }: FeedShareSheetProps) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[1250] flex items-end justify-center bg-black/45 p-3" role="dialog" aria-modal="true" aria-label="Share video">
      <div className="w-full max-w-xl rounded-xl bg-surface-default p-3 shadow-md sm:p-3.5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">Share to</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close share options"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <ul className="flex min-w-max items-start gap-2">
            <ShareItem label="Repost" tone="bg-yellow-400" icon={<MessageCircleMore className="h-4 w-4 text-white" />} onClick={onShareSelect} />
            <ShareItem label="Send to friends" tone="bg-pink-500" icon={<Send className="h-4 w-4 text-white" />} onClick={onShareSelect} />
            <ShareItem label="Copy link" tone="bg-blue-500" icon={<Link2 className="h-4 w-4 text-white" />} onClick={onShareSelect} />
            <ShareItem label="Embed" tone="bg-cyan-400" icon={<span className="text-sm font-semibold text-white">{`</>`}</span>} onClick={onShareSelect} />
            <ShareItem label="Copy" tone="bg-indigo-500" icon={<Copy className="h-4 w-4 text-white" />} onClick={onShareSelect} />
          </ul>
        </div>
      </div>
    </div>,
    document.body,
  );
}
/** ################################ /COMPONENT ############################# */

/** ################################ SUBCOMPONENTS ############################# */
/** Small action circle + label tile used by the share sheet row. */
function ShareItem({
  label,
  tone,
  icon,
  onClick,
}: Readonly<{ label: string; tone: string; icon: ReactNode; onClick: () => void }>) {
  return (
    <li className="w-14 text-center">
      <button type="button" onClick={onClick} className="w-full cursor-pointer">
        <span className={`mx-auto inline-flex h-10 w-10 items-center justify-center rounded-full ${tone}`}>
          {icon}
        </span>
        <span className="mt-1.5 block text-[10px] font-medium leading-tight text-text-primary">{label}</span>
      </button>
    </li>
  );
}
/** ################################ /SUBCOMPONENTS ############################# */
