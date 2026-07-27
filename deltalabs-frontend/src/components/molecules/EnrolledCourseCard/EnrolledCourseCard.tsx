/**
 * EnrolledCourseCard
 * Molecule component for displaying an enrolled course with specific overlays
 * and action buttons matching the redesigned Enrolled Course dashboard.
 *
 * @example
 * ```tsx
 * <EnrolledCourseCard 
 *   id="1" 
 *   title="Learning JavaScript With Imagination" 
 *   providerName="AAU" 
 * />
 * ```
 */

import React from 'react';
import type { EnrolledCourseCardProps } from './EnrolledCourseCard.types';
import { 
  Share2, 
  Play, 
  Users, 
  MessageSquare, 
  CloudDownload,
  LogOut,
  Star,
  Library,
  LineChart,
  BookMarked
} from 'lucide-react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

// Props are imported from EnrolledCourseCard.types.ts

// ============================================================================
// CONSTANTS
// ============================================================================

// Internal component constants can go here if needed.

// ============================================================================
// COMPONENT
// ============================================================================

export const EnrolledCourseCard: React.FC<EnrolledCourseCardProps> = ({
  id,
  thumbnailUrl = 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80',
  title,
  providerName,
  providerLogoUrl = 'https://ui-avatars.com/api/?name=AAU&background=0D8ABC&color=fff',
  ratingText = '(4.8 Reviews)',
  lessonsCount = 64,
  className = '',
  onGoToCourse,
  onUnroll,
  onShare,
  ...props
}) => {
  return (
    <div 
      className={`flex flex-col bg-surface-default border border-border-default rounded-xl overflow-hidden cursor-pointer transition-colors hover:border-text-secondary ${className}`}
      onClick={() => onGoToCourse?.(id)}
      role="button"
      tabIndex={0}
      {...props}
    >
      {/* --- IMAGE & OVERLAYS --- */}
      <div className="relative h-48 w-full bg-surface-muted overflow-hidden group">
        <img 
          src={thumbnailUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        
        {/* Share Button (Top Right) */}
        <button 
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/80 hover:bg-white rounded-full text-primary-600 transition-colors shadow-sm"
          onClick={(e) => { e.stopPropagation(); onShare?.(id); }}
          aria-label="Share course"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Play Button Overlay (Center) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Play className="w-16 h-16 text-white/50 fill-white/30" />
        </div>

        {/* Overlapping Icons (Bottom Center) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center -space-x-2">
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary-700 shadow-sm border border-white relative z-10">
            <Users className="w-4 h-4" />
          </div>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary-700 shadow-sm border border-white relative z-20">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-primary-700 shadow-sm border border-white relative z-30">
            <CloudDownload className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="p-5 flex flex-col flex-grow">
        
        {/* Action Row */}
        <div className="flex items-center gap-3 mb-4">
          <button 
            className="flex-1 flex items-center justify-center gap-2 bg-surface-muted text-text-secondary hover:text-text-primary hover:bg-border-default py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            onClick={(e) => { e.stopPropagation(); onUnroll?.(id); }}
          >
            <LogOut className="w-4 h-4 rotate-180" />
            Unroll
          </button>
          
          <button 
            className="flex-1 flex items-center justify-center bg-primary-800 text-white hover:bg-primary-900 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
            onClick={(e) => { e.stopPropagation(); onGoToCourse?.(id); }}
          >
            Go to course
          </button>
        </div>

        {/* Title */}
        <h3 className="text-[15px] font-bold text-text-primary leading-tight mb-4">
          {title}
        </h3>

        {/* Provider & Rating Row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img 
              src={providerLogoUrl} 
              alt={providerName} 
              className="w-6 h-6 rounded-full object-cover ring-1 ring-border-subtle"
            />
            <span className="text-xs text-text-secondary font-medium uppercase tracking-wide">
              {providerName}
            </span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="text-xs text-text-disabled">
              {ratingText}
            </span>
          </div>
        </div>

        {/* Footer info (Lessons, Progress, Planner) */}
        <div className="mt-auto pt-4 border-t border-border-default flex items-center justify-between text-text-secondary text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <Library className="w-4 h-4" />
            <span>{lessonsCount} Lessons</span>
          </div>
          <div className="flex items-center gap-1.5">
            <LineChart className="w-4 h-4" />
            <span>Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookMarked className="w-4 h-4" />
            <span>Planner</span>
          </div>
        </div>

      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

EnrolledCourseCard.displayName = 'EnrolledCourseCard';

export default EnrolledCourseCard;
