type FeedFilterTriggerProps = Readonly<{
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
}>;

export function FeedFilterTrigger({ isOpen, onToggle, controlsId }: FeedFilterTriggerProps) {
  return (
    <button
      type="button"
      aria-expanded={isOpen}
      aria-controls={controlsId}
      onClick={onToggle}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
    >
      <span aria-hidden>≡</span>
      Filters
    </button>
  );
}
