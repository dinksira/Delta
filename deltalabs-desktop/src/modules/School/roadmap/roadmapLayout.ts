export const ROADMAP_SPINE_WIDTH_PX = 4;

/** Center spine column matches ROADMAP_SPINE_WIDTH_PX — keep as static string for Tailwind. */
export const ROADMAP_GRID = "grid grid-cols-[minmax(0,1fr)_4px_minmax(0,1fr)]";

/** Slightly narrower than section cards (max-w-sm) but wide enough to read titles. */
export const ROADMAP_CONTENT_LIST_MAX_WIDTH = "max-w-[15rem]";

/** Short horizontal branch from spine to each content card — keep static for Tailwind. */
export const ROADMAP_CONTENT_CONNECTOR_CLASS = "h-0.5 w-8 shrink-0 rounded-full";

/** Fills parent flex column — height comes from the class workspace shell, not viewport calc. */
export const ROADMAP_WORKSPACE_HEIGHT_CLASS = "h-full min-h-0 max-h-full";

export const ROADMAP_SECTION_CONNECTOR_CLASS = "h-0.5 flex-1 bg-emerald-400/85";
