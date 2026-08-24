/**
 * SponsorView
 * 
 * Main page view for the Course Sponsor selection and tracking.
 */

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';

import { SponsorLayout } from '../components/sponsor/templates/SponsorLayout';
import { SponsorTabs, SponsorTabType } from '../components/sponsor/molecules/SponsorTabs';
import { SponsorCard, SponsorData } from '../components/sponsor/molecules/SponsorCard';
import { WishlistSearchBar } from '../components/wishlist/molecules/WishlistSearchBar';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_ALL_SPONSORS: SponsorData[] = [
  {
    id: '1',
    name: 'Mekdes',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://mekdes.com',
    urlText: 'mekdes.com',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Mekdes&backgroundColor=1F4156',
    status: 'None',
  },
  {
    id: '2',
    name: 'Kidist',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://kidist.com',
    urlText: 'kidist.com',
    bannerImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Kidist&backgroundColor=1F4156',
    status: 'None',
  },
  {
    id: '3',
    name: 'Fikir',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://fikir.com',
    urlText: 'fikir.com',
    bannerImage: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Fikir&backgroundColor=1F4156',
    status: 'None',
  },
  {
    id: '4',
    name: 'Haron',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://haron.com',
    urlText: 'haron.com',
    bannerImage: 'https://images.unsplash.com/photo-1444464666168-49b626d49c28?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Haron&backgroundColor=1F4156',
    status: 'None',
  },
  {
    id: '5',
    name: 'Leul',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://leul.com',
    urlText: 'leul.com',
    bannerImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Leul&backgroundColor=1F4156',
    status: 'None',
  },
  {
    id: '6',
    name: 'Hilina',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://hilina.com',
    urlText: 'hilina.com',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Hilina&backgroundColor=1F4156',
    status: 'None',
  },
];

const MOCK_APPLIED_SPONSORS: SponsorData[] = [
  {
    id: 'a1',
    name: 'Rose',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://rose.com',
    urlText: 'rose.com',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150',
    status: 'Applied',
  },
  {
    id: 'a2',
    name: 'Doe',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://doe.com',
    urlText: 'doe.com',
    bannerImage: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150&h=150',
    status: 'Waiting',
  },
  {
    id: 'a3',
    name: 'Leul',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://leul.com',
    urlText: 'leul.com',
    bannerImage: 'https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Leul&backgroundColor=1F4156',
    status: 'Accepted',
  },
  {
    id: 'a4',
    name: 'John',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://john.com',
    urlText: 'john.com',
    bannerImage: 'https://images.unsplash.com/photo-1444464666168-49b626d49c28?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=John&backgroundColor=1F4156',
    status: 'Accepted',
  },
  {
    id: 'a5',
    name: 'Doe',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://doe.com',
    urlText: 'doe.com',
    bannerImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=Doe&backgroundColor=1F4156',
    status: 'Rejected',
  },
  {
    id: 'a6',
    name: 'John Doe',
    description: 'Here goes a little description whether a person or a company',
    url: 'https://johndoe.com',
    urlText: 'johndoe.com',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=400&h=200',
    avatarImage: 'https://api.dicebear.com/7.x/initials/svg?seed=JohnDoe&backgroundColor=1F4156',
    status: 'Waiting',
  },
];

// ============================================================================
// VIEW COMPONENT
// ============================================================================

export const SponsorView: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SponsorTabType>('sponsors');

  // Filter based on search query
  const sponsorsToRender = (activeTab === 'sponsors' ? MOCK_ALL_SPONSORS : MOCK_APPLIED_SPONSORS).filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SponsorLayout
      breadcrumb={
        <>
          <span 
            className="cursor-pointer hover:underline" 
            onClick={() => router.push('/features/course')}
          >
            Course
          </span>
          <ChevronRight className="w-4 h-4 text-primary-400" />
          <span 
            className="cursor-pointer hover:underline" 
            onClick={() => router.push('/features/course/wishlist')}
          >
            Wishlist
          </span>
          <ChevronRight className="w-4 h-4 text-primary-400" />
          <span className="font-semibold text-primary-800">Sponsor</span>
        </>
      }
      searchBar={
        <div className="flex justify-center">
          <div className="w-full max-w-2xl">
             <WishlistSearchBar 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              // The design shows an edit icon cut off on the right, mirroring the wishlist search bar
              onEditClick={() => console.log('Edit clicked')}
            />
          </div>
        </div>
      }
      tabs={
        <SponsorTabs 
          activeTab={activeTab} 
          onChange={setActiveTab} 
        />
      }
      gridContent={
        <>
          {sponsorsToRender.map(sponsor => (
            <SponsorCard
              key={sponsor.id}
              sponsor={sponsor}
              activeTab={activeTab}
              onApply={() => console.log('Apply to', sponsor.name)}
            />
          ))}
          {sponsorsToRender.length === 0 && (
            <div className="col-span-full py-12 text-center text-primary-600">
              No sponsors found matching "{searchQuery}"
            </div>
          )}
        </>
      }
    />
  );
};

export default SponsorView;
