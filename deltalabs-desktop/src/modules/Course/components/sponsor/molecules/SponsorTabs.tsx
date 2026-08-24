/**
 * SponsorTabs
 * Atomic Level: Molecule
 *
 * A toggle to switch between the 'Sponsors' and 'Applied' views.
 */

import React from 'react';

export type SponsorTabType = 'sponsors' | 'applied';

export interface SponsorTabsProps {
  activeTab: SponsorTabType;
  onChange: (tab: SponsorTabType) => void;
}

export const SponsorTabs: React.FC<SponsorTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex items-center justify-center w-full mt-4">
      <div className="flex bg-transparent rounded-lg p-1 gap-2">
        <button
          onClick={() => onChange('sponsors')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'sponsors'
              ? 'bg-surface-secondary text-primary-900'
              : 'text-primary-600 hover:bg-surface-secondary/50'
          }`}
        >
          Sponsors
        </button>
        <button
          onClick={() => onChange('applied')}
          className={`px-6 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'applied'
              ? 'bg-surface-secondary text-primary-900'
              : 'text-primary-600 hover:bg-surface-secondary/50'
          }`}
        >
          Applied
        </button>
      </div>
    </div>
  );
};

export default SponsorTabs;
