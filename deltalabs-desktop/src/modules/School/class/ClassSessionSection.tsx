import type { ReactNode } from "react";

import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/** Mock: horizontal bar — section title left, primary action right. */
export function ClassSessionSection({
  title,
  actions,
  children,
}: Readonly<{
  title: string;
  actions: ReactNode;
  children: ReactNode;
}>) {
  return (
    <section className="space-y-6" aria-labelledby="class-session-section-title">
      <div className={CLASS_WORKSPACE_LAYOUT.sectionBar}>
        <h2 id="class-session-section-title" className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          {title}
        </h2>
        <div className="flex shrink-0 items-center">{actions}</div>
      </div>
      {children}
    </section>
  );
}
