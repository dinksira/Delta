type FeedSearchInputProps = Readonly<{
  id?: string;
  placeholder?: string;
  /** When set with toggle handlers, shows the funnel control wired to the filter panel. */
  filterControlsId?: string;
  isFilterOpen?: boolean;
  onFilterToggle?: () => void;
}>;

function IconFilterFunnel({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3.5 5.25h13M5.75 10h8.5M8 14.75h4"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconSearch({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={8.5} cy={8.5} r={5.25} stroke="currentColor" strokeWidth={1.5} />
      <path d="M12.2 12.2 16.25 16.25" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/** TikTok / Figma-style pill: funnel | search field | magnifier. */
export function FeedSearchInput({
  id = "feed-search",
  placeholder = "Search...",
  filterControlsId,
  isFilterOpen,
  onFilterToggle,
}: FeedSearchInputProps) {
  const showFilter = Boolean(filterControlsId && onFilterToggle);

  return (
    <div className="flex h-11 w-full max-w-full items-center gap-2 rounded-full border border-border-default bg-surface-default px-2.5 py-1 shadow-sm">
      {showFilter ? (
        <button
          type="button"
          aria-label="Filters"
          aria-expanded={Boolean(isFilterOpen)}
          aria-controls={filterControlsId}
          onClick={onFilterToggle}
          className="inline-flex shrink-0 items-center justify-center rounded-full p-1.5 text-slate-600 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 dark:text-slate-300"
        >
          <IconFilterFunnel className="shrink-0" />
        </button>
      ) : null}

      <input
        id={id}
        type="search"
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm text-text-primary outline-none placeholder:text-text-secondary"
      />

      <span className="inline-flex shrink-0 items-center justify-center p-1 text-slate-600 dark:text-slate-300">
        <IconSearch className="shrink-0" />
      </span>
    </div>
  );
}
