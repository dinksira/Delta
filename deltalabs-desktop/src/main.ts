/**
 * Delta Labs Desktop - Main Process
 * 
 * This is the entry point for the Electron application. It manages the lifecycle
 * of the application, creates the main window, and handles inter-process
 * communication (IPC).
 */

import { app, BrowserWindow, ipcMain, protocol, net } from "electron";
import * as path from "path";
import { pathToFileURL } from "url";
import * as fs from "fs";

const isDev = !app.isPackaged;

// Register custom protocol for local Next.js out files
protocol.registerSchemesAsPrivileged([
  { scheme: "app", privileges: { standard: true, secure: true, supportFetchAPI: true } }
]);

// ============================================================================
// CONSTANTS & HELPERS
// ============================================================================

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 768;
const DEFAULT_WIDTH = 1280;
const DEFAULT_HEIGHT = 800;

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// ============================================================================
// WINDOW MANAGEMENT
// ============================================================================

let mainWindow: BrowserWindow | null = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    frame: false, // Frameless for custom title bar
    titleBarStyle: "hidden", // Hide default title bar but keep traffic lights on macOS
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(app.getAppPath(), "dist", "preload.js"),
      sandbox: false, // Required for some remote URL bridge integrations
    },
    backgroundColor: "#FFFFFF",
    icon: path.join(app.getAppPath(), "..", "deltalabs-frontend", "public", "delta-logo.png"),
  });

  // Load the application
  if (isDev) {
    // In dev mode, check if dev server is running on port 4000
    mainWindow.loadURL("http://localhost:4000").catch(() => {
      mainWindow?.loadURL("app://./");
    });
  } else {
    mainWindow.loadURL("app://./");
  }

  // Open DevTools by default in dev to debug the Bridge
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

ipcMain.on("window-minimize", () => {
  mainWindow?.minimize();
});

ipcMain.on("window-maximize", () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on("window-close", () => {
  mainWindow?.close();
});

// ============================================================================
// APP LIFECYCLE
// ============================================================================

app.on("ready", () => {
  // Set up custom protocol handling for static out assets
  protocol.handle("app", async (request) => {
    const url = new URL(request.url);
    let relativePath = url.pathname;
    
    // Default to index.html if empty path
    if (relativePath === "" || relativePath === "/") {
      relativePath = "/index.html";
    }
    
    // Check if the path has no file extension
    const ext = path.extname(relativePath);
    if (!ext) {
      // SPA Fallback: check if static HTML file exists for this route, otherwise serve index.html
      const potentialHtmlPath = path.join(__dirname, "out", `${relativePath}.html`);
      if (fs.existsSync(potentialHtmlPath)) {
        relativePath = `${relativePath}.html`;
      } else {
        relativePath = "/index.html";
      }
    }
    
    const filePath = path.join(__dirname, "out", relativePath);
    
    try {
      const data = await fs.promises.readFile(filePath);
      return new Response(data, {
        headers: { 
          "Content-Type": getMimeType(filePath),
          "Content-Security-Policy": "default-src 'self' app: https://delta-labs.onrender.com https://delta-labs-pi.vercel.app; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https://delta-labs.onrender.com https://delta-labs-pi.vercel.app;"
        }
      });
    } catch (err) {
      console.error(`Failed to serve static file from: ${filePath}`, err);
      return new Response("Not Found", { status: 404 });
    }
  });

  // CORS bypass: the desktop app runs on app:// origin, which the backend
  // doesn't recognize. We modify outgoing Origin headers and inject CORS
  // headers on incoming responses so the renderer's fetch() succeeds.
  const { session } = require("electron");
  const apiOrigin = "https://delta-labs.onrender.com";

  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${apiOrigin}/*`] },
    (details: any, callback: any) => {
      details.requestHeaders["Origin"] = "https://delta-labs-pi.vercel.app";
      callback({ requestHeaders: details.requestHeaders });
    }
  );

  session.defaultSession.webRequest.onHeadersReceived(
    { urls: [`${apiOrigin}/*`] },
    (details: any, callback: any) => {
      const headers = details.responseHeaders || {};
      headers["access-control-allow-origin"] = ["*"];
      headers["access-control-allow-headers"] = ["*"];
      headers["access-control-allow-methods"] = ["GET, POST, PUT, PATCH, DELETE, OPTIONS"];
      callback({ responseHeaders: headers });
    }
  );

  createMainWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});

// ============================================================================
// EXPORTS
// ============================================================================

export { createMainWindow };
