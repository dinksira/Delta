import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { Provider } from "react-redux";

import { AuthSessionProvider } from "@/contexts/AuthSession_Context";
import { store } from "@/store";

type Options = Omit<RenderOptions, "wrapper"> & Readonly<{ queryClient?: QueryClient }>;

export function renderWithAppProviders(ui: ReactElement, options?: Options) {
  const { queryClient, ...rest } = options ?? {};
  const client =
    queryClient ??
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

  function Wrapper({ children }: Readonly<{ children: ReactNode }>) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={client}>
          <AuthSessionProvider>{children}</AuthSessionProvider>
        </QueryClientProvider>
      </Provider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...rest }), queryClient: client };
}
