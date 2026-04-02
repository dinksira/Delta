export type FeedActionItem = Readonly<{
  key: string;
  actionLabel: string;
  metaLabel: string;
  /** Optional label color (defaults to rail slate / white). */
  metaClassName?: string;
  /** @deprecated Icons are keyed by `key` for Figma-aligned artwork. */
  icon?: string;
  /** Shown inside the profile avatar circle when `key === "profile"`. */
  profileInitials?: string;
}>;

type FeedActionRailProps = Readonly<{
  items: readonly FeedActionItem[];
  activeActionKey: string | null;
  onActionToggle: (key: string) => void;
}>;

/** TikTok-like pill: faint disk on dark UI; on light canvas use a soft gray so it still reads. */
const railPillClass =
  "bg-black/[0.08] hover:bg-black/[0.12] text-slate-900 dark:bg-white/[0.12] dark:hover:bg-white/[0.18] dark:text-white";

const railLabelBase =
  "max-w-[3.5rem] whitespace-pre-line text-center text-[12px] font-semibold leading-tight";

const railLabelClass = `${railLabelBase} text-slate-800 dark:text-white`;

/** Hollow diamond (top-right open) + dual chevrons; matches rail glyph weight (Like / Comment). */
function IconGoToCourse() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.75 3.75 12 12 20.25 20.25 12"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon points="14.85,7.15 14.85,9.25 19.05,8.2" fill="currentColor" />
      <polygon points="14.85,9.55 14.85,11.65 19.05,10.6" fill="currentColor" />
    </svg>
  );
}

function IconLike({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 21s-6.716-4.036-9-8.5C.58 9.22 3.14 5.5 7.5 5.5c2.1 0 3.53 1.21 4.5 2.09.97-.88 2.4-2.09 4.5-2.09 4.36 0 6.92 3.72 4.5 7C18.716 16.964 12 21 12 21Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconComment() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M7 18H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-6l-5 3v-3Z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <circle cx={9} cy={11} r={0.9} fill="currentColor" />
      <circle cx={12} cy={11} r={0.9} fill="currentColor" />
      <circle cx={15} cy={11} r={0.9} fill="currentColor" />
    </svg>
  );
}

function IconBookmark({ filled }: Readonly<{ filled: boolean }>) {
  return (
    <svg width={20} height={22} viewBox="0 0 20 24" fill="none" aria-hidden>
      <path
        d="M4 3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18l-6-4-6 4V3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Curved share arrow (closer to TikTok than three-node graphic). */
function IconShare() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M13 5h6v6M19 5l-7 7M5 19a4 4 0 0 1 4-4h3"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProfile({ initials }: Readonly<{ initials: string }>) {
  return (
    <span className="text-[11px] font-bold leading-none" aria-hidden>
      {initials}
    </span>
  );
}

function RailGlyph({
  itemKey,
  active,
  profileInitials,
}: Readonly<{ itemKey: string; active: boolean; profileInitials: string }>) {
  switch (itemKey) {
    case "goToCourse":
      return <IconGoToCourse />;
    case "like":
      return <IconLike filled={active} />;
    case "comment":
      return <IconComment />;
    case "bookmark":
      return <IconBookmark filled={active} />;
    case "share":
      return <IconShare />;
    case "profile":
      return <IconProfile initials={profileInitials} />;
    default:
      return null;
  }
}

/** TikTok-style rail: soft translucent circles, white glyphs on dark / soft gray on light. */
export function FeedActionRail({ items, activeActionKey, onActionToggle }: FeedActionRailProps) {
  return (
    <aside className="flex shrink-0 flex-col items-center">
      <ul className="flex flex-col items-center gap-5">
        {items.map((item) => {
          const active = activeActionKey === item.key;
          const isProfile = item.key === "profile";
          const profileInitials = item.profileInitials ?? "EV";

          return (
            <li key={item.key} className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                aria-label={item.actionLabel}
                aria-pressed={isProfile ? undefined : active}
                onClick={() => onActionToggle(item.key)}
                className={[
                  "inline-flex h-[46px] w-[46px] items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/15 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-white/35 dark:focus-visible:ring-offset-slate-900",
                  isProfile
                    ? `${railPillClass} ring-2 ring-black/10 ring-offset-0 dark:ring-white/25`
                    : railPillClass,
                ].join(" ")}
              >
                <RailGlyph itemKey={item.key} active={active} profileInitials={profileInitials} />
              </button>
              {item.metaLabel && !isProfile ? (
                <span
                  className={
                    item.metaClassName ? `${railLabelBase} ${item.metaClassName}` : railLabelClass
                  }
                >
                  {item.metaLabel}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
