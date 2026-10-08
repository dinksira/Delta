/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
/** ################################ /IMPORT ############################# */

/**
 * jsdom does not implement the legacy `document.queryCommand*` APIs that
 * RichTextEditor reads to refresh toolbar state on selection changes; stub
 * them so tests mounting the editor don't throw inside document listeners.
 */
if (typeof document !== "undefined" && typeof document.queryCommandState !== "function") {
  document.queryCommandState = () => false;
}

/** Unmount rendered trees after each test (vitest globals are off). */
afterEach(() => {
  cleanup();
});
