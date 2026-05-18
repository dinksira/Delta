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
    /** Top nav + `/custom` page */
    customTabDefault: string;
    customTabNavAria: string;
  };
  customTab: {
    setupTitle: string;
    setupDescription: string;
    tabNameLabel: string;
    tabNamePlaceholder: string;
    saveButton: string;
    savingButton: string;
    filtersRequired: string;
    guestTitle: string;
    guestDescription: string;
    signInButton: string;
    editButton: string;
    emptyTitle: string;
    emptyDescription: string;
    loadError: string;
    retry: string;
    filterModalTitle: string;
    filterModalDescription: string;
    contentTypeLabel: string;
    topicLabel: string;
    courseTypeLabel: string;
    courseAllLabel: string;
    lengthLabel: string;
    durationShort: string;
    durationMedium: string;
    durationLong: string;
    filterApplyButton: string;
    filterCancelButton: string;
    filterClearButton: string;
    filtersSelectedLabel: string;
    noFiltersSelected: string;
    configurePrompt: string;
    configureButton: string;
    backToGrid: string;
    backToGridAria: string;
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
    customTabDefault: "Custom",
    customTabNavAria: "Custom feed tab",
  },
  customTab: {
    setupTitle: "Create your custom feed",
    setupDescription: "Name this tab and choose at least one filter. Your picks are saved to your account.",
    tabNameLabel: "Tab name",
    tabNamePlaceholder: "Custom",
    saveButton: "Save custom feed",
    savingButton: "Saving…",
    filtersRequired: "Choose at least one filter before saving.",
    guestTitle: "Sign in to customize your feed",
    guestDescription: "The Custom tab is available to everyone. Sign in to name it and save your filter preferences.",
    signInButton: "Sign in",
    editButton: "Edit filters",
    emptyTitle: "No clips match your filters",
    emptyDescription: "Try broadening your filters or edit this tab’s settings.",
    loadError: "Could not load your custom feed.",
    retry: "Retry",
    filterModalTitle: "Choose what to show",
    filterModalDescription: "Pick content types, topics, and more. Your custom tab will always use these filters.",
    contentTypeLabel: "Content type",
    topicLabel: "Topic",
    courseTypeLabel: "Course type",
    courseAllLabel: "All courses",
    lengthLabel: "Length",
    durationShort: "Under 1.5 min",
    durationMedium: "1.5–5 min",
    durationLong: "Over 5 min",
    filterApplyButton: "Apply filters",
    filterCancelButton: "Cancel",
    filterClearButton: "Clear all",
    filtersSelectedLabel: "Selected",
    noFiltersSelected: "No filters yet",
    configurePrompt: "Set up your personalized feed with a name and filters.",
    configureButton: "Set up custom feed",
    backToGrid: "Back to list",
    backToGridAria: "Back to custom feed grid",
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
    customTabDefault: "ብጁ",
    customTabNavAria: "ብጁ የፊድ ትር",
  },
  customTab: {
    setupTitle: "ብጁ ፊድዎን ይፍጠሩ",
    setupDescription: "ይህን ትር ይሰዩት እና ቢያንስ አንድ ማጣሪያ ይምረጡ። ምርጫዎ በመለያዎ ይቀመጣል።",
    tabNameLabel: "የትር ስም",
    tabNamePlaceholder: "ብጁ",
    saveButton: "ብጁ ፊድ አስቀምጥ",
    savingButton: "በመቀመጥ ላይ…",
    filtersRequired: "ከመቀመጥዎ በፊት ቢያንስ አንድ ማጣሪያ ይምረጡ።",
    guestTitle: "ፊድዎን ለማበጃጠም ይግቡ",
    guestDescription: "ብጁ ትር ለሁሉም ይገኛል። ለማስቀመጥ እና ማጣሪያዎችን ለመምረጥ ይግቡ።",
    signInButton: "ግባ",
    editButton: "ማጣሪያዎችን አርትዕ",
    emptyTitle: "ለማጣሪያዎችዎ የሚዛመዱ ክሊፖች የሉም",
    emptyDescription: "ማጣሪያዎችን ያሰናብቱ ወይም የብጁ ትር ቅንብሮችን ያርትዑ።",
    loadError: "ብጁ ፊድዎን መጫን አልተሳካም።",
    retry: "እንደገና ይሞክሩ",
    filterModalTitle: "ምን እንደሚታይ ይምረጡ",
    filterModalDescription: "የይዘት አይነት፣ ርዕሶች እና ሌሎችን ይምረጡ። ብጁ ትርዎ ሁልጊዜ እነዚህን ማጣሪያዎች ይጠቀማል።",
    contentTypeLabel: "የይዘት አይነት",
    topicLabel: "ርዕስ",
    courseTypeLabel: "የኮርስ አይነት",
    courseAllLabel: "ሁሉም ኮርሶች",
    lengthLabel: "ርዝመት",
    durationShort: "ከ 1.5 ደቂቃ በታች",
    durationMedium: "1.5–5 ደቂቃ",
    durationLong: "ከ 5 ደቂቃ በላይ",
    filterApplyButton: "ማጣሪያዎችን ተግብር",
    filterCancelButton: "ተወው",
    filterClearButton: "ሁሉንም አጽዳ",
    filtersSelectedLabel: "ተመርጧል",
    noFiltersSelected: "ማጣሪያ የለም",
    configurePrompt: "በስም እና በማጣሪያዎች ብጁ ፊድዎን ያዘጅጁ።",
    configureButton: "ብጁ ፊድ ያዘጅጁ",
    backToGrid: "ወደ ዝርዝር ተመለስ",
    backToGridAria: "ወደ ብጁ ፊድ ግሪድ ተመለስ",
  },
};

export const FEED_MESSAGES: Record<AppLocale, FeedMessages> = {
  en,
  am,
};

export function feedMessagesFor(locale: AppLocale): FeedMessages {
  return FEED_MESSAGES[locale] ?? en;
}
