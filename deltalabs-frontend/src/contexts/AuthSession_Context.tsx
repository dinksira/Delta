"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { setApiAccessTokenGetter } from "@/lib/apiClient";
import type { AuthSessionPayload } from "@/modules/Feed/types/auth";

const SESSION_KEY = "dl.auth.session.v1";

export type AuthSessionContextValue = Readonly<{
  session: AuthSessionPayload | null;
  isAuthenticated: boolean;
  /** Storage read finished (client only). */
  isReady: boolean;
  establishSession: (next: AuthSessionPayload) => void;
  clearSession: () => void;
}>;

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function readStoredSession(): AuthSessionPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSessionPayload;
    if (typeof parsed.expiresAt !== "number" || parsed.expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    if (!parsed.accessToken || !parsed.user?.id) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AuthSessionProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [session, setSession] = useState<AuthSessionPayload | null>(null);
  const [isReady, setIsReady] = useState(false);

  /**
   * Hydrate from localStorage before the browser paints so we do not flash logged-out chrome
   * (useEffect runs after paint; useLayoutEffect does not).
   */
  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync hydrate before paint; useEffect flashes logged-out UI
    setSession(readStoredSession());
    setIsReady(true);
  }, []);

  useEffect(() => {
    setApiAccessTokenGetter(session ? () => session.accessToken : undefined);
  }, [session]);

  const establishSession = useCallback((next: AuthSessionPayload) => {
    setSession(next);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* storage full / private mode */
    }
  }, []);

  const clearSession = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      session,
      /** True when a session object is present; expiry is enforced on hydrate and at API boundaries. */
      isAuthenticated: session != null,
      isReady,
      establishSession,
      clearSession,
    }),
    [session, isReady, establishSession, clearSession],
  );

  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

const fallbackValue: AuthSessionContextValue = {
  session: null,
  isAuthenticated: false,
  isReady: true,
  establishSession: () => {},
  clearSession: () => {},
};

export function useAuthSession(): AuthSessionContextValue {
  return useContext(AuthSessionContext) ?? fallbackValue;
}
