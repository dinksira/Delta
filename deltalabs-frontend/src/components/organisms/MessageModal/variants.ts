/** ################################ VARIANTS ############################# */
/** Class maps for MessageModal. */

/** Dialog content: a header, a scrolling log, and a composer. */
export const contentClasses = "flex h-96 flex-col";

/** Heading row with the back control. */
export const headerClasses = "flex items-center gap-3 border-b border-border-default pb-3";

/** Back/close control. */
export const backButtonClasses =
  "rounded-md p-1 text-primary-600/60 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Conversation title. */
export const titleClasses = "text-sm font-bold text-primary-600";

/** Scrolling message log. */
export const logClasses = "flex-1 space-y-4 overflow-y-auto py-4";

/** Day separator chip. */
export const separatorClasses =
  "flex justify-center py-1.5";

/** Day separator pill. */
export const separatorPillClasses =
  "rounded-full bg-surface-muted px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-text-secondary";

/** Row for one message, aligned by sender. */
export const bubbleRowClasses = "flex flex-col";

/** Row for an outgoing message. */
export const bubbleRowMineClasses = "items-end";

/** Row for an incoming message. */
export const bubbleRowTheirsClasses = "items-start";

/** The bubble itself. */
export const bubbleClasses = "max-w-[85%] rounded-2xl px-4 py-2 shadow-sm";

/** Outgoing bubble. */
export const bubbleMineClasses = "rounded-tr-none bg-primary-600 text-white";

/** Incoming bubble. */
export const bubbleTheirsClasses = "rounded-tl-none bg-surface-muted text-text-primary";

/** Message body. */
export const bodyClasses = "text-sm font-medium leading-relaxed";

/** Timestamp and tick row. */
export const metaClasses = "mt-1 flex items-center gap-1";

/** Timestamp text. */
export const metaClassesMine = "justify-end text-white/70";

/** Timestamp text for incoming messages. */
export const metaClassesTheirs = "justify-start text-text-secondary";

/** Composer row. */
export const composerClasses = "flex items-end gap-3 border-t border-border-default pt-3";

/** Emoji toggle. */
export const emojiToggleClasses =
  "rounded-md p-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Emoji panel, anchored above the composer. */
export const emojiPanelClasses =
  "absolute bottom-full left-0 z-10 mb-2 flex flex-wrap gap-1 rounded-xl border border-border-default bg-surface-default p-2 shadow-md";

/** One emoji button. */
export const emojiButtonClasses =
  "rounded-md p-1 text-xl transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Textarea wrapper. */
export const inputWrapperClasses =
  "flex-1 rounded-xl border border-transparent bg-surface-muted px-4 py-2.5 transition-colors focus-within:border-primary-400";

/** Send button. */
export const sendButtonClasses =
  "rounded-xl bg-primary-600 p-2.5 text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400";

/** Empty state. */
export const emptyClasses = "flex flex-1 items-center justify-center text-sm text-text-secondary";
/** ################################ /VARIANTS ############################# */
