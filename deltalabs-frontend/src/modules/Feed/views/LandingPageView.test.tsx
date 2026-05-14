/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

const testSession = {
  accessToken: "test-token",
  expiresAt: Date.now() + 3_600_000,
  user: {
    id: "test-user",
    email: "t@example.com",
    phone: "",
    userName: "tester",
    firstName: "T",
    lastName: "User",
  },
};

vi.mock("@/contexts/AuthSession_Context", () => ({
  AuthSessionProvider: ({ children }: Readonly<{ children: ReactNode }>) => children,
  useAuthSession: () => ({
    isAuthenticated: true,
    isReady: true,
    session: testSession,
    establishSession: vi.fn(),
    clearSession: vi.fn(),
  }),
}));

const likeServerActiveByClipId = new Map<string, boolean>();

vi.mock("@/modules/Feed/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/Feed/hooks")>();
  const { MOCK_VIDEO_FEED } = await import("@/modules/Feed/data/mockVideoFeed");
  return {
    ...actual,
    useFeedClips: () => ({
      data: MOCK_VIDEO_FEED,
      isPending: false,
      isError: false,
      isFetching: false,
      refetch: vi.fn(),
    }),
    useFeedLikeMutation: () => ({
      mutate: (
        clipId: string,
        opts?: {
          onSuccess?: (result: { ok: boolean; action: string; count: number; active: boolean }) => void;
          onSettled?: () => void;
        },
      ) => {
        const prev = likeServerActiveByClipId.get(clipId) ?? false;
        const next = !prev;
        likeServerActiveByClipId.set(clipId, next);
        opts?.onSuccess?.({ ok: true, action: "like", count: next ? 1 : 0, active: next });
        opts?.onSettled?.();
      },
    }),
  };
});

import { LandingPageView } from "@/modules/Feed/views/LandingPageView";
import { renderWithAppProviders } from "@/test/renderWithAppProviders";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
class StubIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin = "";
  readonly thresholds = [0.25, 0.5, 0.75, 0.9];

  private readonly targets = new Set<Element>();
  private flushScheduled = false;

  constructor(
    private readonly callback: IntersectionObserverCallback,
    _options?: IntersectionObserverInit,
  ) {}

  disconnect(): void {
    this.targets.clear();
    this.flushScheduled = false;
  }

  observe(target: Element): void {
    this.targets.add(target);
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      const list = Array.from(this.targets);
      const entries: IntersectionObserverEntry[] = list.map((t, index) => ({
        boundingClientRect: new DOMRect(),
        intersectionRatio: 1 / (index + 1),
        intersectionRect: new DOMRect(),
        isIntersecting: true,
        rootBounds: null,
        target: t,
        time: Date.now(),
      }));
      this.callback(entries, this);
    });
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  unobserve(target: Element): void {
    this.targets.delete(target);
  }
}

beforeEach(() => {
  likeServerActiveByClipId.clear();
  vi.stubGlobal("IntersectionObserver", StubIntersectionObserver);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
});

describe("LandingPageView", () => {
  it("toggles filter panel from trigger", () => {
    renderWithAppProviders(<LandingPageView />);

    expect(screen.queryByLabelText("Feed filters")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByLabelText("Feed filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.queryByLabelText("Feed filters")).not.toBeInTheDocument();
  });

  it("renders metadata and hashtags", () => {
    renderWithAppProviders(<LandingPageView />);

    expect(screen.getAllByText("Dr. Elena Vance").length).toBeGreaterThan(0);
    expect(screen.getByText("#NeuroTech")).toBeInTheDocument();
    expect(screen.getByText("Access Full Research Paper (PDF)")).toBeInTheDocument();
  });

  it("toggles action rail button pressed state", async () => {
    renderWithAppProviders(<LandingPageView />);

    const likeButton = screen.getAllByRole("button", { name: "Like" })[0];
    expect(likeButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(likeButton);
    await waitFor(() => expect(likeButton).toHaveAttribute("aria-pressed", "true"));
    fireEvent.click(likeButton);
    await waitFor(() => expect(likeButton).toHaveAttribute("aria-pressed", "false"));
  });

  it("uses tuned preload strategy around active clip", () => {
    const { container } = renderWithAppProviders(<LandingPageView />);
    const videos = Array.from(container.querySelectorAll("video"));
    expect(videos.length).toBeGreaterThan(6);
    expect(videos[0]).toHaveAttribute("preload", "auto");
    expect(videos[6]).toHaveAttribute("preload", "metadata");
  });
});
/** ################################ /COMPONENT ############################# */
