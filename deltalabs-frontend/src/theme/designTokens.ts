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
    };
    border: {
      default: string;
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
    },
    border: {
      default: "var(--dl-color-border-default)",
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
} as const;
