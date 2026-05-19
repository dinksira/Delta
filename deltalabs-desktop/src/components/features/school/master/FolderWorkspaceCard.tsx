"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this card component. */
import { Ellipsis, Pin } from "lucide-react";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FolderWorkspaceCardProps = Readonly<{
  title: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Folder-style card with custom top contour and caption. */
export function FolderWorkspaceCard({ title }: FolderWorkspaceCardProps) {
  return (
    <article className="flex min-h-[230px] flex-col items-center">
      <div className="relative h-[185px] w-full overflow-hidden rounded-[2rem] bg-[#d6dee5]">
        <div className="absolute -top-6 left-9 h-12 w-28 rounded-b-3xl bg-[#d6dee5]" />
        <button type="button" className="absolute left-6 top-5 text-black" aria-label="More options">
          <Ellipsis className="size-6" aria-hidden />
        </button>
        <span className="absolute right-8 top-7 text-primary-700">
          <Pin className="size-5 rotate-[-22deg]" aria-hidden />
        </span>
      </div>
      <p className="mt-4 text-[2rem] font-semibold tracking-tight text-text-secondary">{title}</p>
    </article>
  );
}
/** ################################ /COMPONENT ############################# */
