"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { createQueryClient } from "@/lib/queryClient";

/** Client-only React Query boundary; wraps children with an isolated QueryClient. */
export function QueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [client] = useState(() => createQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
