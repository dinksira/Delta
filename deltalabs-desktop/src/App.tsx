/**
 * App
 * The root component of the Delta Labs Desktop Client.
 * Wraps the app in the global Query, Redux, Locale, Auth, and Theme context providers,
 * and renders a client-side hash-based routing engine matching Next.js page mappings.
 *
 * Routes are declared as a pattern table (`:param` segments) mirroring the
 * frontend `src/app/(app)` tree so mirrored modules resolve identically.
 *
 * @example
 * ```tsx
 * <App />
 * ```
 */

import React, { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

import { usePathname, useRouter, useSearchParams } from '@/shims/next-navigation';
import { QueryProvider } from '@/lib/QueryProvider';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { AuthSessionProvider } from '@/contexts/AuthSession_Context';
import { ThemeProvider } from '@/contexts/Theme_Context';
import { AppShell } from '@/components/navigation/AppShell';
import { PublicLayoutShell } from '@/components/navigation/PublicLayoutShell';
import { GlobalAuthPendingBar } from '@/components/system/GlobalAuthPendingBar';
import { NativeTitleBar } from '@/components/atoms/NativeTitleBar';
import type { ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { getWorkspaceTabId, preserveWorkspaceTabId } from '@/modules/Features/featureWorkspaceTabs';
import { isOfferStatus, isOfferView } from '@/modules/School/types/offers';
import { isMarketplaceView } from '@/modules/School/types/marketplace';
import { store } from '@/store';

// Import Views
import { LandingPageView } from '@/modules/Feed/views/LandingPageView';
import { ExploreAllView } from '@/modules/Feed/views/ExploreAllView';
import { CustomFeedView } from '@/modules/Feed/views/CustomFeedView';
import { FilterResultsView } from '@/modules/Feed/views/FilterResultsView';
import { LoginPageView } from '@/modules/Auth/views/LoginPageView';
import { SignupPageView } from '@/modules/Auth/views/SignupPageView';
import { DashboardPageView } from '@/modules/Dashboard/views/DashboardPageView';
import { ProfileView } from '@/modules/Profile/views/ProfileView';
import { SettingsView } from '@/modules/Settings/views/SettingsView';
import { FeaturesPageView } from '@/modules/Features/views/FeaturesPageView';

// Competition module views
import {
  ActiveCompetitionPage,
  ChampionshipPage,
  ChampionshipStageDuelPage,
  CompetitionDetailPage,
  CreateBattleTopicPage,
  CreateChampionshipPage,
  CreateLiveDuelPage,
  GameDetailPage,
  GamesPage,
  GameStageDuelPage,
  LiveDuelRoomPage,
  LiveDuelsPage,
  PublicCompetitionPage,
  TopicBattleDuelPage,
} from '@/modules/Competition/views';

// Course module views
import { CourseProvider } from '@/modules/Course';
import {
  CartView,
  CourseHomeView,
  CourseMessageView,
  EnrolledCoursesPageView,
  ExerciseTestView,
  FastSummaryView,
  MyResourcesView,
  NotificationView,
  OfflineCoursesView,
  QuestionDetailView,
  RecentActivityView,
  ResourceManagementView,
  RoadmapDetailView,
  RoadmapSuperView,
  RoadmapView,
  ScoreView,
  SponsorView,
  SuperCourseView,
  SupplementView,
  UnrolledCoursesView,
  WishlistView,
} from '@/modules/Course/views';

// School module views
import { SchoolHomeView } from '@/modules/School/views/SchoolHomeView';
import { SchoolArchiveView } from '@/modules/School/views/SchoolArchiveView';
import { SchoolCreatePageView } from '@/modules/School/views/SchoolCreatePageView';
import { SchoolMarketplaceView } from '@/modules/School/views/SchoolMarketplaceView';
import { SchoolMarketplaceListingView } from '@/modules/School/views/SchoolMarketplaceListingView';
import { SchoolOffersView } from '@/modules/School/views/SchoolOffersView';
import { SchoolWorkspaceDetailView } from '@/modules/School/views/SchoolWorkspaceDetailView';
import { SchoolClassDetailView } from '@/modules/School/views/SchoolClassDetailView';
import { SchoolCourseDetailView } from '@/modules/School/views/SchoolCourseDetailView';
import { SchoolStudentDetailView } from '@/modules/School/views/SchoolStudentDetailView';
import { SchoolParentDetailView } from '@/modules/School/views/SchoolParentDetailView';
import { ClassSessionMeetView } from '@/modules/School/class/ClassSessionMeetView';
import { CourseBottomNav } from '@/modules/School/course/CourseBottomNav';
import { CourseWorkspaceRouteLayout } from '@/modules/School/course/CourseWorkspaceRouteLayout';
import { FastSummaryWorkspaceView } from '@/modules/School/course/summary/FastSummaryWorkspaceView';
import { ExerciseCreationWorkspaceView } from '@/modules/School/course/exercise/ExerciseCreationWorkspaceView';
import { SchoolDepartmentWorkspaceView } from '@/modules/School/department/SchoolDepartmentWorkspaceView';
import { ManagementTableEditorView } from '@/modules/School/managementTable/ManagementTableEditorView';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

type RouteParams = Record<string, string>;

interface RouteDefinition {
  path: string;
  type: 'public' | 'app';
  render: (params: RouteParams) => React.ReactNode;
}

interface RouteMatchResult {
  type: 'public' | 'app';
  element: React.ReactNode;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Wraps a Course module view in its required provider. */
const withCourseProvider = (node: React.ReactNode): React.ReactNode => (
  <CourseProvider>{node}</CourseProvider>
);

// ============================================================================
// ROUTE WRAPPERS
// ============================================================================

/** Resource-sidebar views keep their active tab in local page state (mirrors web pages). */
const useSidebarTabState = (
  initial: ResourceSidebarTabId,
): [ResourceSidebarTabId, (tabId: ResourceSidebarTabId) => void] =>
  useState<ResourceSidebarTabId>(initial);

const CartRoute: React.FC = () => {
  const [activeSidebarTab, onSidebarTabChange] = useSidebarTabState('cart');
  return <CartView activeSidebarTab={activeSidebarTab} onSidebarTabChange={onSidebarTabChange} />;
};

const MyResourcesRoute: React.FC = () => {
  const [activeSidebarTab, onSidebarTabChange] = useSidebarTabState('resources');
  return (
    <MyResourcesView activeSidebarTab={activeSidebarTab} onSidebarTabChange={onSidebarTabChange} />
  );
};

const NotificationRoute: React.FC = () => {
  const [activeSidebarTab, onSidebarTabChange] = useSidebarTabState('notification');
  return (
    <NotificationView activeSidebarTab={activeSidebarTab} onSidebarTabChange={onSidebarTabChange} />
  );
};

const QuestionDetailRoute: React.FC = () => {
  const router = useRouter();
  return <QuestionDetailView questionId="" onBack={() => router.back()} />;
};

/** Offers workspace requires explicit `?status=&view=`; redirects to defaults when missing. */
const SchoolOffersRoute: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? undefined;
  const view = searchParams.get('view') ?? undefined;
  const isValid = isOfferStatus(status) && isOfferView(view);

  useEffect(() => {
    if (isValid) return;
    const destination = preserveWorkspaceTabId(
      '/features/school/offers?status=requested&view=received',
      getWorkspaceTabId(searchParams),
    );
    router.replace(destination);
  }, [isValid, router, searchParams]);

  if (!isValid) return null;
  return <SchoolOffersView status={status} view={view} />;
};

/** New-exercise workspace reads the optional `?kind=test|exercise` query. */
const ExerciseNewRoute: React.FC<{ schoolId: string; courseItemId: string }> = ({
  schoolId,
  courseItemId,
}) => {
  const searchParams = useSearchParams();
  const kind = searchParams.get('kind') === 'test' ? 'test' : 'exercise';
  return (
    <ExerciseCreationWorkspaceView schoolId={schoolId} courseItemId={courseItemId} kind={kind} />
  );
};

/** Marketplace requires explicit `?view=`; redirects to the community default when missing. */
const SchoolMarketplaceRoute: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get('view') ?? undefined;
  const isValid = isMarketplaceView(view);

  useEffect(() => {
    if (isValid) return;
    const destination = preserveWorkspaceTabId(
      '/features/school/marketplace?view=community',
      getWorkspaceTabId(searchParams),
    );
    router.replace(destination);
  }, [isValid, router, searchParams]);

  if (!isValid) return null;
  return <SchoolMarketplaceView view={view} />;
};

/**
 * Route table mirroring `deltalabs-frontend/src/app/(app)`.
 * Static segments must be declared before dynamic ones of the same length.
 */
const ROUTES: readonly RouteDefinition[] = [
  // ===== Public / shell routes =====
  { path: '/', type: 'public', render: () => <LandingPageView /> },
  { path: '/landing', type: 'public', render: () => <LandingPageView /> },
  { path: '/feed', type: 'public', render: () => <LandingPageView /> },
  { path: '/feed/filter', type: 'public', render: () => <FilterResultsView /> },
  { path: '/custom', type: 'public', render: () => <CustomFeedView /> },
  { path: '/explore', type: 'public', render: () => <ExploreAllView /> },
  { path: '/login', type: 'public', render: () => <LoginPageView /> },
  { path: '/signup', type: 'public', render: () => <SignupPageView /> },
  { path: '/dashboard', type: 'app', render: () => <DashboardPageView /> },
  { path: '/profile', type: 'app', render: () => <ProfileView /> },
  { path: '/settings', type: 'app', render: () => <SettingsView /> },

  // ===== Competitions =====
  { path: '/features/competitions', type: 'app', render: () => <PublicCompetitionPage /> },
  { path: '/features/competitions/list', type: 'app', render: () => <ActiveCompetitionPage /> },
  { path: '/features/competitions/topic-battles', type: 'app', render: () => <ActiveCompetitionPage /> },
  { path: '/features/competitions/host', type: 'app', render: () => <CreateBattleTopicPage /> },
  { path: '/features/competitions/battles/:id', type: 'app', render: () => <TopicBattleDuelPage /> },
  { path: '/features/competitions/live-duels', type: 'app', render: () => <LiveDuelsPage /> },
  { path: '/features/competitions/games', type: 'app', render: () => <GamesPage /> },
  { path: '/features/competitions/championship', type: 'app', render: () => <ChampionshipPage /> },
  { path: '/features/competitions/live-duels/create', type: 'app', render: () => <CreateLiveDuelPage /> },
  { path: '/features/competitions/live-duels/:id', type: 'app', render: () => <LiveDuelRoomPage /> },
  { path: '/features/competitions/games/:id', type: 'app', render: () => <GameDetailPage /> },
  { path: '/features/competitions/championship/host', type: 'app', render: () => <CreateChampionshipPage /> },
  { path: '/features/competitions/championship/stages/:id', type: 'app', render: () => <ChampionshipStageDuelPage /> },
  { path: '/features/competitions/games/:id/stages/:stageId', type: 'app', render: () => <GameStageDuelPage /> },
  { path: '/features/competitions/:id', type: 'app', render: () => <CompetitionDetailPage /> },

  // ===== Course =====
  { path: '/enrolled-courses', type: 'app', render: () => withCourseProvider(<EnrolledCoursesPageView />) },
  { path: '/features/course', type: 'app', render: () => withCourseProvider(<CourseHomeView />) },
  { path: '/features/course/cart', type: 'app', render: () => withCourseProvider(<CartRoute />) },
  { path: '/features/course/enrolled', type: 'app', render: () => withCourseProvider(<EnrolledCoursesPageView />) },
  { path: '/features/course/exercise-test', type: 'app', render: () => withCourseProvider(<ExerciseTestView />) },
  { path: '/features/course/fast-summary', type: 'app', render: () => withCourseProvider(<FastSummaryView />) },
  { path: '/features/course/message', type: 'app', render: () => withCourseProvider(<CourseMessageView />) },
  {
    path: '/features/course/my-resources',
    type: 'app',
    render: () => withCourseProvider(<MyResourcesRoute />),
  },
  {
    path: '/features/course/notification',
    type: 'app',
    render: () => withCourseProvider(<NotificationRoute />),
  },
  { path: '/features/course/offline', type: 'app', render: () => withCourseProvider(<OfflineCoursesView />) },
  {
    path: '/features/course/question-detail',
    type: 'app',
    render: () => withCourseProvider(<QuestionDetailRoute />),
  },
  { path: '/features/course/recent-activity', type: 'app', render: () => withCourseProvider(<RecentActivityView />) },
  { path: '/features/course/resource-management', type: 'app', render: () => withCourseProvider(<ResourceManagementView />) },
  { path: '/features/course/roadmap/detail', type: 'app', render: () => withCourseProvider(<RoadmapDetailView />) },
  { path: '/features/course/roadmap/super', type: 'app', render: () => withCourseProvider(<RoadmapSuperView />) },
  { path: '/features/course/roadmap', type: 'app', render: () => withCourseProvider(<RoadmapView />) },
  { path: '/features/course/score', type: 'app', render: () => withCourseProvider(<ScoreView />) },
  { path: '/features/course/super-course', type: 'app', render: () => withCourseProvider(<SuperCourseView />) },
  { path: '/features/course/supplement', type: 'app', render: () => withCourseProvider(<SupplementView />) },
  { path: '/features/course/unrolled', type: 'app', render: () => withCourseProvider(<UnrolledCoursesView />) },
  { path: '/features/course/wishlist/sponsor', type: 'app', render: () => withCourseProvider(<SponsorView />) },
  { path: '/features/course/wishlist', type: 'app', render: () => withCourseProvider(<WishlistView />) },

  // ===== School (static sections) =====
  { path: '/features/school', type: 'app', render: () => <SchoolHomeView /> },
  { path: '/features/school/archive', type: 'app', render: () => <SchoolArchiveView /> },
  { path: '/features/school/create', type: 'app', render: () => <SchoolCreatePageView /> },
  {
    path: '/features/school/marketplace',
    type: 'app',
    render: () => <SchoolMarketplaceRoute />,
  },
  {
    path: '/features/school/offers',
    type: 'app',
    render: () => <SchoolOffersRoute />,
  },
  {
    path: '/features/school/marketplace/:listingId',
    type: 'app',
    render: (p) => <SchoolMarketplaceListingView listingId={p.listingId} />,
  },

  // ===== School (workspace, parameterized) =====
  {
    path: '/features/school/:schoolId',
    type: 'app',
    render: (p) => <SchoolWorkspaceDetailView schoolId={p.schoolId} />,
  },
  {
    path: '/features/school/:schoolId/class/:classItemId',
    type: 'app',
    render: (p) => <SchoolClassDetailView schoolId={p.schoolId} classItemId={p.classItemId} />,
  },
  {
    path: '/features/school/:schoolId/class/:classItemId/session/:sessionId',
    type: 'app',
    render: (p) => (
      <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
        <ClassSessionMeetView
          schoolId={p.schoolId}
          classItemId={p.classItemId}
          sessionId={p.sessionId}
        />
      </div>
    ),
  },
  {
    path: '/features/school/:schoolId/course/:courseItemId',
    type: 'app',
    render: (p) => (
      <>
        <CourseWorkspaceRouteLayout>
          <SchoolCourseDetailView schoolId={p.schoolId} courseItemId={p.courseItemId} />
        </CourseWorkspaceRouteLayout>
        <CourseBottomNav />
      </>
    ),
  },
  {
    path: '/features/school/:schoolId/course/:courseItemId/exercises/new',
    type: 'app',
    render: (p) => (
      <ExerciseNewRoute schoolId={p.schoolId} courseItemId={p.courseItemId} />
    ),
  },
  {
    path: '/features/school/:schoolId/course/:courseItemId/exercises/:exerciseId/edit',
    type: 'app',
    render: (p) => (
      <ExerciseCreationWorkspaceView
        schoolId={p.schoolId}
        courseItemId={p.courseItemId}
        exerciseId={p.exerciseId}
      />
    ),
  },
  {
    path: '/features/school/:schoolId/course/:courseItemId/summaries/:summaryId/edit',
    type: 'app',
    render: (p) => (
      <FastSummaryWorkspaceView
        schoolId={p.schoolId}
        courseItemId={p.courseItemId}
        summaryId={p.summaryId}
      />
    ),
  },
  {
    path: '/features/school/:schoolId/department/:departmentItemId',
    type: 'app',
    render: (p) => (
      <SchoolDepartmentWorkspaceView
        schoolId={p.schoolId}
        departmentItemId={p.departmentItemId}
      />
    ),
  },
  {
    path: '/features/school/:schoolId/management-tables/:instanceId',
    type: 'app',
    render: (p) => (
      <ManagementTableEditorView schoolId={p.schoolId} instanceId={p.instanceId} />
    ),
  },
  {
    path: '/features/school/:schoolId/parent/:parentItemId',
    type: 'app',
    render: (p) => <SchoolParentDetailView schoolId={p.schoolId} parentItemId={p.parentItemId} />,
  },
  {
    path: '/features/school/:schoolId/student/:studentItemId',
    type: 'app',
    render: (p) => <SchoolStudentDetailView schoolId={p.schoolId} studentItemId={p.studentItemId} />,
  },

  // ===== Features hub + fallback =====
  { path: '/features', type: 'app', render: () => <FeaturesPageView /> },
];

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Matches a clean pathname against the route table.
 * Static segments win over dynamic ones via declaration order.
 *
 * @param {string} pathname - Clean hash pathname (e.g. `/features/school/sch_1`).
 * @returns {RouteDefinition | null} Matched route with captured params.
 */
function matchRoute(pathname: string): { route: RouteDefinition; params: RouteParams } | null {
  const pathSegments = pathname.split('/').filter(Boolean);
  for (const route of ROUTES) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== pathSegments.length) continue;
    const params: RouteParams = {};
    let matched = true;
    for (let i = 0; i < routeSegments.length; i += 1) {
      const segment = routeSegments[i];
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(pathSegments[i]);
      } else if (segment !== pathSegments[i]) {
        matched = false;
        break;
      }
    }
    if (matched) return { route, params };
  }
  return null;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AppContent resolves pathnames and wraps them in their correct layout shells.
 */
const AppContent: React.FC = () => {
  const pathname = usePathname();
  const match = matchRoute(pathname);
  const type = match?.route.type ?? 'public';
  const element = match ? (
    match.route.render(match.params)
  ) : pathname.startsWith('/features') ? (
    <FeaturesPageView />
  ) : (
    <LandingPageView />
  );

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      <NativeTitleBar />
      <div className="flex-1 overflow-hidden">
        {type === 'app' ? (
          <AppShell>{element}</AppShell>
        ) : (
          <PublicLayoutShell serverAuthenticated={false}>
            {element}
          </PublicLayoutShell>
        )}
      </div>
    </div>
  );
};

/**
 * Root App component mounting the state, auth, layout, and theme context hierarchies.
 */
export const App: React.FC = () => {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthSessionProvider>
          <GlobalAuthPendingBar />
          <ThemeProvider>
            <Provider store={store}>
              <AppContent />
            </Provider>
          </ThemeProvider>
        </AuthSessionProvider>
      </LocaleProvider>
    </QueryProvider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default App;
