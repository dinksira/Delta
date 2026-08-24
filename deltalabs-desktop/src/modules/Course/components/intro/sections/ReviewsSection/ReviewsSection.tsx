/**
 * ReviewsSection
 * The course reviews section of the course detail page.
 *
 * @example
 * ```tsx
 * <ReviewsSection course={course} />
 * ```
 */

import React from 'react';
import type { Course } from '../../../../types/courseTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ReviewsSectionProps {
  course: Course;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ course: _course }) => {
  return (
    <div className="bg-surface-canvas text-text-primary px-4 py-4 md:px-8 md:py-6">
      <div className="max-w-7xl mx-auto w-full mb-12">
        <h2 className="text-2xl font-semibold text-text-primary mb-1">
          Reviews
        </h2>
        <div className="border-b border-border-subtle w-full" />
      </div>

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 mb-12">
        <div className="flex flex-col items-start md:items-center md:flex-shrink-0">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-bold text-text-primary">4.8</span>
            <div className="flex gap-0.5">
              {[1,2,3,4].map(i => (
                <span key={i} className="text-yellow-400 text-lg">★</span>
              ))}
              <span className="text-gray-300 text-lg">★</span>
            </div>
            <span className="text-text-secondary font-medium">Rate</span>
          </div>
          <p className="text-text-secondary text-sm">
            (1,531 ratings)
          </p>
        </div>

        <div className="flex-1 space-y-2">
          {[
            { stars: 5, percentage: 60 },
            { stars: 4, percentage: 30 },
            { stars: 3, percentage: 5 },
            { stars: 2, percentage: 3 },
            { stars: 1, percentage: 2 },
          ].map(({ stars, percentage }) => (
            <div key={stars} className="flex items-center gap-3">
              <span className="text-sm text-text-primary w-12">{stars} stars</span>
              <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary-800 rounded-full" style={{ width: `${percentage}%` }} />
              </div>
              <span className="text-sm text-text-secondary w-8 text-right">{percentage}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full">
        <h3 className="text-xl font-semibold text-text-primary mb-6">
          TOP REVIEWS
        </h3>

        <div className="space-y-8">
          {[
            {
              name: 'Kristy Allen',
              date: 'Feb 24, 2023',
              rating: 5,
              text: 'I would recommend this course to all who aspire to learn front-end web development. It will help you in filling your knowledge gaps, even if you have prior knowledge of this topic :-).',
              likes: 1254,
              dislikes: 125,
            },
            {
              name: 'Kristy Allen',
              date: 'Feb 24, 2023',
              rating: 4,
              text: 'I would recommend this course to all who aspire to learn front-end web development. It will help you in filling your knowledge gaps, even if you have prior knowledge of this topic :-).',
              likes: 1254,
              dislikes: 125,
            },
          ].map((review, index) => (
            <div key={index} className="flex gap-6">
              <div className="flex flex-col items-start gap-2 flex-shrink-0 w-48">
                <p className="text-lg font-semibold text-text-primary">
                  {review.name}
                </p>
                <p className="text-sm text-text-secondary">
                  {review.date}
                </p>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-yellow-400 text-base' : 'text-gray-300 text-base'}>★</span>
                  ))}
                </div>
              </div>
              <div className="flex-1">
                <p className="text-text-primary leading-relaxed mb-4">
                  {review.text}
                </p>
                <div className="flex items-center gap-6">
                  <button className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                    <span>👍</span>
                    <span className="text-sm font-medium">{review.likes}</span>
                  </button>
                  <button className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
                    <span>👎</span>
                    <span className="text-sm font-medium">{review.dislikes}</span>
                  </button>
                  <button className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors">
                    <span>📝</span>
                    <span className="text-sm font-medium">Report</span>
                  </button>
                </div>
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

export default ReviewsSection;
