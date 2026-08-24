/**
 * CustomParameterModal
 * Modal for adding custom parameters in the hire tutor section.
 *
 * @example
 * ```tsx
 * <CustomParameterModal
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 * />
 * ```
 */

import React from "react";
import type { CustomParameterModalProps } from "./CustomParameterModal.types";
import { Dialog } from "@/components/theme/Dialog";

// ============================================================================
// COMPONENT
// ============================================================================

export const CustomParameterModal: React.FC<CustomParameterModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Custom Parameters" size="2xl">
      {/* Modal Header */}
      <div className="flex items-center gap-2 px-6 py-4 border-b border-border-default bg-surface-muted/60">
        <select className="text-xs bg-transparent border-none text-text-primary focus:outline-none">
          <option>Select</option>
        </select>
      </div>
      
      {/* Modal Body */}
      <div className="p-6 space-y-4">
        {/* First Parameter */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">
              Parameter Name
            </label>
            <input
              type="text"
              placeholder="Value"
              className="w-full px-3 py-2 bg-surface-default border border-border-default rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">
              Parameter Value
            </label>
            <textarea
              placeholder="Value"
              className="w-full px-3 py-2 bg-surface-default border border-border-default rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-vertical"
            />
          </div>
        </div>
        {/* Second Parameter */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">
              Parameter Name
            </label>
            <input
              type="text"
              placeholder="Value"
              className="w-full px-3 py-2 bg-surface-default border border-border-default rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-text-primary">
              Parameter Value
            </label>
            <textarea
              placeholder="Value"
              className="w-full px-3 py-2 bg-surface-default border border-border-default rounded-md text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500 resize-vertical"
            />
          </div>
        </div>
      </div>
      
      {/* Modal Footer */}
      <div className="flex items-center justify-center py-4 px-6 bg-surface-default border-t border-border-default">
        <button
          type="button"
          className="px-12 py-2 bg-primary-900 text-white rounded-md text-sm font-medium hover:bg-primary-800 transition-colors cursor-pointer"
        >
          Add
        </button>
      </div>
    </Dialog>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CustomParameterModal;
