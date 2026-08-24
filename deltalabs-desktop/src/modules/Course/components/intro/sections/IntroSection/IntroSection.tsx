/**
 * IntroSection
 * The introductory section of the course detail page, containing media viewer and engagement panel.
 *
 * @example
 * ```tsx
 * <IntroSection course={course} />
 * ```
 */

import React from 'react';
import { CourseDetailLayout } from '../../templates/CourseDetailLayout';
import { MediaViewer } from '../../organisms/MediaViewer';
import { EngagementPanel } from '../../organisms/EngagementPanel';
import type { Course } from '../../../../types/courseTypes';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface IntroSectionProps {
  course: Course;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MOCK_MEDIA_ITEMS = [
  {
    id: '1',
    src: '/mock-feed-videos/video-01.mp4',
    thumbnailSrc: '/physics_simulation.png',
    alt: 'Electromagnetic induction experiment simulation'
  },
  {
    id: '2',
    src: '/mock-feed-videos/video-02.mp4',
    thumbnailSrc: '/newton_cradle.png',
    alt: 'Newton cradle physics simulation'
  },
  {
    id: '3',
    src: '/mock-feed-videos/video-03.mp4',
    thumbnailSrc: '/laboratory_glass.png',
    alt: 'Laboratory glassware and experiments'
  },
  {
    id: '4',
    src: '/mock-feed-videos/video-04.mp4',
    thumbnailSrc: '/safety_goggles.png',
    alt: 'Lab safety equipment and setup'
  },
  {
    id: '5',
    src: '/mock-feed-videos/video-05.mp4',
    thumbnailSrc: '/physics_thumbnails.png',
    alt: 'Experiment thumbnail strip overview'
  },
  {
    id: '6',
    src: '/mock-feed-videos/video-06.mp4',
    thumbnailSrc: '/physics_simulation.png',
    alt: 'Physics lecture video'
  },
  {
    id: '7',
    src: '/mock-feed-videos/video-07.mp4',
    thumbnailSrc: '/newton_cradle.png',
    alt: 'Experiment demonstration'
  },
  {
    id: '8',
    src: '/mock-feed-videos/video-08.mp4',
    thumbnailSrc: '/laboratory_glass.png',
    alt: 'Lab tutorial'
  },
  {
    id: '9',
    src: '/mock-feed-videos/video-09.mp4',
    thumbnailSrc: '/safety_goggles.png',
    alt: 'Physics simulation'
  },
  {
    id: '10',
    src: '/mock-feed-videos/video-10.mp4',
    thumbnailSrc: '/physics_thumbnails.png',
    alt: 'Educational content'
  },
  {
    id: '11',
    src: '/mock-feed-videos/video-11.mp4',
    thumbnailSrc: '/physics_simulation.png',
    alt: 'Lab experiment'
  },
  {
    id: '12',
    src: '/mock-feed-videos/video-12.mp4',
    thumbnailSrc: '/newton_cradle.png',
    alt: 'Science demonstration'
  },
  {
    id: '13',
    src: '/mock-feed-videos/video-13.mp4',
    thumbnailSrc: '/laboratory_glass.png',
    alt: 'Educational video'
  }
] as const;

const MOCK_COMMENTS = [
  {
    id: 'c1',
    authorName: 'Abebe Kebede',
    authorInitial: 'A',
    avatarColor: '#174A5F',
    content: 'This electromagnetic induction simulation is incredibly helpful! It makes understanding magnetic flux much easier than reading textbook equations.',
    timestamp: '2 hours ago',
    likes: 145,
    replies: [
      {
        id: 'c1_r1',
        authorName: 'Sara Alemu',
        authorInitial: 'S',
        avatarColor: '#236b82',
        content: 'Completely agree! The visual representation of the galvanometer needle response to coil speed is spot on.',
        timestamp: '1 hour ago',
        likes: 24,
      }
    ]
  },
  {
    id: 'c2',
    authorName: 'Dawit Yohannes',
    authorInitial: 'D',
    avatarColor: '#4a8fa2',
    content: 'Are there exercises associated with this laboratory simulation? I would love to test my knowledge.',
    timestamp: '4 hours ago',
    likes: 82,
    replies: [
      {
        id: 'c2_r1',
        authorName: 'Tutor Support',
        authorInitial: 'T',
        avatarColor: '#0c2935',
        content: "Yes, Dawit! Click on the 'Exercise' tab in the bottom dock navigation to find matching problem sets.",
        timestamp: '3 hours ago',
        likes: 18,
      }
    ]
  },
  {
    id: 'c3',
    authorName: 'Hana Tesfaye',
    authorInitial: 'H',
    avatarColor: '#6a1b9a',
    content: 'The video quality is amazing! So clear and easy to follow.',
    timestamp: '6 hours ago',
    likes: 56,
    replies: [],
  },
  {
    id: 'c4',
    authorName: 'Michael Bekele',
    authorInitial: 'M',
    avatarColor: '#c62828',
    content: 'This is exactly what I needed for my exam preparation. Thank you!',
    timestamp: '8 hours ago',
    likes: 98,
    replies: [],
  },
  {
    id: 'c5',
    authorName: 'Zara Mekonnen',
    authorInitial: 'Z',
    avatarColor: '#00695c',
    content: 'Can we get more videos like this on quantum physics?',
    timestamp: '1 day ago',
    likes: 120,
    replies: [],
  },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const IntroSection: React.FC<IntroSectionProps> = ({ course: _course }) => {
  return (
    <CourseDetailLayout
      header={<div />}
      subNavigation={<div />}
      mediaViewer={<MediaViewer items={MOCK_MEDIA_ITEMS} />}
      engagementPanel={
        <EngagementPanel
          providerName="Addis Ababa University"
          subtitle="Department of Physics • Course intro"
          hashtags={['#Physics', '#Electromagnetism', '#LabWork', '#AAU']}
          likeCount="25K"
          commentCount="5K"
          shareCount="1.2K"
          comments={MOCK_COMMENTS}
        />
      }
    />
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default IntroSection;
