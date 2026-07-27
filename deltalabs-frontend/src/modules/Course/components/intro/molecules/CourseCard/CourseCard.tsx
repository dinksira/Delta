/**
 * CourseCard
 * A course card component with thumbnail, title, institution, rating, and enroll button.
 *
 * @example
 * ```tsx
 * <CourseCard
 *   title="Chemistry"
 *   institution="Haramaya University"
 *   status="Supplement"
 *   rating={4}
 * />
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CourseCardProps {
  /** Course title */
  title?: string;
  /** Institution name */
  institution?: string;
  /** Course status (e.g., Supplement, Complement) */
  status?: string;
  /** Rating out of 5 */
  rating?: number;
  /** Thumbnail image URL */
  thumbnailUrl?: string;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_THUMBNAIL = '/laboratory_glass.png';

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseCard: React.FC<CourseCardProps> = ({
  title = 'Chemistry',
  institution = 'Haramaya University',
  status = 'Supplement',
  rating = 4,
  thumbnailUrl = DEFAULT_THUMBNAIL,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex bg-surface-secondary rounded-2xl overflow-hidden shadow-sm ${className}`}
      {...props}
    >
      {/* Left Column: Thumbnail */}
      <div className="w-2/5 flex-shrink-0 relative rounded-tl-2xl rounded-bl-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-muted to-surface-secondary" />
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover relative z-10"
        />
      </div>

      {/* Right Column: Content */}
      <div className="w-3/5 p-4 flex flex-col justify-between relative">
        {/* Share Icon */}
        <button
          type="button"
          className="absolute top-4 right-4 text-primary-800 hover:text-primary-700 transition-colors cursor-pointer"
          aria-label="Share course"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>

        <div>
          {/* Title & Institution */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="text-lg font-bold text-primary-900">
              {title}
            </h3>
            <span className="text-text-secondary">|</span>
            <p className="text-sm text-text-primary">
              {institution}
            </p>
          </div>

          {/* Rate Label */}
          <p className="text-xs text-primary-700 mb-1">
            Rate
          </p>

          {/* Rating & Status */}
          <div className="flex items-center justify-between mb-2">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-3 h-3 ${star <= rating ? 'text-primary-900' : 'text-text-secondary'}`}
                  viewBox="0 0 20 20"
                  fill={star <= rating ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Status Tag */}
            <span className={`text-xs font-semibold ${status === 'Complement' ? 'text-amber-600' : 'text-success-700'}`}>
              {status}
            </span>
          </div>
        </div>

        {/* Enroll Button */}
        <div>
          <button
            type="button"
            className="px-6 py-1.5 bg-primary-900 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition-colors cursor-pointer"
          >
            Enroll
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CourseCard;
