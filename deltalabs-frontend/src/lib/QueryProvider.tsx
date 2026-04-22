"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { getBrowserQueryClient } from "@/lib/queryClient";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Client-only React Query boundary; wraps children with an isolated QueryClient. */
export function QueryProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [client] = useState(() => getBrowserQueryClient());
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
/** ################################ /COMPONENT ############################# */
