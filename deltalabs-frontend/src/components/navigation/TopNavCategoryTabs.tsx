"use client";

import Link from "next/link";

export type TopNavCategoryItem = Readonly<{
  label: string;
  href: string;
  active?: boolean;
  closable?: boolean;
}>;

type TopNavCategoryTabsProps = Readonly<{
  items: readonly TopNavCategoryItem[];
}>;

export function TopNavCategoryTabs({ items }: TopNavCategoryTabsProps) {
  return (
    <nav className="hidden items-center gap-3 sm:flex" aria-label="Top navigation categories">
      {items.map((item) =>
        item.active ? (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex h-9 items-center gap-2 rounded-t-xl bg-slate-200 px-8 text-xs font-semibold text-slate-700"
          >
            {item.label}
            {item.closable ? <span aria-hidden className="text-slate-500">x</span> : null}
          </Link>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className="inline-flex items-center text-sm font-medium text-white/85 transition-colors hover:text-white"
          >
            {item.label}
          </Link>
        ),
      )}
    </nav>
  );
}
