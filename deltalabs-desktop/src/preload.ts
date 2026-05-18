/**
 * Delta Labs Desktop - Preload Script
 * 
 * Securely exposes Electron APIs to the renderer process using Context Bridge.
 * Only allowed IPC events are exposed to prevent security risks.
 */

import { contextBridge, ipcRenderer } from "electron";

// ============================================================================
// BRIDGE EXPOSURE
// ============================================================================

contextBridge.exposeInMainWorld("electron", {
  /**
   * Window controls for the custom title bar.
   */
  window: {
    minimize: () => ipcRenderer.send("window-minimize"),
    maximize: () => ipcRenderer.send("window-maximize"),
    close: () => ipcRenderer.send("window-close"),
  },
  
  /**
   * Platform information.
   */
  platform: process.platform,
  isElectron: true,
});

// ============================================================================
// TYPES
// ============================================================================

export type ElectronAPI = {
  window: {
    minimize: () => void;
    maximize: () => void;
    close: () => void;
  };
  platform: string;
  isElectron: boolean;
};

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
