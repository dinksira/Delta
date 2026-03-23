"use client";

import { ThemeProvider } from "@/contexts/Theme_Context";
import { QueryProvider } from "@/lib/QueryProvider";

export function Root({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <QueryProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryProvider>
  );
}
