"use client";

/**
 * CourseDetailView
 * Continuous single-page programmatic scroll layout engine featuring an automated 
 * ScrollSpy Intersection matrix and the high-fidelity blueprint-accurate About Course view.
 *
 * @example
 * ```tsx
 * <CourseDetailView courseId="biology-101" />
 * ```
 */

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ChevronRight, 
  ArrowLeft, 
  Star, 
  Send, 
  MessageSquare 
} from 'lucide-react';

// ============================================================================
// INTERNAL MODULE & SYSTEM COMPONENT IMPORTS
// ============================================================================
import { Typography } from '@/components/theme';
import { CourseBottomDock } from '../components/intro/molecules/CourseBottomDock';
import { CourseDetailLayout } from '../components/intro/templates/CourseDetailLayout';
import { MediaViewer } from '../components/intro/organisms/MediaViewer';
import { EngagementPanel } from '../components/intro/organisms/EngagementPanel';
import { useCourse } from '../context/CourseContext';
import { CommunityView } from './CommunityView';
import { MyQuestionsPage } from './MyQuestionsPage';
import { ExerciseTestView } from './ExerciseTestView';
import { FastSummaryView } from './FastSummaryView';
import { ScoreView } from './ScoreView';
import { SupplementView } from './SupplementView';
import { ResourceManagementView } from './ResourceManagementView';
import { RoadmapView } from './RoadmapView';

import type { CourseDockTabId } from '../components/intro/molecules/CourseBottomDock';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CourseSubNavTabId =
  | 'intro'
  | 'about'
  | 'related'
  | 'reviews'
  | 'prerequisites'
  | 'analysis'
  | 'tutor';

export interface CourseTopSubNavProps {
  activeTab: CourseSubNavTabId;
  onTabChange: (tab: CourseSubNavTabId) => void;
}

interface TabDefinition {
  id: CourseSubNavTabId;
  label: string;
}

interface CourseSubNavTabProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export interface InstructorProfile {
  id: string;
  name: string;
}

export interface InstitutionalSchool {
  name: string;
  rating: number;
  tags: string[];
}

export interface CourseDetailViewProps {
  courseId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUB_NAV_TABS: readonly TabDefinition[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'about', label: 'About Course' },
  { id: 'related', label: 'Related Courses' },
  { id: 'reviews', label: 'Reviews & Rating' },
  { id: 'prerequisites', label: 'Prerequisites & Requirements' },
  { id: 'analysis', label: 'Course Analysis' },
  { id: 'tutor', label: 'Hire tutor' },
] as const;

const MOCK_MEDIA_ITEMS = [
  { id: '1', src: '/physics_simulation.png', thumbnailSrc: '/physics_simulation.png', alt: 'Biology lab simulation overview' },
  { id: '2', src: '/newton_cradle.png', thumbnailSrc: '/newton_cradle.png', alt: 'Cellular division animation breakdown' },
  { id: '3', src: '/laboratory_glass.png', thumbnailSrc: '/laboratory_glass.png', alt: 'Microscopic resolution structures' },
  { id: '4', src: '/safety_goggles.png', thumbnailSrc: '/safety_goggles.png', alt: 'Lab security rules documentation' },
] as const;

const MOCK_COMMENTS = [
  {
    id: 'c1',
    authorName: 'Abebe Kebede',
    authorInitial: 'A',
    avatarColor: 'bg-primary-900',
    content: 'This visualization tracking workspace makes understanding difficult concepts exceptionally clean!',
    timestamp: '2 hours ago',
    likes: 145,
    replies: [],
  },
] as const;

const TARGET_AUDIENCE: string[] = [
  'This course is for everyone: Biology beginners',
  'Everyone who likes biology',
  'Science students, who want to explore',
  'High School students',
  'Final Exam Prep',
];

const COURSE_BENEFITS: string[] = [
  'This course is for everyone: Biology beginners',
  'Everyone who likes biology',
  'Science students',
  'High School students',
  'Final Exam Prep',
];

const INSTRUCTORS: InstructorProfile[] = [
  { id: 'inst-1', name: 'Tim Doe' },
  { id: 'inst-2', name: 'Mark Ben' },
];

const INSTITUTION: InstitutionalSchool = {
  name: 'Haramaya University',
  rating: 4.7,
  tags: ['Health', 'Engineering', 'Law'],
};

// ============================================================================
// LOCAL INLINE ROBUST SVG ICONS SYSTEM
// ============================================================================

const LocalTwitterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LocalLinkedinIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const LocalFacebookIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// ============================================================================
// SUB-COMPONENTS (ATOMS / MOLECULES)
// ============================================================================

const CourseSubNavTab: React.FC<CourseSubNavTabProps> = ({ 
  label, 
  isActive, 
  onClick 
}) => {
  const buttonClasses = [
    'pb-1 text-sm font-medium transition-colors cursor-pointer border-b-2 whitespace-nowrap',
    isActive
      ? 'text-primary-800 border-primary-800'
      : 'text-text-secondary border-transparent hover:text-text-primary',
  ].filter(Boolean).join(' ');

  return (
    <button onClick={onClick} className={buttonClasses} role="tab" aria-selected={isActive}>
      {label}
    </button>
  );
};

export const CourseTopSubNav: React.FC<Readonly<CourseTopSubNavProps>> = ({
  activeTab,
  onTabChange,
}) => {
  const containerClasses = [
    'flex items-center justify-start md:justify-center w-full overflow-x-auto scrollbar-hide',
    'px-4 py-1 gap-x-8',
    'border-b border-border-subtle',
  ].join(' ');

  return (
    <nav className={containerClasses} role="tablist" aria-label="Course detail sections">
      {SUB_NAV_TABS.map((tab) => (
        <div key={tab.id} className="flex-shrink-0">
          <CourseSubNavTab
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        </div>
      ))}
    </nav>
  );
};

CourseTopSubNav.displayName = 'CourseTopSubNav';

// ============================================================================
// MAIN WORKSPACE VIEWPORT ENGINE
// ============================================================================

export const CourseDetailView: React.FC<CourseDetailViewProps> = ({ courseId }) => {
  const { enrolledCourses, fetchEnrolledCourses } = useCourse();
  const router = useRouter();

  const [activeDockTab, setActiveDockTab] = useState<CourseDockTabId>('intro');
  const [activeSubTab, setActiveSubTab] = useState<CourseSubNavTabId>('intro');

  // Semaphore variable to prevent component state updates from colliding during automated scroll translations
  const isProgrammaticScrolling = useRef<boolean>(false);

  // Structural DOM target pointers used by the scrolling anchor pipeline
  const introRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const relatedRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);
  const prerequisitesRef = useRef<HTMLDivElement>(null);
  const analysisRef = useRef<HTMLDivElement>(null);
  const tutorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEnrolledCourses();
  }, [fetchEnrolledCourses]);

  // ============================================================================
  // PROGRAMMATIC SCROLLSPY INTERSECTION ROUTINE
  // ============================================================================
  useEffect(() => {
    if (activeDockTab !== 'intro') return;

    const sectionElements = [
      { id: 'intro', ref: introRef },
      { id: 'about', ref: aboutRef },
      { id: 'related', ref: relatedRef },
      { id: 'reviews', ref: reviewsRef },
      { id: 'prerequisites', ref: prerequisitesRef },
      { id: 'analysis', ref: analysisRef },
      { id: 'tutor', ref: tutorRef },
    ];

    // Threshold configurations mapping precisely below the viewport sticky navigation bar
    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -55% 0px',
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      if (isProgrammaticScrolling.current) return;

      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('data-section-id') as CourseSubNavTabId;
          if (sectionId) {
            setActiveSubTab(sectionId);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    sectionElements.forEach((item) => {
      if (item.ref.current) {
        observer.observe(item.ref.current);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [activeDockTab]);

  const course = enrolledCourses.find((c) => c.id === courseId) ?? {
    id: courseId,
    title: 'Biology for beginners',
    provider: 'Haramaya University',
    progress: 12,
    status: 'in_progress' as const,
    tags: ['Biology', 'Science'],
  };

  const getSectionRef = (id: CourseSubNavTabId): React.RefObject<HTMLDivElement | null> => {
    switch (id) {
      case 'intro': return introRef;
      case 'about': return aboutRef;
      case 'related': return relatedRef;
      case 'reviews': return reviewsRef;
      case 'prerequisites': return prerequisitesRef;
      case 'analysis': return analysisRef;
      case 'tutor': return tutorRef;
    }
  };

  const handleSubTabChange = (tabId: CourseSubNavTabId) => {
    setActiveSubTab(tabId);
    const targetRef = getSectionRef(tabId);
    if (targetRef && targetRef.current) {
      isProgrammaticScrolling.current = true;
      
      targetRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });

      setTimeout(() => {
        isProgrammaticScrolling.current = false;
      }, 800);
    }
  };

  // Generic block generator for supporting modular page sections
  const renderGenericFallbackSection = (
    id: CourseSubNavTabId, 
    sectionRef: React.RefObject<HTMLDivElement | null>, 
    title: string, 
    description: string
  ) => {
    return (
      <div 
        ref={sectionRef} 
        data-section-id={id}
        className="w-full px-8 py-4 bg-surface-canvas text-text-primary scroll-mt-28"
      >
        <div className="p-6 border border-border-subtle rounded-2xl bg-surface-primary shadow-sm">
          <Typography variant="h2" className="mb-2">
            {title}
          </Typography>
          <Typography className="leading-relaxed text-text-secondary">
            {description}
          </Typography>
        </div>
      </div>
    );
  };

  // ============================================================================
  // BLUEPRINT-ACCURATE DESIGN RECONSTRUCTION FROM IMAGE_A55809.PNG
  // ============================================================================
  const renderBlueprintAboutSection = () => {
    const aboutSectionClasses = [
      'grid grid-cols-1 lg:grid-cols-12 w-full gap-x-12 gap-y-8',
      'px-8 py-10 bg-surface-primary border border-border-subtle rounded-2xl',
    ].join(' ');

    return (
      <div 
        ref={aboutRef} 
        data-section-id="about" 
        className="w-full px-8 py-4 bg-surface-canvas text-text-primary scroll-mt-28"
      >
        <div className={aboutSectionClasses}>
          {/* LEFT CONTENT COLUMN: CORE METRICS & TRAJECTORY PROFILE (8/12 Layout Width) */}
          <div className="lg:col-span-8 flex flex-col items-start justify-start">
            
            {/* Title */}
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary-900 md:text-4xl">
              {course.title}
            </h1>

            {/* Social Engagement Metadata Bar Splitters */}
            <div className="flex flex-wrap items-center justify-start gap-x-3 gap-y-1 mb-8 text-xs text-text-secondary">
              <div className="flex items-center gap-x-0.5 text-warning-500" aria-label="Rating context">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="w-4 h-4 fill-current stroke-current text-primary-800" />
                ))}
              </div>
              <span className="font-medium text-text-secondary">
                (475 Reviews)
              </span>
              
              {/* Native Splitter Bar Line */}
              <div className="w-px h-5 bg-border-primary mx-1" role="separator" />
              
              <span className="font-semibold text-primary-800 max-w-[180px] leading-tight">
                +18,000 already enrolled
              </span>
            </div>

            {/* Sub-Header Text Segment */}
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-primary-900">
              Welcome to the world of biology!
            </h2>
            
            <p className="mb-10 text-sm leading-relaxed text-text-secondary max-w-3xl">
              These courses provide a broad overview of the major topics in biology and are a great starting point for anyone interested in the subject. They often include lab simulations and virtual experiments.
            </p>

            {/* Twin Split Column Grid Profile */}
            <div className="grid grid-cols-1 md:grid-cols-2 w-full gap-x-8 gap-y-6">
              
              {/* Section block 1 */}
              <div className="flex flex-col items-start">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-900">
                  Who this course is for
                </h3>
                <ul className="flex flex-col gap-y-2 list-none p-0 m-0">
                  {TARGET_AUDIENCE.map((item, index) => (
                    <li key={index} className="flex items-start gap-x-2 text-xs text-text-secondary leading-normal">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-text-secondary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section block 2 */}
              <div className="flex flex-col items-start">
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-primary-900">
                  Benefits of taking the course
                </h3>
                <ul className="flex flex-col gap-y-2 list-none p-0 m-0">
                  {COURSE_BENEFITS.map((item, index) => (
                    <li key={index} className="flex items-start gap-x-2 text-xs text-text-secondary leading-normal">
                      <span className="mt-1.5 w-1 h-1 rounded-full bg-text-secondary flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN: INSTITUTIONAL ATTRIBUTION CARD (4/12 Layout Width) */}
          <div className="lg:col-span-4 flex flex-col items-start justify-start gap-y-8 lg:pl-4 border-t lg:border-t-0 pt-8 lg:pt-0 border-border-primary">
            
            {/* About School Matrix Block */}
            <div className="flex flex-col items-start w-full">
              <h3 className="mb-3 text-sm font-bold text-primary-900 tracking-tight">
                About school
              </h3>
              
              <div className="flex items-start gap-x-4 w-full mb-3">
                {/* Institutional Emblem Frame Wrapper */}
                <div className="flex items-center justify-center w-16 h-16 bg-surface-secondary border border-border-primary rounded-xs flex-shrink-0 p-1 shadow-2xs">
                  <div className="w-12 h-12 rounded-full bg-success-600 flex items-center justify-center text-white text-xs font-serif overflow-hidden">
                    <span className="text-[10px] tracking-tighter font-bold">HU</span>
                  </div>
                </div>

                <div className="flex flex-col items-start justify-center">
                  <h4 className="text-sm font-bold text-primary-900 leading-snug">
                    {INSTITUTION.name}
                  </h4>
                  
                  {/* Metric Sub-Row */}
                  <div className="flex items-center gap-x-1 mt-1 mb-2">
                    <span className="text-xs font-bold px-1.5 py-0.5 text-white bg-primary-800 rounded-xs">
                      {INSTITUTION.rating.toFixed(1)}
                    </span>
                    <div className="flex items-center text-primary-800">
                      {Array.from({ length: 5 }).map((_, idx) => (
                        <Star key={idx} className="w-3 h-3 fill-current stroke-current" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Educational Domain Tag Layout Chips */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {INSTITUTION.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2 py-0.5 text-[10px] font-medium text-text-secondary bg-surface-canvas border border-border-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* Social Channels Network */}
              <div className="flex items-center gap-x-3 text-primary-800">
                <a href="#telegram" className="transition-colors hover:text-primary-900" aria-label="Telegram Channel Anchor">
                  <Send className="w-4 h-4 transform rotate-45 -translate-y-0.5" />
                </a>
                <a href="#twitter" className="transition-colors hover:text-primary-900 w-4 h-4 flex items-center justify-center" aria-label="Twitter Channel Anchor">
                  <LocalTwitterIcon className="w-3.5 h-3.5" />
                </a>
                <a href="#linkedin" className="transition-colors hover:text-primary-900 w-4 h-4 flex items-center justify-center" aria-label="LinkedIn Profile Anchor">
                  <LocalLinkedinIcon className="w-3.5 h-3.5" />
                </a>
                <a href="#facebook" className="transition-colors hover:text-primary-900 w-4 h-4 flex items-center justify-center" aria-label="Facebook Profile Anchor">
                  <LocalFacebookIcon className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Instructor List Management Deck */}
            <div className="flex flex-col items-start w-full">
              <h3 className="mb-3 text-sm font-bold text-primary-900 tracking-tight">
                Instructors
              </h3>
              <div className="flex flex-col gap-y-3 w-full">
                {INSTRUCTORS.map((instructor) => (
                  <div key={instructor.id} className="flex items-center gap-x-3 group">
                    <div className="w-9 h-9 rounded-full bg-primary-700 border border-border-primary overflow-hidden flex-shrink-0 shadow-xs transition-transform group-hover:scale-105">
                      <div className="w-full h-full bg-slate-400 flex items-center justify-center text-white font-semibold text-xs">
                        {instructor.name.charAt(0)}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-primary-900 transition-colors group-hover:text-primary-700 cursor-pointer">
                      {instructor.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Anchor Workspace Action Trigger */}
            <div className="flex items-center gap-x-2 mt-2 pt-2 w-full border-t border-border-primary/50 text-primary-900 font-medium">
              <button className="flex items-center gap-x-2 text-xs font-bold tracking-tight bg-transparent border-0 p-0 m-0 text-primary-900 cursor-pointer hover:text-primary-700 transition-colors">
                <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                <span>Message School</span>
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  };

  const renderHeaderNavigation = () => {
    return (
      <div className="sticky top-0 z-50 flex flex-col w-full pt-2 pb-1 bg-surface-canvas border-b border-border-subtle shadow-xs">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 md:px-12">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span
              className="transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              onClick={() => router.push('/features/course')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/features/course')}
            >
              Course
            </span>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span
              className="transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              onClick={() => router.push('/features/course/enrolled')}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && router.push('/features/course/enrolled')}
            >
              Enrolled Course
            </span>
            <ChevronRight className="w-4 h-4 text-text-secondary" />
            <span className="truncate max-w-[200px] text-primary-600">
              {course.title}
            </span>
          </div>

          <button
            className="flex items-center justify-center w-7 h-7 transition-colors shadow-sm cursor-pointer rounded-md bg-primary-800 text-white hover:bg-primary-900"
            onClick={() => router.push('/features/course/enrolled')}
            aria-label="Back to enrolled courses"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeDockTab === 'intro' && (
          <div className="flex justify-center w-full mt-0.5">
            <CourseTopSubNav
              activeTab={activeSubTab}
              onTabChange={handleSubTabChange}
            />
          </div>
        )}
      </div>
    );
  };

  const renderSinglePageSystemContent = () => {
    return (
      <div className="flex flex-col gap-y-4">
        {/* Intro Block Viewport Container */}
        <div ref={introRef} data-section-id="intro" className="scroll-mt-28">
          <CourseDetailLayout
            header={null}
            subNavigation={null}
            mediaViewer={<MediaViewer items={MOCK_MEDIA_ITEMS} />}
            engagementPanel={
              <EngagementPanel
                providerName={course.provider}
                subtitle="Department of Biological Sciences • Course Intro"
                hashtags={['#Biology', '#Science', '#LabWork', '#Haramaya']}
                likeCount="25K"
                commentCount="5K"
                shareCount="1.2K"
                comments={MOCK_COMMENTS}
              />
            }
          />
        </div>

        {/* Blueprint-accurate reconstructed information segment view */}
        {renderBlueprintAboutSection()}
        
        {/* Supporting continuous informational slots trailing down the scroll sandbox */}
        {renderGenericFallbackSection('related', relatedRef, 'Related Courses', 'Explore parallel biological workflows, genetics architecture models, biochemistry parameters, and alternative Delta Labs technical tracks.')}
        
        {renderGenericFallbackSection('reviews', reviewsRef, 'Reviews & Rating', 'High-fidelity workspace analytical dashboard processing historical assessment metrics left by verified campus student cohorts.')}
        
        {renderGenericFallbackSection('prerequisites', prerequisitesRef, 'Prerequisites & Requirements', 'Requires foundational familiarity with core scientific method vectors, basic computer processing setups, and compilation terminal environments.')}
        
        {renderGenericFallbackSection('analysis', analysisRef, 'Course Analysis', 'Real-time performance distributions and comparative analytical score metrics calculated across global study cohorts.')}
        
        {renderGenericFallbackSection('tutor', tutorRef, 'Hire Tutor', 'Request dedicated technical review tracking hours directly under accredited engineering and pedagogical specialists.')}
      </div>
    );
  };

  const renderDockedView = () => {
    switch (activeDockTab) {
      case 'intro':
        return renderSinglePageSystemContent();
      case 'qa':
        return <MyQuestionsPage />;
      case 'exercise':
        return <ExerciseTestView />;
      case 'summary':
        return <FastSummaryView />;
      case 'score':
        return <ScoreView />;
      case 'supplement':
        return <SupplementView />;
      case 'resources':
        return <ResourceManagementView />;
      case 'roadmap':
        return <RoadmapView />;
      case 'community':
        return <CommunityView />;
      default:
        return renderSinglePageSystemContent();
    }
  };

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-surface-canvas">
      {/* Absolute Persistent Sticky Sub-Navigation Header */}
      {renderHeaderNavigation()}

      {/* Main Fluid Scroll Container Layer */}
      <div className="flex-1 overflow-y-auto pb-24 max-w-7xl mx-auto w-full pt-4">
        {renderDockedView()}
      </div>

      {/* Global Tab Command Control Deck */}
      <CourseBottomDock
        activeTab={activeDockTab}
        onTabChange={setActiveDockTab}
      />
    </div>
  );
};

CourseDetailView.displayName = 'CourseDetailView';

export default CourseDetailView;