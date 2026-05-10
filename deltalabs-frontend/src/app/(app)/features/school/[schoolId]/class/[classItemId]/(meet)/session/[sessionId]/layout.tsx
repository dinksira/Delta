/** ################################ IMPORT ############################# */
import type { ReactNode } from "react";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Full-viewport shell for Meet-style session (no class bottom nav from `(workspace)`). */
export default function ClassSessionMeetShellLayout({ children }: Readonly<{ children: ReactNode }>) {
  /** Fill space under `TopNav` (`h-dvh` would ignore chrome and clip the session). */
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface-canvas text-text-primary">
      {children}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
