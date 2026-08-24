/**
 * SuperRoadmapSetupModal
 * Modal for setting up a super roadmap with title and visibility.
 *
 * @example
 * ```tsx
 * <SuperRoadmapSetupModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onDone={(title, visibility) => console.log(title, visibility)}
 * />
 * ```
 */

import React, { useState } from 'react';
import { Typography, Button, Input } from '@/components/theme';
import { Dialog } from '@/components/theme/Dialog';
import type { SuperRoadmapSetupModalProps } from './SuperRoadmapSetupModal.types';

// ============================================================================
// COMPONENT
// ============================================================================

export const SuperRoadmapSetupModal: React.FC<SuperRoadmapSetupModalProps> = ({
  isOpen,
  onClose,
  onDone,
  initialTitle = '',
  initialVisibility = 'private',
}) => {
  const [title, setTitle] = useState(initialTitle);
  const [visibility, setVisibility] = useState<'private' | 'public'>(initialVisibility);

  const handleDone = () => {
    if (title.trim()) {
      onDone?.(title, visibility);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Setup your super Roadmap"
    >
      <div className="space-y-6 py-2">
        {/* Title Input */}
        <div className="space-y-2">
          <Typography className="text-sm font-medium text-text-primary">
            Super roadmap Title
          </Typography>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter roadmap title"
          />
        </div>

        {/* Visibility Select */}
        <div className="space-y-2">
          <Typography className="text-sm font-medium text-text-primary">
            Visibility
          </Typography>
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as 'private' | 'public')}
            className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition-colors duration-150 cursor-pointer placeholder:text-text-secondary focus:border-primary-400 focus:ring-2 focus:ring-primary-200"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            className="px-12"
          >
            Back
          </Button>
          <Button
            onClick={handleDone}
            disabled={!title.trim()}
            className="px-12"
          >
            Done
          </Button>
        </div>
      </div>
    </Dialog>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SuperRoadmapSetupModal;
