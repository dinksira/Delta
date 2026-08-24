/**
 * AboutSection
 * The about section of the course detail page.
 *
 * @example
 * ```tsx
 * <AboutSection course={course} />
 * ```
 */

import React from 'react';
import type { Course } from '../../../../types/courseTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AboutSectionProps {
  course: Course;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const WHO_THIS_COURSE_IS_FOR = [
  'This course is for everyone: Physics beginners',
  'Everyone who likes physics',
  'Beginners who want to explore',
  'High school students',
  'First born hep',
];

const BENEFITS_OF_TAKING_THE_COURSE = [
  'This course is for everyone: Physics beginners',
  'Everyone who likes physics',
  'Science students',
  'high school students',
  'First born hep',
];

const SOCIAL_ICONS = ['twitter', 'youtube', 'linkedin', 'facebook'];

// ============================================================================
// COMPONENT
// ============================================================================

export const AboutSection: React.FC<AboutSectionProps> = ({ course }) => {
  return (
    <div className="bg-surface-canvas text-text-primary">
      {/* Hero Image */}
      <div className="w-full h-64 md:h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=2000&auto=format&fit=crop"
          alt="Biology course hero"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-8 md:px-12 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Course Title & Stats */}
            <div className="space-y-2">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-3xl font-bold text-text-primary">
                  {course.title || 'Biology for beginners'}
                </h1>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-text-secondary font-medium">+18,000 already enrolled</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-text-secondary">(475 Reviews)</span>
              </div>
            </div>

            {/* Welcome Title */}
            <h2 className="text-2xl font-semibold text-text-primary">
              Welcome to the world of biology!
            </h2>
            
            {/* Welcome Paragraph */}
            <p className="text-text-secondary leading-relaxed">
              These courses provide a broad overview of the major topics in biology and are a great starting point for anyone interested in the subject. They often include lab simulations and virtual experiments.
            </p>

            {/* Two Columns: Who It's For & Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Who this course is for
                </h3>
                <ul className="space-y-2">
                  {WHO_THIS_COURSE_IS_FOR.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Benefits of taking the course
                </h3>
                <ul className="space-y-2">
                  {BENEFITS_OF_TAKING_THE_COURSE.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-600 mt-2 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Message School Button */}
            <div className="pt-4">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface-primary border border-border-subtle rounded-lg text-text-primary font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
                </svg>
                Message School
              </button>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-1 space-y-6">
            {/* About School Card */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-primary">
                About school
              </h3>
              <div className="bg-surface-primary border border-border-subtle rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-text-primary">HU</span>
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-text-primary">
                      Haramaya University
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium text-primary-600">4.7</span>
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className="w-3.5 h-3.5 text-yellow-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-text-secondary">Health</span>
                      <span className="text-xs text-text-secondary">Engineering</span>
                      <span className="text-xs text-text-secondary">Law</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-2">
                  {SOCIAL_ICONS.map((social, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center text-text-secondary hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                      aria-label={`Visit ${social}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {social === 'twitter' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                        )}
                        {social === 'youtube' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        )}
                        {social === 'linkedin' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2V9z" />
                        )}
                        {social === 'facebook' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
                        )}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructors Card */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-text-primary">
                Instructors
              </h3>
              <div className="bg-surface-primary border border-border-subtle rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-text-primary">TD</span>
                  </div>
                  <span className="text-sm font-medium text-text-primary">Tim Doe</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center">
                    <span className="text-sm font-medium text-text-primary">MB</span>
                  </div>
                  <span className="text-sm font-medium text-text-primary">Mark Ben</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AboutSection;
