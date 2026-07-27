/**
 * CourseHomeView
 *
 * Landing page for the Course module.
 * Pixel-matched to the uploaded high-fidelity design:
 *  - Top nav row centered, no border/stroke
 *  - Dark teal FAB on the far right toggles nav visibility
 *  - Teal "Course" heading
 *  - 2×2 grid of feature cards (no card chrome, just icon + text)
 *
 * @example
 * ```tsx
 * <CourseHomeView />
 * ```
 */

"use client";

import React, { useState } from 'react';

import { useRouter } from 'next/navigation';

import { IconNavItem } from '@/components/molecules/IconNavItem';
import { CourseFeatureCard } from '@/components/molecules/CourseFeatureCard';
import {
  Award,
  Clock,
  WifiOff,
  MessageSquare,
  LogOut,
  Pencil,
  Package,
  CheckCircle2,
  Calendar,
  PlayCircle,
} from 'lucide-react';

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseHomeView: React.FC = () => {
  const router = useRouter();
  const [isNavVisible, setIsNavVisible] = useState(true);

  /** Toggles the top navigation bar in/out */
  const handleToggleNav = (): void => {
    setIsNavVisible((prev) => !prev);
  };

  return (
    <div className="flex flex-col bg-surface-canvas p-6 md:p-10 lg:p-12">

      {/* ================================================================== */}
      {/* TOP NAVIGATION BAR — centered, no border, slides up/down          */}
      {/* ================================================================== */}
      <div className="relative mb-14 w-full">
        {/* Nav bar container — slides up when hidden */}
        <div
          className={[
            'flex items-center justify-center w-full',
            'transition-all duration-300 ease-in-out overflow-hidden',
            isNavVisible ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0',
          ].filter(Boolean).join(' ')}
        >
          <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide bg-surface-primary px-6 py-2.5 rounded-full">
            <IconNavItem
              icon={<Award className="w-4 h-4" />}
              label="Super Course"
              onClick={() => router.push('/features/course/super-course')}
            />
            <IconNavItem
              icon={<Clock className="w-4 h-4" />}
              label="Recent Activity"
            />
            <IconNavItem
              icon={<WifiOff className="w-4 h-4" />}
              label="Offline Courses"
            />
            <IconNavItem
              icon={<MessageSquare className="w-4 h-4" />}
              label="Message"
            />
            <IconNavItem
              icon={<LogOut className="w-4 h-4" />}
              label="Enrolled Courses"
            />
          </div>
        </div>

        {/* FAB — always visible, fixed to the right */}
        <button
          className="absolute top-0 right-0 flex items-center justify-center w-10 h-10 rounded-xl bg-primary-800 text-white transition-colors shadow-sm"
          onClick={handleToggleNav}
          aria-label={isNavVisible ? 'Hide navigation' : 'Show navigation'}
        >
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* ================================================================== */}
      {/* MAIN CONTENT                                                       */}
      {/* ================================================================== */}
      <div className="flex flex-col items-center w-full">
        <div className="w-full max-w-4xl">

          {/* "Course" heading — teal color matching the design */}
          <h1 className="text-lg font-medium text-primary-600 mb-10">Course</h1>

          {/* 2×2 Feature cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">

            {/* Enrolled Courses — box/package outline icon */}
            <CourseFeatureCard
              icon={<Package className="w-7 h-7 stroke-[1.5]" />}
              title="Enrolled Courses"
              description="This blog post has been published. Team members will be able to edit this post and republish changes."
              onClick={() => router.push('/features/course/enrolled')}
            />

            {/* Wishlist — green check-circle icon */}
            <CourseFeatureCard
              icon={<CheckCircle2 className="w-7 h-7 stroke-[1.5] text-emerald-600" />}
              title="Wishlist"
              description="This blog post has been published. Team members will be able to edit this post and republish changes."
            />

            {/* Planner Page — calendar icon */}
            <CourseFeatureCard
              icon={<Calendar className="w-7 h-7 stroke-[1.5]" />}
              title="Planner Page"
              description="This blog post has been published. Team members will be able to edit this post and republish changes."
            />

            {/* Continue with plan — play-circle icon */}
            <CourseFeatureCard
              icon={<PlayCircle className="w-7 h-7 stroke-[1.5]" />}
              title="Continue with plan"
              description="This blog post has been published. Team members will be able to edit this post and republish changes."
            />

          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

CourseHomeView.displayName = 'CourseHomeView';

export default CourseHomeView;
