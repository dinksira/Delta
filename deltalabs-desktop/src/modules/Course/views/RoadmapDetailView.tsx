"use client";

/**
 * RoadmapDetailView
 * Detailed view of a specific roadmap with timeline, actions, and sidebar.
 *
 * @example
 * ```tsx
 * <RoadmapDetailView onBack={() => console.log('Back')} />
 * ```
 */

import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, Lightbulb, Share2 } from 'lucide-react';
import { Typography, Button } from '@/components/theme';
import { RoadmapTimeline, RoadmapStep } from '@/components/organisms/RoadmapTimeline';
import ProgressBar from '@/components/atoms/ProgressBar';
import { SuperRoadmapSetupModal } from '../components/roadmap/molecules/SuperRoadmapSetupModal';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RoadmapDetailViewProps {
  onBack?: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOCK_STEPS: RoadmapStep[] = [
  {
    id: '1',
    title: 'Section 1',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Strategy', '#Strategy'],
    isCompleted: true,
  },
  {
    id: '2',
    title: 'Motion',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Physics', '#Chapter1'],
    isCompleted: true,
  },
  {
    id: '3',
    title: '2D Motion',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Physics', '#Chapter1'],
    isCompleted: true,
  },
  {
    id: '4',
    title: 'Physics exam',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Physics', '#Chapter1'],
    isCompleted: false,
  },
  {
    id: '5',
    title: 'Section 2',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Strategy', '#Strategy'],
    isCompleted: false,
  },
  {
    id: '6',
    title: 'Linear Motion',
    description: 'The technical task is attached as a file.doc. Please read it carefully and follow the instru...',
    tags: ['#Physics', '#Chapter1'],
    isCompleted: false,
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const RoadmapDetailView: React.FC<RoadmapDetailViewProps> = ({
  onBack,
}) => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'resources' | 'pushed'>('pushed');
  const [isSuperModalOpen, setIsSuperModalOpen] = useState(false);

  const handleSuperRoadmapDone = (title: string, visibility: 'private' | 'public') => {
    console.log('Created super roadmap:', { title, visibility });
    setIsSuperModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-surface-canvas">
      <SuperRoadmapSetupModal
        isOpen={isSuperModalOpen}
        onClose={() => setIsSuperModalOpen(false)}
        onDone={handleSuperRoadmapDone}
        initialTitle="Physics Super Roadmap"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-12 py-8">
          {/* Left Header: Back + Title */}
          <div className="flex items-center gap-6">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-surface-secondary transition-colors"
            >
              <ChevronLeft className="h-6 w-6 text-text-primary" />
            </button>
            <Typography variant="h1" className="text-[32px] font-bold text-text-primary">
              Physics Roadmap
            </Typography>
          </div>

          {/* Right Header: Actions */}
          <div className="flex items-center gap-8">
            <button className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center bg-surface-primary group-hover:bg-surface-secondary transition-colors">
                <Lightbulb className="h-5 w-5 text-primary-900" />
              </div>
              <Typography className="text-sm font-bold text-text-primary">
                Master
              </Typography>
            </button>

            <button 
              onClick={() => setIsSuperModalOpen(true)} 
              className="flex items-center gap-3 group"
            >
              <div className="w-10 h-10 rounded-full border border-border-subtle flex items-center justify-center bg-surface-primary group-hover:bg-surface-secondary transition-colors">
                <Share2 className="h-5 w-5 text-primary-900" />
              </div>
              <Typography className="text-sm font-bold text-text-primary">
                Convert to Super
              </Typography>
            </button>

            <Button className="px-8">Save</Button>
          </div>
        </div>

        {/* Progress Section */}
        <div className="px-12 pb-8">
          <div className="max-w-[440px] space-y-4">
            <Typography className="text-[15px] font-bold text-text-primary">
              Plan to learn All courses
            </Typography>
            <ProgressBar progress={5} label="Progress According to physics roadmap" />
          </div>
        </div>

        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto px-12 pb-12">
          <RoadmapTimeline steps={MOCK_STEPS} />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 bg-surface-primary border-l border-border-subtle flex flex-col">
        {/* Sidebar Tabs */}
        <div className="flex border-b border-border-subtle">
          <button
            onClick={() => setActiveSidebarTab('resources')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeSidebarTab === 'resources'
                ? 'text-primary-900 border-b-2 border-primary-900'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveSidebarTab('pushed')}
            className={`flex-1 py-4 text-sm font-medium transition-colors ${
              activeSidebarTab === 'pushed'
                ? 'text-primary-900 border-b-2 border-primary-900'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            Pushed
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeSidebarTab === 'pushed' && (
            <div className="space-y-6">
              {/* Test & Exercise */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Typography className="text-sm font-bold text-text-primary">
                    Test & Exercise
                  </Typography>
                  <button className="text-sm text-primary-900 hover:underline">
                    View more
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="p-4 border-2 border-green-500 rounded-lg bg-white">
                    <Typography className="text-sm font-medium text-text-primary">
                      Physics Question
                    </Typography>
                  </div>
                  <div className="p-4 border-2 border-green-500 rounded-lg bg-white">
                    <Typography className="text-sm font-medium text-text-primary">
                      Exercise 1
                    </Typography>
                  </div>
                </div>
              </div>

              {/* Collapsible Sections */}
              {[
                { title: 'Question & Answer' },
                { title: 'Resource Required' },
                { title: 'Supplement' },
                { title: 'Post summary' },
              ].map((section, i) => (
                <div key={i} className="border-b border-border-subtle pb-4">
                  <button className="w-full flex items-center justify-between py-2 text-left">
                    <Typography className="text-sm font-medium text-text-primary">
                      {section.title}
                    </Typography>
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeSidebarTab === 'resources' && (
            <div className="text-sm text-text-secondary">
              Resources content here...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default RoadmapDetailView;
