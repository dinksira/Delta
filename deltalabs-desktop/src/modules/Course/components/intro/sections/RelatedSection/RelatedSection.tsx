/**
 * RelatedSection
 * The related courses section of the course detail page.
 *
 * @example
 * ```tsx
 * <RelatedSection course={course} />
 * ```
 */

import React from 'react';
import type { Course } from '../../../../types/courseTypes';
import { CourseCard } from '../../molecules/CourseCard';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RelatedSectionProps {
  course: Course;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const RelatedSection: React.FC<RelatedSectionProps> = ({ course: _course }) => {
  const mockCourses = [
    { id: 1, title: 'Chemistry', institution: 'Haramaya University', status: 'Supplement', rating: 4 },
    { id: 2, title: 'Physics', institution: 'Addis Ababa University', status: 'Complement', rating: 5 },
    { id: 3, title: 'Biology', institution: 'Jimma University', status: 'Supplement', rating: 4 },
    { id: 4, title: 'Mathematics', institution: 'Haramaya University', status: 'Complement', rating: 3 },
    { id: 5, title: 'Computer Science', institution: 'Addis Ababa University', status: 'Supplement', rating: 5 },
    { id: 6, title: 'Ethics', institution: 'Jimma University', status: 'Supplement', rating: 4 },
  ];

  return (
    <div className="bg-surface-canvas text-text-primary px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-xl font-semibold text-text-primary mb-8">
          Related Courses
        </h2>
      </div>

      <div className="max-w-md mx-auto flex items-center gap-2 mb-8">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full h-10 pl-10 pr-4 rounded-full border border-border-subtle bg-surface-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <button className="w-10 h-10 rounded-full border border-border-subtle bg-surface-primary flex items-center justify-center hover:bg-surface-secondary transition-colors">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h12M3 16h6" />
          </svg>
        </button>
        <button className="w-10 h-10 rounded-full border border-border-subtle bg-surface-primary flex items-center justify-center hover:bg-surface-secondary transition-colors">
          <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCourses.map((courseItem) => (
          <CourseCard
            key={courseItem.id}
            title={courseItem.title}
            institution={courseItem.institution}
            status={courseItem.status}
            rating={courseItem.rating}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default RelatedSection;
