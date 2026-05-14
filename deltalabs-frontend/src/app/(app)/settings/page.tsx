/**
 * SettingsPage
 * Page wrapper for the Settings module.
 */

import React, { Suspense } from 'react';
import { SettingsView } from '@/modules/Settings';

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary">Loading settings...</div>}>
      <SettingsView />
    </Suspense>
  );
}
