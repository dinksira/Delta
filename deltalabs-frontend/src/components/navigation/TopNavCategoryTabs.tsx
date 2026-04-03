"use client";

import Link from "next/link";

export type TopNavCategoryItem = Readonly<{
  label: string;
  href: string;
  active?: boolean;
}>;

type TopNavCategoryTabsProps = Readonly<{
  items: readonly TopNavCategoryItem[];
}>;

/**
 * Unauthorized landing center row: generous breathing room around labels and `|` dividers
 * (Figma / TikTok-style category strip).
 */
export function TopNavCategoryTabs({ items }: TopNavCategoryTabsProps) {
  return (
    <nav
      className="hidden min-w-0 items-center justify-center sm:flex lg:-translate-x-4 xl:-translate-x-5"
      aria-label="Top navigation categories"
    >
      <ul className="flex max-w-full flex-nowrap items-center justify-center overflow-hidden">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center">
            {index > 0 ? (
              <span
                className="select-none px-2 text-[15px] font-extralight text-white/50 lg:px-3 lg:text-[17px] xl:px-3.5 xl:text-[19px]"
                aria-hidden
              >
                |
              </span>
            ) : null}
            <Link
              href={item.href}
              className={[
                "whitespace-nowrap px-0.5 text-[15px] leading-snug transition-colors lg:text-[17px] xl:text-[19px]",
                item.active
                  ? "font-bold text-white"
                  : "font-normal text-white/75 hover:text-white/95",
              ].join(" ")}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
