/**
 * Types for SuperRoadmapSetupModal
 */

export interface SuperRoadmapSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone?: (title: string, visibility: 'private' | 'public') => void;
  initialTitle?: string;
  initialVisibility?: 'private' | 'public';
}
