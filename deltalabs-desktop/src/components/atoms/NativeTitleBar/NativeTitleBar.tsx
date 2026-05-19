/**
 * NativeTitleBar
 * Atomic Level: Atom
 * 
 * A custom title bar for the Electron desktop application. Provides window
 * controls and a draggable region while maintaining Delta Labs aesthetics.
 */

import React from "react";

import type { NativeTitleBarProps } from "./NativeTitleBar.types";
import { variantClasses } from "./variants";

// ============================================================================
// COMPONENT
// ============================================================================

export const NativeTitleBar: React.FC<NativeTitleBarProps> = ({
  variant = "default",
  title = "Delta Labs",
  showControls = true,
  className,
  ...props
}) => {
  // Only show controls if running in Electron
  const isElectron = typeof window !== "undefined" && window.electron?.isElectron;

  const handleMinimize = () => window.electron?.window.minimize();
  const handleMaximize = () => window.electron?.window.maximize();
  const handleClose = () => window.electron?.window.close();

  if (!isElectron) return null;

  return (
    <div
      className={`flex h-8 w-full select-none items-center justify-between px-4 ${variantClasses[variant]} ${className || ""}`}
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      {...props}
    >
      {/* Draggable Title Area */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-text-secondary">{title}</span>
      </div>

      {/* Window Controls (Non-draggable) */}
      {showControls && (
        <div 
          className="flex items-center no-drag" 
          style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
        >
          <button
            onClick={handleMinimize}
            className="flex h-8 w-11 items-center justify-center text-text-secondary hover:bg-surface-secondary transition-colors"
            title="Minimize"
          >
            <svg width="10" height="1" viewBox="0 0 10 1" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="10" height="1" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={handleMaximize}
            className="flex h-8 w-11 items-center justify-center text-text-secondary hover:bg-surface-secondary transition-colors"
            title="Maximize"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 1H9V7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="1" y="3" width="6" height="6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </button>
          <button
            onClick={handleClose}
            className="flex h-8 w-12 items-center justify-center text-text-secondary hover:bg-error-600 hover:text-white transition-colors"
            title="Close"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

NativeTitleBar.displayName = "NativeTitleBar";

// ============================================================================
// EXPORTS
// ============================================================================

export default NativeTitleBar;
