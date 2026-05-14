"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Provider } from "react-redux";

import { GlobalAuthPendingBar } from "@/components/system/GlobalAuthPendingBar";
import { AuthSessionProvider } from "@/contexts/AuthSession_Context";
import { ThemeProvider } from "@/contexts/Theme_Context";
import { LocaleProvider } from "@/i18n/LocaleContext";
import { QueryProvider } from "@/lib/QueryProvider";
import { store } from "@/store";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function Root({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthSessionProvider>
          <GlobalAuthPendingBar />
          <ThemeProvider>
            <Provider store={store}>{children}</Provider>
          </ThemeProvider>
        </AuthSessionProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
/** ################################ /COMPONENT ############################# */
