/**
 * Entry Point
 * Bootstraps the React application, loading global styling
 * and injecting the splash screen launch gate for desktop clients.
 *
 * @example
 * ```tsx
 * // Automatically loaded as Vite entry module in index.html
 * ```
 */

import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import { DesktopSplashGate } from '@/components/system/DesktopSplashGate';

import './index.css';

// ============================================================================
// BOOTSTRAP
// ============================================================================

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DesktopSplashGate>
      <App />
    </DesktopSplashGate>
  </React.StrictMode>
);
