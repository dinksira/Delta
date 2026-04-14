/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export type DesignTokenScale = Readonly<Record<string, string>>;

export interface DesignTokens {
  colors: {
    primary: DesignTokenScale;
    secondary: {
      500: string;
    };
    success: {
      500: string;
    };
    warning: {
      500: string;
    };
    error: {
      500: string;
    };
    surface: {
      canvas: string;
      default: string;
      elevated: string;
      muted: string;
    };
    border: {
      default: string;
      subtle: string;
    };
    authModal: {
      surface: string;
      border: string;
      headerBorder: string;
      shadow: string;
    };
    authBanner: {
      successBg: string;
      successText: string;
      errorBg: string;
      errorText: string;
      infoBg: string;
      infoText: string;
    };
    authInput: {
      bg: string;
      border: string;
      borderFocus: string;
      borderError: string;
      placeholder: string;
    };
    authLink: {
      secondary: string;
    };
    switchMode: {
      trackBg: string;
      trackBorder: string;
      pillActiveBg: string;
      pillActiveText: string;
      pillInactiveText: string;
    };
    featuresCard: {
      surface: string;
      border: string;
      hoverBorder: string;
      iconBg: string;
    };
    feedAction: {
      railBg: string;
      iconDefault: string;
      iconActive: string;
    };
    text: {
      primary: string;
      secondary: string;
      inverse: string;
    };
  };
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      "2xl": string;
      "3xl": string;
    };
    fontWeight: {
      regular: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
  };
  radii: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
  };
  zIndex: {
    base: number;
    dropdown: number;
    sticky: number;
    overlay: number;
    modal: number;
    toast: number;
  };
  /** CSS custom properties in `styles/design-tokens.css` — use for inline styles or docs; prefer tokens in CSS. */
  layout: {
    shellRailMin: string;
    shellRailMax: string;
    shellRailAsideCap: string;
    schoolIconRailWidth: string;
    schoolIconRailOverlap: string;
    featuresPageMax: string;
    feedCommentSheetMax: string;
    feedVideoWidthMin: string;
    feedVideoWidthMax: string;
    feedVideoVhTrim: string;
    feedVideoWidthPreferred: string;
    feedVideoVwInset: string;
  };
}

export const designTokens: Readonly<DesignTokens> = {
  colors: {
    primary: {
      50: "var(--dl-color-primary-50)",
      100: "var(--dl-color-primary-100)",
      200: "var(--dl-color-primary-200)",
      300: "var(--dl-color-primary-300)",
      400: "var(--dl-color-primary-400)",
      500: "var(--dl-color-primary-500)",
      600: "var(--dl-color-primary-600)",
      700: "var(--dl-color-primary-700)",
      800: "var(--dl-color-primary-800)",
      900: "var(--dl-color-primary-900)",
    },
    secondary: {
      500: "var(--dl-color-secondary-500)",
    },
    success: {
      500: "var(--dl-color-success-500)",
    },
    warning: {
      500: "var(--dl-color-warning-500)",
    },
    error: {
      500: "var(--dl-color-error-500)",
    },
    surface: {
      canvas: "var(--dl-color-surface-canvas)",
      default: "var(--dl-color-surface-default)",
      elevated: "var(--dl-color-surface-elevated)",
      muted: "var(--dl-color-surface-muted)",
    },
    border: {
      default: "var(--dl-color-border-default)",
      subtle: "var(--dl-color-border-subtle)",
    },
    authModal: {
      surface: "var(--dl-auth-modal-surface)",
      border: "var(--dl-auth-modal-border)",
      headerBorder: "var(--dl-auth-modal-header-border)",
      shadow: "var(--dl-auth-modal-shadow)",
    },
    authBanner: {
      successBg: "var(--dl-auth-banner-success-bg)",
      successText: "var(--dl-auth-banner-success-text)",
      errorBg: "var(--dl-auth-banner-error-bg)",
      errorText: "var(--dl-auth-banner-error-text)",
      infoBg: "var(--dl-auth-banner-info-bg)",
      infoText: "var(--dl-auth-banner-info-text)",
    },
    authInput: {
      bg: "var(--dl-auth-input-bg)",
      border: "var(--dl-auth-input-border)",
      borderFocus: "var(--dl-auth-input-border-focus)",
      borderError: "var(--dl-auth-input-border-error)",
      placeholder: "var(--dl-auth-input-placeholder)",
    },
    authLink: {
      secondary: "var(--dl-auth-link-secondary)",
    },
    switchMode: {
      trackBg: "var(--dl-switch-mode-track-bg)",
      trackBorder: "var(--dl-switch-mode-track-border)",
      pillActiveBg: "var(--dl-switch-mode-pill-active-bg)",
      pillActiveText: "var(--dl-switch-mode-pill-active-text)",
      pillInactiveText: "var(--dl-switch-mode-pill-inactive-text)",
    },
    featuresCard: {
      surface: "var(--dl-features-card-surface)",
      border: "var(--dl-features-card-border)",
      hoverBorder: "var(--dl-features-card-hover-border)",
      iconBg: "var(--dl-features-card-icon-bg)",
    },
    feedAction: {
      railBg: "var(--dl-feed-action-rail-bg)",
      iconDefault: "var(--dl-feed-action-icon-default)",
      iconActive: "var(--dl-feed-action-icon-active)",
    },
    text: {
      primary: "var(--dl-color-text-primary)",
      secondary: "var(--dl-color-text-secondary)",
      inverse: "var(--dl-color-text-inverse)",
    },
  },
  typography: {
    fontFamily: {
      sans: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
      mono: "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },
  spacing: {
    0: "0rem",
    1: "0.25rem",
    2: "0.5rem",
    3: "0.75rem",
    4: "1rem",
    5: "1.25rem",
    6: "1.5rem",
    8: "2rem",
    10: "2.5rem",
    12: "3rem",
    16: "4rem",
  },
  radii: {
    sm: "var(--dl-radius-sm)",
    md: "var(--dl-radius-md)",
    lg: "var(--dl-radius-lg)",
  },
  shadows: {
    sm: "var(--dl-shadow-sm)",
    md: "var(--dl-shadow-md)",
  },
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1100,
    overlay: 1200,
    modal: 1300,
    toast: 1400,
  },
  layout: {
    shellRailMin: "var(--dl-layout-shell-rail-min)",
    shellRailMax: "var(--dl-layout-shell-rail-max)",
    shellRailAsideCap: "var(--dl-layout-shell-rail-aside-cap)",
    schoolIconRailWidth: "var(--dl-layout-school-icon-rail-width)",
    schoolIconRailOverlap: "var(--dl-layout-school-icon-rail-overlap)",
    featuresPageMax: "var(--dl-layout-features-page-max)",
    feedCommentSheetMax: "var(--dl-layout-feed-comment-sheet-max)",
    feedVideoWidthMin: "var(--dl-layout-feed-video-width-min)",
    feedVideoWidthMax: "var(--dl-layout-feed-video-width-max)",
    feedVideoVhTrim: "var(--dl-layout-feed-video-vh-trim)",
    feedVideoWidthPreferred: "var(--dl-layout-feed-video-width-preferred)",
    feedVideoVwInset: "var(--dl-layout-feed-video-vw-inset)",
  },
} as const;
/** ################################ /COMPONENT ############################# */
