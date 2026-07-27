/**
 * PrerequisitesSection
 * The course prerequisites and requirements section of the course detail page.
 *
 * @example
 * ```tsx
 * <PrerequisitesSection course={course} />
 * ```
 */

import React from 'react';
import type { Course } from '../../../../types/courseTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PrerequisitesSectionProps {
  course: Course;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PrerequisitesSection: React.FC<PrerequisitesSectionProps> = ({ course: _course }) => {
  const requirements = [
    {
      title: 'Modern laptop or tablet',
      image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      features: ['4 GB RAM', '>25 GB Storage', 'core i5'],
    },
    {
      title: 'Safety goggles',
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      features: ['anti-fog coating', 'ANSI Z87.1', 'Polycarbonate'],
      purchased: true,
    },
    {
      title: 'Laboratory Glass',
      image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      features: ['Florence Flask', 'Borosilicate Glass', '500 ml'],
    },
    {
      title: "Newton's Cradle",
      image: 'https://images.unsplash.com/photo-1504051771394-dd2e66b25086?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      features: ['Suspension of 5', 'Stainless Steel Balls', '5 inches in height'],
    },
  ];

  return (
    <div className="bg-surface-canvas text-text-primary px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto w-full mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Prerequisites
        </h2>
        <div className="space-y-2">
          <p className="text-text-primary">Basics of Chemistry</p>
          <p className="text-text-primary">General knowledge of how the Nature works is recommended but not a must-have</p>
          <p className="text-text-primary">Absolutely no understanding of Advanced theories are required, I take you from beginner to intermediate.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-semibold text-text-primary mb-6">
          Requirements
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {requirements.map((req, index) => (
            <div key={index} className="bg-surface-secondary rounded-xl overflow-hidden shadow-sm flex flex-col relative">
              {req.purchased && (
                <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded text-xs font-semibold text-gray-700 border border-gray-200 z-10">
                  Purchased
                </div>
              )}
              <div className="w-full h-40 overflow-hidden">
                <img
                  src={req.image}
                  alt={req.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-lg font-semibold text-text-primary mb-3">
                  {req.title}
                </p>
                <ul className="text-sm text-text-secondary space-y-1 mb-4 flex-1">
                  {req.features.map((feature, i) => (
                    <li key={i}>• {feature}</li>
                  ))}
                </ul>
                <button className="w-full py-2.5 bg-primary-800 text-white rounded-lg text-sm font-medium hover:bg-primary-900 transition-colors">
                  Look for Resource
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default PrerequisitesSection;
