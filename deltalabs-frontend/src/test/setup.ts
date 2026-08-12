/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
/** ################################ /IMPORT ############################# */

/** Unmount rendered trees after each test (vitest globals are off). */
afterEach(() => {
  cleanup();
});

