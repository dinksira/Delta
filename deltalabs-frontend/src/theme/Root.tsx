"use client";

import { ThemeProvider } from "@/contexts/Theme_Context";

export function Root({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
