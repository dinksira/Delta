import type { ReactNode } from "react";

type FeedCardProps = Readonly<{
  children: ReactNode;
}>;

/** ~TikTok desktop column: portrait 9:16; width comes from parent (avoid % inside w-max flex → 0-width collapse). */
export function FeedCard({ children }: FeedCardProps) {
  return (
    <article className="relative aspect-[9/16] w-full overflow-hidden rounded-3xl border border-border-default bg-slate-300 shadow-md">
      {children}
    </article>
  );
}
