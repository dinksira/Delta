/**
 * DesktopSplashGate
 * Renders the cinematic SplashScreen on app launch when running inside the
 * Electron desktop shell. On web browsers this component is transparent and
 * renders children immediately.
 *
 * @example
 * ```tsx
 * <DesktopSplashGate>
 *   <App />
 * </DesktopSplashGate>
 * ```
 */

"use client";

import React, { useEffect, useState } from "react";

import { SplashScreen } from "@/components/organisms/SplashScreen";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface DesktopSplashGateProps {
  /** Application content rendered after splash completes (or immediately on web). */
  children: React.ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DesktopSplashGate: React.FC<DesktopSplashGateProps> = ({
  children,
}) => {
  const [showSplash, setShowSplash] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    /** Only activate in Electron — detected via the preload bridge. */
    const isElectron =
      typeof window !== "undefined" &&
      (window as Record<string, unknown>).electron !== undefined;

    const hasPlayed =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem("dl.splash_played") === "true";

    if (isElectron && !hasPlayed) {
      setShowSplash(true);
    } else {
      setReady(true);
    }
  }, []);

  const handleComplete = (): void => {
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("dl.splash_played", "true");
    }
    setShowSplash(false);
    setReady(true);
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleComplete} />}
      {ready && children}
    </>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default DesktopSplashGate;
