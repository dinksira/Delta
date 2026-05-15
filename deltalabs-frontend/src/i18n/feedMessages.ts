import type { AppLocale } from "@/i18n/constants";

export type FeedMessages = {
  /** Landing center strip: Video | Audio | … + left-rail search copy */
  browseCategories: {
    navAria: string;
    video: string;
    audio: string;
    ai: string;
    simulation: string;
    all: string;
    searchPlaceholder: string;
    filtersAria: string;
    searchSidebarAria: string;
    searchSidebarClose: string;
    searchSidebarCancel: string;
    searchSidebarViewAllTemplate: string;
    searchSidebarEmpty: string;
    searchSidebarLoading: string;
    searchSidebarError: string;
    /** `/search` results: tab labels and empty states */
    searchTabTop: string;
    searchTabUsers: string;
    searchHintNoQuery: string;
    searchEmptyTop: string;
    searchEmptyUsers: string;
    searchLoading: string;
    searchError: string;
    searchResultsTabsAria: string;
    /** Close full-page search and return to the previous screen (e.g. Video or Audio). */
    searchCloseReturnAria: string;
  };
};

const en: FeedMessages = {
  browseCategories: {
    navAria: "Browse feed categories",
    video: "Video",
    audio: "Audio",
    ai: "AI",
    simulation: "Simulation",
    all: "All",
    searchPlaceholder: "Search…",
    filtersAria: "Filters",
    searchSidebarAria: "Expanded search",
    searchSidebarClose: "Close search overlay",
    searchSidebarCancel: "Cancel",
    searchSidebarViewAllTemplate: 'View all results for "{q}"',
    searchSidebarEmpty: "No matches yet. Try another term.",
    searchSidebarLoading: "Searching…",
    searchSidebarError: "Search failed. Try again.",
    searchTabTop: "Top",
    searchTabUsers: "Users",
    searchHintNoQuery: "Enter a search in the field on the left, then press Enter.",
    searchEmptyTop: "No videos or clips matched that search.",
    searchEmptyUsers: "No users matched that search.",
    searchLoading: "Loading…",
    searchError: "Something went wrong while searching. Try again.",
    searchResultsTabsAria: "Search result categories",
    searchCloseReturnAria: "Close search and go back",
  },
};

const am: FeedMessages = {
  browseCategories: {
    navAria: "የፊድ ምድቦች",
    video: "ቪዲዮ",
    audio: "ኦድዮ",
    ai: "ሰ.ሠ.አ",
    simulation: "ሲሙሌሽን",
    all: "ሁሉም",
    searchPlaceholder: "ፈልግ…",
    filtersAria: "ማጣሪያዎች",
    searchSidebarAria: "የተራዘመ ፍለጋ",
    searchSidebarClose: "የፍለጋ ክፍል ዝጋ",
    searchSidebarCancel: "ተወው",
    searchSidebarViewAllTemplate: 'ለ "{q}" ሁሉንም ውጤቶች አሳይ',
    searchSidebarEmpty: "ምንም አልተገኘም። ሌላ ቃል ይሞክሩ።",
    searchSidebarLoading: "በመፈለግ ላይ…",
    searchSidebarError: "ፍለጋ አልተሳካም። እንደገና ይሞክሩ።",
    searchTabTop: "ምርጥ",
    searchTabUsers: "ተጠቃሚዎች",
    searchHintNoQuery: "በግራ ባለው የፍለጋ መስክ ውስጥ ይፃፉ፣ ከዚያ Enter ይጫኑ።",
    searchEmptyTop: "ለዚህ ፍለጋ ቪዲዮ ወይም ክሊፕ አልተገኘም።",
    searchEmptyUsers: "ተጠቃሚ አልተገኘም።",
    searchLoading: "በመጫን ላይ…",
    searchError: "ፍለጋ በሂደት ላይ ስህተት ተፈጥሯል። እንደገና ይሞክሩ።",
    searchResultsTabsAria: "የፍለጋ ውጤት አይነቶች",
    searchCloseReturnAria: "ፍለጋን ዝጋ እና ወደ ኋላ ተመለስ",
  },
};

export const FEED_MESSAGES: Record<AppLocale, FeedMessages> = {
  en,
  am,
};

export function feedMessagesFor(locale: AppLocale): FeedMessages {
  return FEED_MESSAGES[locale] ?? en;
}
