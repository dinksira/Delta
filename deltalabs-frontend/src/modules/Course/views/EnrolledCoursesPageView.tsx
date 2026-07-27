/**
 * EnrolledCoursesPageView
 * Dashboard view for user's enrolled courses.
 * Redesigned to match the precise mockups with Search, Toggles, and Grid.
 *
 * @example
 * ```tsx
 * <EnrolledCoursesPageView />
 * ```
 */

"use client";

import React, { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';
import { useCourse } from '../context/CourseContext';
import type { Course } from '../types/courseTypes';
import { EnrolledCourseCard } from '@/components/molecules/EnrolledCourseCard';
import { 
  ChevronRight, 
  Pencil, 
  Search, 
  ListFilter,
  LayoutGrid,
  List
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// ============================================================================
// CONSTANTS
// ============================================================================

// ============================================================================
// COMPONENT
// ============================================================================

export const EnrolledCoursesPageView: React.FC = () => {
  const { enrolledCourses, isLoading, fetchEnrolledCourses } = useCourse();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchEnrolledCourses();
  }, [fetchEnrolledCourses]);

  // Use dummy data if none exists so we can see the layout properly
  const coursesToRender: Course[] = enrolledCourses.length > 0 
    ? enrolledCourses.filter(c => c.status === 'in_progress')
    : [
        {
          id: '1',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        },
        {
          id: '2',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        },
        {
          id: '3',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        },
        {
          id: '4',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        },
        {
          id: '5',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        },
        {
          id: '6',
          title: 'Learning JavaScript With Imagination',
          provider: 'AAU',
          progress: 0,
          status: 'in_progress',
          tags: [],
        }
      ];

  return (
    <div className="flex flex-col bg-surface-canvas px-8 py-10 md:px-16 md:py-12">
      
      {/* --- HEADER (Breadcrumb & Edit) --- */}
      <div className="flex items-center justify-between mb-12 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span 
            className="text-text-secondary cursor-pointer hover:text-text-primary transition-colors"
            onClick={() => router.push('/features/course')}
            role="link"
            tabIndex={0}
          >
            Course
          </span>
          <ChevronRight className="w-4 h-4 text-text-secondary" />
          <span className="text-primary-600">
            Enrolled Course
          </span>
        </div>
        
        <button 
          className="w-10 h-10 rounded-xl bg-primary-800 text-white flex items-center justify-center hover:bg-primary-900 transition-colors shadow-sm"
          aria-label="Edit"
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* --- SEARCH BAR --- */}
      <div className="flex justify-center mb-12">
        <div className="relative w-full max-w-2xl">
          <input 
            type="text" 
            placeholder="Search...|" 
            className="w-full h-12 pl-6 pr-16 rounded-full border border-border-default bg-surface-primary text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary-500 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-4 text-primary-600">
            <button aria-label="Search" className="hover:text-primary-800 transition-colors">
              <Search className="w-4 h-4" />
            </button>
            <button aria-label="Filter" className="hover:text-primary-800 transition-colors">
              <ListFilter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="max-w-7xl mx-auto w-full">
        
        {/* View Toggles */}
        <div className="flex items-center gap-3 mb-8">
          <button 
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === 'grid' 
                ? 'bg-primary-800 text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          
          <button 
            className={`w-9 h-9 flex items-center justify-center rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-primary-800 text-white shadow-sm' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
            onClick={() => setViewMode('list')}
            aria-label="List view"
          >
            <List className="w-5 h-5" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && coursesToRender.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-text-secondary">
            Loading your courses...
          </div>
        ) : (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coursesToRender.map((course, index) => (
              <EnrolledCourseCard 
                key={course.id || index}
                id={course.id}
                title={course.title}
                providerName={course.provider || 'AAU'}
                onGoToCourse={(id) => router.push(`/features/course/enrolled/${id}`)}
                onUnroll={() => {}}
                onShare={() => {}}
              />
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default EnrolledCoursesPageView;
