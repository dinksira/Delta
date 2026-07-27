/**
 * AnalysisSection
 * The course analysis section of the course detail page.
 *
 * @example
 * ```tsx
 * <AnalysisSection course={course} />
 * ```
 */

import React from 'react';
import type { Course } from '../../../../types/courseTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnalysisSectionProps {
  course: Course;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({ course: _course }) => {
  const analysisCards = [
    {
      title: 'Enrollment Stats',
      value: '1,234',
      description: 'Students enrolled',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Completion Rate',
      value: '87%',
      description: 'Students who finished',
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Average Rating',
      value: '4.8',
      description: 'From 1,531 reviews',
      color: 'bg-amber-100 text-amber-600',
    },
    {
      title: 'Hours of Content',
      value: '42',
      description: 'Video and materials',
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  return (
    <div className="bg-surface-canvas text-text-primary px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto w-full mb-8">
        <h2 className="text-xl font-semibold text-primary-800">
          Course Analysis
        </h2>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {analysisCards.map((card, index) => (
          <div key={index} className="bg-surface-secondary rounded-xl p-6 shadow-sm flex flex-col">
            <div className={`w-12 h-12 rounded-lg ${card.color} flex items-center justify-center mb-4`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {card.title}
            </h3>
            <p className="text-3xl font-bold text-primary-800 mb-2">
              {card.value}
            </p>
            <p className="text-sm text-text-secondary">
              {card.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AnalysisSection;
