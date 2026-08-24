/**
 * WishlistView
 * 
 * Main page view for the Course Wishlist.
 * Implements the layout with mock data for demonstration.
 */

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { WishlistLayout } from '../components/wishlist/templates/WishlistLayout';
import { WishlistSearchBar } from '../components/wishlist/molecules/WishlistSearchBar';
import { WishlistCourseCard, WishlistCourse } from '../components/wishlist/molecules/WishlistCourseCard';
import { SummarizedInfoCard } from '../components/wishlist/organisms/SummarizedInfoCard';
import { AppliedAidsCard, AppliedAidItem } from '../components/wishlist/organisms/AppliedAidsCard';
import { Checkbox } from '@/components/theme/Checkbox';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_COURSES: WishlistCourse[] = [
  {
    id: 'course-1',
    title: 'Chemistry',
    provider: 'Haramaya University',
    rating: 4,
    price: 0,
    image: 'https://images.unsplash.com/photo-1603126852883-cb6fba6520e9?auto=format&fit=crop&q=80&w=400&h=300', // Chemistry related image
    aidStatus: 'none',
  },
  {
    id: 'course-2',
    title: 'Chemistry',
    provider: 'Haramaya University',
    rating: 4,
    price: 1000,
    image: 'https://images.unsplash.com/photo-1603126852883-cb6fba6520e9?auto=format&fit=crop&q=80&w=400&h=300',
    aidStatus: 'ask',
  },
  {
    id: 'course-3',
    title: 'Chemistry',
    provider: 'Haramaya University',
    rating: 4,
    price: 100,
    image: 'https://images.unsplash.com/photo-1603126852883-cb6fba6520e9?auto=format&fit=crop&q=80&w=400&h=300',
    aidStatus: 'approved',
  },
  {
    id: 'course-4',
    title: 'Chemistry',
    provider: 'Haramaya University',
    rating: 4,
    price: 135,
    image: 'https://images.unsplash.com/photo-1603126852883-cb6fba6520e9?auto=format&fit=crop&q=80&w=400&h=300',
    aidStatus: 'rejected',
  },
];

const MOCK_AIDS: AppliedAidItem[] = [
  { id: 'aid-1', courseName: 'English', status: 'Approved' },
  { id: 'aid-2', courseName: 'Physics', status: 'Waiting' },
  { id: 'aid-3', courseName: 'Biology', status: 'Rejected' },
  { id: 'aid-4', courseName: 'English', status: 'Approved' },
];

// ============================================================================
// VIEW COMPONENT
// ============================================================================

export const WishlistView: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(MOCK_COURSES.map(c => c.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const isAllSelected = selectedIds.size === MOCK_COURSES.length && MOCK_COURSES.length > 0;

  return (
    <WishlistLayout
      breadcrumb={
        <>
          <span 
            className="cursor-pointer hover:underline" 
            onClick={() => router.push('/features/course')}
          >
            Course
          </span>
          <ChevronRight className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-primary-800">Wishlist</span>
        </>
      }
      searchBar={
        <WishlistSearchBar 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onEditClick={() => console.log('Edit clicked')}
        />
      }
      selectAllControl={
        <div className="flex items-center gap-2 px-1 py-2">
          <Checkbox 
            checked={isAllSelected}
            onChange={(e) => handleSelectAll(e.target.checked)}
            className="border-primary-500 size-5 rounded-md"
          />
          <span className="text-sm font-medium text-primary-800">select all</span>
        </div>
      }
      mainList={
        <>
          {MOCK_COURSES.map(course => (
            <WishlistCourseCard
              key={course.id}
              course={course}
              isSelected={selectedIds.has(course.id)}
              onSelectChange={(checked) => handleSelectRow(course.id, checked)}
              onEnroll={() => console.log('Enroll', course.id)}
              onAskAid={() => console.log('Ask aid', course.id)}
              onSourceSponsor={() => router.push('/features/course/wishlist/sponsor')}
              onRemove={() => console.log('Remove', course.id)}
            />
          ))}
        </>
      }
      sidebar={
        <div className="flex flex-col gap-6 w-full">
          <SummarizedInfoCard
            totalItems={5}
            totalTimeDays={20}
            totalBudget={1200}
            onViewPlanner={() => console.log('View Planner')}
            onYourCart={() => console.log('Your Cart')}
          />
          <AppliedAidsCard items={MOCK_AIDS} />
        </div>
      }
    />
  );
};

export default WishlistView;
