import type { AppLocale } from "@/i18n/constants";

export type AuthMessages = {
  nav: {
    login: string;
    signup: string;
    dashboard: string;
    chooseLanguage: string;
  };
  common: {
    required: string;
    next: string;
    continue: string;
    loggingIn: string;
    sending: string;
    updating: string;
    orSignInWith: string;
    orSignUpWith: string;
  };
  login: {
    title: string;
    subtitle: string;
    emailOrPhone: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    rememberMe: string;
    forgotPassword: string;
    submit: string;
    signInFailed: string;
  };
  signup: {
    createAccount: string;
    steps: readonly { title: string; subtitle: string }[];
    nextLabelCreate: string;
    nextLabelContinue: string;
    nextLabelNext: string;
    firstName: string;
    lastName: string;
    userName: string;
    placeholderFirst: string;
    placeholderLast: string;
    placeholderUserName: string;
    day: string;
    month: string;
    year: string;
    placeholderDay: string;
    placeholderMonth: string;
    placeholderYear: string;
    phone: string;
    phonePlaceholder: string;
    email: string;
    otp: string;
    otpPlaceholder: string;
    passwordCreate: string;
    passwordConfirm: string;
    placeholderCreatePassword: string;
    placeholderConfirmPassword: string;
    invalidPhone: string;
    invalidEmail: string;
    invalidOtp: string;
    passwordMin10: string;
    passwordLower: string;
    passwordUpper: string;
    passwordNumber: string;
    passwordMismatch: string;
    verificationSent: string;
    verificationSentDev: string;
    verificationSendFailed: string;
    contactVerified: string;
    signupFailed: string;
    months: readonly string[];
  };
  recover: {
    titleRequest: string;
    titleVerify: string;
    titleReset: string;
    titleDone: string;
    subtitleRequest: string;
    subtitleVerify: string;
    subtitleReset: string;
    subtitleDone: string;
    recover: string;
    verifyCode: string;
    resetPassword: string;
    goToLogin: string;
    doneBody: string;
    recoverFailed: string;
    emailDeliveryFailed: string;
    emailNotConfigured: string;
    noEmailOnFile: string;
    verifyFailed: string;
    resetFailed: string;
    newPassword: string;
    newPasswordPlaceholder: string;
    confirmPassword: string;
    confirmPasswordPlaceholder: string;
    otpLabel: string;
  };
  bottomLink: {
    notRegistered: string;
    createAccount: string;
    alreadyRegistered: string;
    signIn: string;
  };
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

const en: AuthMessages = {
  nav: {
    login: "Login",
    signup: "Sign up",
    dashboard: "Dashboard",
    chooseLanguage: "Choose language",
  },
  common: {
    required: "Required",
    next: "Next",
    continue: "Continue",
    loggingIn: "Logging in...",
    sending: "Sending…",
    updating: "Updating…",
    orSignInWith: "Or Sign in with",
    orSignUpWith: "Or Sign up with",
  },
  login: {
    title: "Login to Your Account",
    subtitle: "Learn more and do more",
    emailOrPhone: "Email or phone number",
    emailPlaceholder: "mail@abc.com",
    password: "Password",
    passwordPlaceholder: "********",
    rememberMe: "Remember Me",
    forgotPassword: "Forgot Password?",
    submit: "Login",
    signInFailed: "Sign-in failed. Please try again.",
  },
  signup: {
    createAccount: "Create account",
    steps: [
      { title: "Create Your Account", subtitle: "Learn More, Do More" },
      { title: "Enter your Date of birth", subtitle: "Your age information helps personalize your experience" },
      { title: "Phone and email", subtitle: "We'll use these to send your verification code" },
      { title: "Verification code", subtitle: "Enter the code we sent to your phone and email" },
      { title: "Set your password", subtitle: "Secure your account" },
    ],
    nextLabelCreate: "Create account",
    nextLabelContinue: "Continue",
    nextLabelNext: "Next",
    firstName: "First Name",
    lastName: "Last Name",
    userName: "User Name",
    placeholderFirst: "Abel",
    placeholderLast: "Bekele",
    placeholderUserName: "Enter User Name",
    day: "Day",
    month: "Month",
    year: "Year",
    placeholderDay: "Day",
    placeholderMonth: "Month",
    placeholderYear: "Year",
    phone: "Phone number",
    phonePlaceholder: "+251 9xx xxx xxx",
    email: "Email",
    otp: "Verification code",
    otpPlaceholder: "Enter 4-6 digit code",
    passwordCreate: "Password",
    passwordConfirm: "Confirm Password",
    placeholderCreatePassword: "Create password",
    placeholderConfirmPassword: "Confirm password",
    invalidPhone: "Invalid phone number",
    invalidEmail: "Invalid email address",
    invalidOtp: "Invalid verification code",
    passwordMin10: "At least 10 characters",
    passwordLower: "Include a lowercase letter",
    passwordUpper: "Include an uppercase letter",
    passwordNumber: "Include a number",
    passwordMismatch: "Passwords do not match",
    verificationSent: "Verification code sent. Check your inbox.",
    verificationSentDev: "Verification code sent. Dev OTP:",
    verificationSendFailed: "Could not send verification code. Please try again.",
    contactVerified: "Contact verified. Continue to the next step.",
    signupFailed: "Could not create your account. Please try again.",
    months: [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ],
  },
  recover: {
    titleRequest: "Recover your account",
    titleVerify: "Enter verification code",
    titleReset: "Reset your password",
    titleDone: "Password reset complete",
    subtitleRequest: "Learn more and do more",
    subtitleVerify: "Enter the code we sent to your email or phone",
    subtitleReset: "Create a new secure password",
    subtitleDone: "You can now login with your new password",
    recover: "Recover",
    verifyCode: "Verify code",
    resetPassword: "Reset password",
    goToLogin: "Go to login",
    doneBody:
      "Your password has been updated. Continue to sign in and access your account.",
    recoverFailed: "Could not send a recovery code. Please try again.",
    emailDeliveryFailed: "Could not send the recovery email. Please try again in a few minutes.",
    emailNotConfigured:
      "Recovery email could not be sent because email is not configured on the server. Please contact support.",
    noEmailOnFile: "This account has no email address on file. Contact support for help.",
    verifyFailed: "Invalid or expired verification code.",
    resetFailed: "Could not reset your password. Please try again.",
    newPassword: "New password",
    newPasswordPlaceholder: "Create new password",
    confirmPassword: "Confirm password",
    confirmPasswordPlaceholder: "Confirm your password",
    otpLabel: "Verification code",
  },
  bottomLink: {
    notRegistered: "Not Registered Yet?",
    createAccount: "Create an account",
    alreadyRegistered: "Already Registered ?",
    signIn: "Sign in",
  },
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

const am: AuthMessages = {
  nav: {
    login: "መግቢያ",
    signup: "መዝገብ",
    dashboard: "ዳሽቦርድ",
    chooseLanguage: "ቋንቋ ይምረጡ",
  },
  common: {
    required: "ያስፈልጋል",
    next: "ቀጣይ",
    continue: "ቀጥል",
    loggingIn: "በመግባት ላይ...",
    sending: "በመላክ ላይ...",
    updating: "በመዘመን ላይ...",
    orSignInWith: "ወይም በዚህ ይግቡ",
    orSignUpWith: "ወይም በዚህ ይመዝገቡ",
  },
  login: {
    title: "ወደ መለያዎ ይግቡ",
    subtitle: "ተጨማሪ ይወቁ፣ ተጨማሪ ያድርጉ",
    emailOrPhone: "ኢሜይል ወይም ስልክ ቁጥር",
    emailPlaceholder: "mail@abc.com",
    password: "የይለፍ ቃል",
    passwordPlaceholder: "********",
    rememberMe: "አስታውሰኝ",
    forgotPassword: "የይለፍ ቃል ረሳሁ?",
    submit: "ግባ",
    signInFailed: "መግባት አልተሳካም። እባክዎ እንደገና ይሞክሩ።",
  },
  signup: {
    createAccount: "መለያ ፍጠር",
    steps: [
      { title: "መለያዎን ይፍጠሩ", subtitle: "ተጨማሪ ይወቁ፣ ተጨማሪ ያድርጉ" },
      {
        title: "የልደት ቀንዎን ያስገቡ",
        subtitle: "ዕድሜዎ ተሞክሮዎን ለማበጀት ይረዳል",
      },
      { title: "ስልክ እና ኢሜይል", subtitle: "የማረጋገጫ ኮድ ለመላክ እንጠቀምበታለን" },
      {
        title: "የማረጋገጫ ኮድ",
        subtitle: "ወደ ስልክዎ እና ኢሜይልዎ የላክነውን ኮድ ያስገቡ",
      },
      { title: "የይለፍ ቃል ያዘጋጁ", subtitle: "መለያዎን ያስተማምኑ" },
    ],
    nextLabelCreate: "መለያ ፍጠር",
    nextLabelContinue: "ቀጥል",
    nextLabelNext: "ቀጣይ",
    firstName: "የመጀመሪያ ስም",
    lastName: "የአባት ስም",
    userName: "የተጠቃሚ ስም",
    placeholderFirst: "አበል",
    placeholderLast: "በቀለ",
    placeholderUserName: "የተጠቃሚ ስም ያስገቡ",
    day: "ቀን",
    month: "ወር",
    year: "ዓመት",
    placeholderDay: "ቀን",
    placeholderMonth: "ወር",
    placeholderYear: "ዓመት",
    phone: "ስልክ ቁጥር",
    phonePlaceholder: "+251 9xx xxx xxx",
    email: "ኢሜይል",
    otp: "የማረጋገጫ ኮድ",
    otpPlaceholder: "4–6 አሃዝ ኮድ",
    passwordCreate: "የይለፍ ቃል",
    passwordConfirm: "የይለፍ ቃል ያረጋግጡ",
    placeholderCreatePassword: "የይለፍ ቃል ይፍጠሩ",
    placeholderConfirmPassword: "የይለፍ ቃል ያረጋግጡ",
    invalidPhone: "ስልክ ቁጥሩ ትክክል አይደለም",
    invalidEmail: "ኢሜይሉ ትክክል አይደለም",
    invalidOtp: "የማረጋገጫ ኮዱ ትክክል አይደለም",
    passwordMin10: "ቢያንስ 10 ቁምፊዎች",
    passwordLower: "ትንሽ ፊደል ያካትቱ",
    passwordUpper: "ከባድ ፊደል ያካትቱ",
    passwordNumber: "ቁጥር ያካትቱ",
    passwordMismatch: "የይለፍ ቃሎች አይጣጣሙም",
    verificationSent: "ኮድ ተላከ። መልዕክትዎን ይመልከቱ።",
    verificationSentDev: "ኮድ ተላከ። የልማት OTP፦",
    verificationSendFailed: "ኮድ መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    contactVerified: "ግንኙነት ተረጋገጠ። ወደ ቀጣዩ ደረጃ ይቀጥሉ።",
    signupFailed: "መለያ መፍጠር አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    months: [
      "ጃንዩወሪ",
      "ፌብሩወሪ",
      "ማርች",
      "ኤፕሪል",
      "ሜይ",
      "ጁን",
      "ጁላይ",
      "ኦገስት",
      "ሴፕቴምበር",
      "ኦክቶበር",
      "ኖቬምበር",
      "ዲሴምበር",
    ],
  },
  recover: {
    titleRequest: "መለያዎን ይመልሱ",
    titleVerify: "የማረጋገጫ ኮድ ያስገቡ",
    titleReset: "የይለፍ ቃል ይቀይሩ",
    titleDone: "የይለፍ ቃል ተቀይሯል",
    subtitleRequest: "ተጨማሪ ይወቁ፣ ተጨማሪ ያድርጉ",
    subtitleVerify: "ወደ ኢሜይልዎ ወይም ስልክዎ የላክነውን ኮድ ያስገቡ",
    subtitleReset: "አዲስ ደህንነቱ የተጠበቀ የይለፍ ቃል ይፍጠሩ",
    subtitleDone: "አሁን በአዲሱ የይለፍ ቃልዎ መግባት ይችላሉ",
    recover: "ይላክ",
    verifyCode: "ኮድ አረጋግጥ",
    resetPassword: "የይለፍ ቃል ቀይር",
    goToLogin: "ወደ መግቢያ ሂድ",
    doneBody:
      "የይለፍ ቃልዎ ተዘምኗል። ለመግባት እና መለያዎን ለመጠቀም ይቀጥሉ።",
    recoverFailed: "የመልሻ ኮድ መላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    emailDeliveryFailed: "የመልሻ ኢሜይል መላክ አልተቻለም። እባክዎ ቆይተው እንደገና ይሞክሩ።",
    emailNotConfigured: "የመልሻ ኢሜይል አልተላከም — በሰርቨር ላይ ኢሜይል አልተዋቀረም። እባክዎ ድጋፍ ያግኙ።",
    noEmailOnFile: "በዚህ መለያ ላይ ኢሜይል አልተመዘገበም። እባክዎ ድጋፍ ያግኙ።",
    verifyFailed: "ልክ ያልሆነ ወይም ጊዜው ያለፈ የማረጋገጫ ኮድ።",
    resetFailed: "የይለፍ ቃል መቀየር አልተቻለም። እባክዎ እንደገና ይሞክሩ።",
    newPassword: "አዲስ የይለፍ ቃል",
    newPasswordPlaceholder: "አዲስ የይለፍ ቃል ይፍጠሩ",
    confirmPassword: "የይለፍ ቃል ያረጋግጡ",
    confirmPasswordPlaceholder: "የይለፍ ቃልዎን ያረጋግጡ",
    otpLabel: "የማረጋገጫ ኮድ",
  },
  bottomLink: {
    notRegistered: "አልተመዘገቡም?",
    createAccount: "መለያ ይፍጠሩ",
    alreadyRegistered: "አስቀድመው ተመዝገበዋል?",
    signIn: "ግባ",
  },
  browseCategories: {
    navAria: "የፊድ ምድቦች",
    video: "ቪዲዮ",
    audio: "ኦድዮ",
    ai: "AI",
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

export const AUTH_MESSAGES: Record<AppLocale, AuthMessages> = {
  en,
  am,
};

export function authMessagesFor(locale: AppLocale): AuthMessages {
  return AUTH_MESSAGES[locale] ?? en;
}
