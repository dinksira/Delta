/**
 * HireTutorSection
 * Section for hiring tutors for the course.
 *
 * @example
 * ```tsx
 * <HireTutorSection course={course} />
 * ```
 */

import React, { useState } from 'react';
import type { Course } from '../../../../types/courseTypes';
import { CustomParameterModal } from '../../molecules/CustomParameterModal';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface HireTutorSectionProps {
  course: Course;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const HireTutorSection: React.FC<HireTutorSectionProps> = ({ course: _course }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-surface-canvas text-text-primary px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-semibold text-primary-900 mb-8">
          Hire a tutor
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Description */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">
                Description
              </label>
              <textarea
                className="w-full min-h-[100px] px-3 py-2 bg-surface-canvas border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder=""
              />
            </div>

            {/* Add Custom Parameter */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 text-sm text-text-primary hover:text-primary-700 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              Add custom parameter
            </button>

            {/* Select Roadmap */}
            <button
              type="button"
              className="flex items-center gap-2 text-sm text-text-primary hover:text-primary-700 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
                <svg className="w-4 h-4 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Select roadmap
            </button>

            {/* Invite Tutor */}
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs font-semibold text-text-primary">
                Invite tutor
              </span>
              <button
                type="button"
                className="w-10 h-10 rounded-full border-2 border-primary-900 flex items-center justify-center text-primary-900 hover:bg-primary-50 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Estimate Tutor Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">
                Estimate tutor time
              </label>
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-canvas border border-border-subtle rounded-lg">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <input
                  type="text"
                  className="flex-1 bg-transparent border-none outline-none text-text-primary placeholder:text-text-secondary"
                  placeholder=""
                />
              </div>
            </div>

            {/* Payment Option */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-primary">
                Payment Option
              </label>
              <select className="w-full px-3 py-2 bg-surface-canvas border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500">
                <option>Selected Option</option>
              </select>
            </div>

            {/* Payment Amount */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-text-primary">
                Payment amount
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-surface-canvas border border-border-subtle rounded-lg text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Enter amount"
              />
            </div>
          </div>
        </div>
      </div>
      {/* Custom Parameter Modal */}
      <CustomParameterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default HireTutorSection;
