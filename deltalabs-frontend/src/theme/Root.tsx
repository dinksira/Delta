"use client";

import { Provider } from "react-redux";

import { GlobalAuthPendingBar } from "@/components/system/GlobalAuthPendingBar";
import { AuthSessionProvider } from "@/contexts/AuthSession_Context";
import { ThemeProvider } from "@/contexts/Theme_Context";
import { QueryProvider } from "@/lib/QueryProvider";
import { store } from "@/store";

export function Root({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <AuthSessionProvider>
        <GlobalAuthPendingBar />
        <ThemeProvider>
          <Provider store={store}>{children}</Provider>
        </ThemeProvider>
      </AuthSessionProvider>
    </QueryProvider>
  );
}
