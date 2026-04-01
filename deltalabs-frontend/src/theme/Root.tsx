"use client";

import { GlobalAuthPendingBar } from "@/components/system/GlobalAuthPendingBar";
import { AuthSessionProvider } from "@/contexts/AuthSession_Context";
import { ThemeProvider } from "@/contexts/Theme_Context";
import { QueryProvider } from "@/lib/QueryProvider";

export function Root({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <AuthSessionProvider>
        <GlobalAuthPendingBar />
        <ThemeProvider>{children}</ThemeProvider>
      </AuthSessionProvider>
    </QueryProvider>
  );
}
