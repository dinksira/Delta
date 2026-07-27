/**
 * WishlistCourseCard
 * Atomic Level: Molecule
 *
 * Card component for displaying a course in the wishlist with selection checkbox,
 * thumbnail, rating, price, status, and dynamic action buttons.
 */

import React from 'react';
import { Checkbox } from '@/components/theme/Checkbox';
import { ShoppingCart, Star, FileText, Box, UserPlus, Minus } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export type CourseAidStatus = 'none' | 'ask' | 'approved' | 'rejected' | 'waiting';

export interface WishlistCourse {
  id: string;
  title: string;
  provider: string;
  rating: number; // 0-5
  price: number; // 0 means Free
  image: string;
  aidStatus: CourseAidStatus;
}

export interface WishlistCourseCardProps {
  course: WishlistCourse;
  isSelected?: boolean;
  onSelectChange?: (selected: boolean) => void;
  onEnroll?: () => void;
  onAskAid?: () => void;
  onSourceSponsor?: () => void;
  onRemove?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const WishlistCourseCard: React.FC<WishlistCourseCardProps> = ({
  course,
  isSelected = false,
  onSelectChange,
  onEnroll,
  onAskAid,
  onSourceSponsor,
  onRemove,
}) => {
  // Render stars based on rating
  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${
            i <= course.rating
              ? 'fill-primary-800 text-primary-800'
              : 'fill-transparent text-primary-800'
          }`}
        />
      );
    }
    return stars;
  };

  // Render dynamic action buttons block based on price and aid status
  const renderDynamicActions = () => {
    // Shared outline button container styles
    const containerClasses = "flex items-center border border-primary-500 rounded text-sm text-primary-700 bg-transparent overflow-hidden h-8";
    
    if (course.price === 0) {
      return (
        <button 
          onClick={onEnroll}
          className="h-8 px-6 bg-transparent border border-primary-500 text-primary-700 rounded text-sm hover:bg-primary-50 transition-colors w-full max-w-[140px]"
        >
          Enroll
        </button>
      );
    }

    // Paid course - check aid status
    if (course.aidStatus === 'ask') {
      return (
        <div className={`${containerClasses} w-full max-w-[140px]`}>
          <button 
            onClick={onAskAid}
            className="flex-1 h-full px-2 hover:bg-primary-50 transition-colors whitespace-nowrap"
          >
            Ask for aid
          </button>
          <div className="w-px h-full bg-primary-500" />
          <button 
            onClick={onEnroll}
            className="flex-1 h-full px-2 hover:bg-primary-50 transition-colors"
          >
            Enroll
          </button>
        </div>
      );
    }

    if (course.aidStatus === 'approved') {
      return (
        <div className={`${containerClasses} w-full max-w-[140px]`}>
          <div className="flex-1 h-full flex items-center justify-center px-2 text-emerald-600 font-medium whitespace-nowrap">
            Approved
          </div>
          <div className="w-px h-full bg-primary-500" />
          <button 
            onClick={onEnroll}
            className="flex-1 h-full px-2 hover:bg-primary-50 transition-colors"
          >
            Enroll
          </button>
        </div>
      );
    }

    if (course.aidStatus === 'rejected') {
      return (
        <div className={`${containerClasses} w-full max-w-[140px]`}>
          <div className="flex-1 h-full flex items-center justify-center px-2 text-red-600 font-medium whitespace-nowrap">
            Rejected
          </div>
          <div className="w-px h-full bg-primary-500" />
          <button 
            onClick={onEnroll}
            className="flex-1 h-full px-2 hover:bg-primary-50 transition-colors"
          >
            Enroll
          </button>
        </div>
      );
    }
    
    // Default fallback (e.g., waiting)
    return (
      <div className={`${containerClasses} w-full max-w-[140px]`}>
        <div className="flex-1 h-full flex items-center justify-center px-2 text-yellow-600 font-medium whitespace-nowrap">
          Waiting
        </div>
        <div className="w-px h-full bg-primary-500" />
        <button 
          onClick={onEnroll}
          className="flex-1 h-full px-2 hover:bg-primary-50 transition-colors"
        >
          Enroll
        </button>
      </div>
    );
  };

  return (
    <div className="flex w-full items-start gap-4">
      {/* Checkbox column */}
      <div className="pt-4">
        <Checkbox 
          checked={isSelected} 
          onChange={(e) => onSelectChange?.(e.target.checked)} 
          className="border-primary-500 size-5 rounded-md"
        />
      </div>

      {/* Main Card */}
      <div className="flex-1 bg-[#DCE3E6] rounded-xl p-4 flex gap-5 shadow-sm">
        {/* Thumbnail */}
        <div className="w-[140px] h-[100px] bg-white rounded-md overflow-hidden shrink-0 shadow-sm border border-black/5">
          {/* Use standard img for mock to avoid Next/Image setup overhead for now */}
          <img 
            src={course.image} 
            alt={course.title} 
            className="w-full h-full object-cover" 
          />
        </div>

        {/* Info Column */}
        <div className="flex flex-col flex-1 py-1">
          {/* Header row */}
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-primary-900 leading-tight">{course.title}</h3>
            <div className="w-px h-4 bg-primary-300" />
            <span className="text-sm text-primary-600 font-medium">{course.provider}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            {renderStars()}
          </div>

          {/* Introduction Link */}
          <div className="flex items-center gap-1.5 text-xs text-primary-600 font-medium mb-auto opacity-80 hover:opacity-100 cursor-pointer w-max">
            <FileText className="w-3.5 h-3.5" />
            <span>Course Introduction</span>
          </div>

          {/* Bottom Actions Row */}
          <div className="flex items-center gap-6 mt-4">
            <button className="px-5 py-1.5 bg-primary-800 text-white text-sm rounded shadow-sm hover:bg-primary-900 transition-colors font-medium">
              Try Course
            </button>
            <button className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium">
              <Box className="w-4 h-4 stroke-[1.5]" /> Required Resources
            </button>
            <button 
              onClick={onSourceSponsor}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-medium"
            >
              <UserPlus className="w-4 h-4 stroke-[1.5]" /> Source Sponsor
            </button>
            <button 
              onClick={onRemove}
              className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-medium ml-auto"
            >
              <Minus className="w-3 h-3" /> Remove
            </button>
          </div>
        </div>

        {/* Right Action Column */}
        <div className="flex flex-col items-end min-w-[140px] py-1">
          <button className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-800 font-medium mb-3">
            <ShoppingCart className="w-4 h-4 stroke-[1.5]" /> Add to Cart
          </button>
          
          <div className="text-center font-bold text-primary-900 mb-2 mt-auto">
            {course.price === 0 ? "Free" : `${course.price} birr`}
          </div>
          
          <div className="flex items-center justify-end w-full">
            {renderDynamicActions()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistCourseCard;
