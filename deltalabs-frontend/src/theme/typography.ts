/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { designTokens } from "@/theme/designTokens";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export const typography = {
  heading: {
    h1: {
      fontFamily: designTokens.typography.fontFamily.sans,
      fontSize: designTokens.typography.fontSize["3xl"],
      fontWeight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
    h2: {
      fontFamily: designTokens.typography.fontFamily.sans,
      fontSize: designTokens.typography.fontSize["2xl"],
      fontWeight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.tight,
    },
  },
  body: {
    default: {
      fontFamily: designTokens.typography.fontFamily.sans,
      fontSize: designTokens.typography.fontSize.base,
      fontWeight: designTokens.typography.fontWeight.regular,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
    small: {
      fontFamily: designTokens.typography.fontFamily.sans,
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.regular,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  },
  label: {
    default: {
      fontFamily: designTokens.typography.fontFamily.sans,
      fontSize: designTokens.typography.fontSize.sm,
      fontWeight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.normal,
    },
  },
} as const;
/** ################################ /COMPONENT ############################# */
