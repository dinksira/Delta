/**
 * App
 * The root component of the Delta Labs Desktop Client.
 * Wraps the app in the global Query, Redux, Locale, Auth, and Theme context providers,
 * and renders a client-side hash-based routing engine matching Next.js page mappings.
 *
 * @example
 * ```tsx
 * <App />
 * ```
 */

import React from 'react';
import { Provider } from 'react-redux';

import { usePathname } from '@/shims/next-navigation';
import { QueryProvider } from '@/lib/QueryProvider';
import { LocaleProvider } from '@/i18n/LocaleContext';
import { AuthSessionProvider } from '@/contexts/AuthSession_Context';
import { ThemeProvider } from '@/contexts/Theme_Context';
import { AppShell } from '@/components/navigation/AppShell';
import { PublicLayoutShell } from '@/components/navigation/PublicLayoutShell';
import { GlobalAuthPendingBar } from '@/components/system/GlobalAuthPendingBar';
import { store } from '@/store';

// Import Views
import { LandingPageView } from '@/modules/Feed/views/LandingPageView';
import { ExploreAllView } from '@/modules/Feed/views/ExploreAllView';
import { LoginPageView } from '@/modules/Auth/views/LoginPageView';
import { SignupPageView } from '@/modules/Auth/views/SignupPageView';
import { DashboardPageView } from '@/modules/Dashboard/views/DashboardPageView';
import { ProfileView } from '@/modules/Profile/views/ProfileView';
import { SettingsView } from '@/modules/Settings/views/SettingsView';
import { FeaturesPageView } from '@/modules/Features/views/FeaturesPageView';
import { SchoolHomeView } from '@/modules/School/views/SchoolHomeView';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface RouteViewResult {
  type: 'public' | 'app';
  element: React.ReactNode;
}

// ============================================================================
// ROUTING ENGINE
// ============================================================================

/**
 * Resolves pathname to a view element and layout type.
 *
 * @param {string} path - The clean pathname from hash routing.
 * @returns {RouteViewResult} Layout classification and React view component.
 */
const getRouteView = (path: string): RouteViewResult => {
  switch (path) {
    case '/':
    case '/landing':
    case '/feed':
      return { type: 'public', element: <LandingPageView /> };
    case '/explore':
      return { type: 'public', element: <ExploreAllView /> };
    case '/login':
      return { type: 'public', element: <LoginPageView /> };
    case '/signup':
      return { type: 'public', element: <SignupPageView /> };
    case '/dashboard':
      return { type: 'app', element: <DashboardPageView /> };
    case '/profile':
      return { type: 'app', element: <ProfileView /> };
    case '/settings':
      return { type: 'app', element: <SettingsView /> };
    case '/features/school':
      return { type: 'app', element: <SchoolHomeView /> };
    default:
      if (path.startsWith('/features')) {
        return { type: 'app', element: <FeaturesPageView /> };
      }
      return { type: 'public', element: <LandingPageView /> };
  }
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * AppContent resolves pathnames and wraps them in their correct layout shells.
 */
const AppContent: React.FC = () => {
  const pathname = usePathname();
  const { type, element } = getRouteView(pathname);

  if (type === 'app') {
    return <AppShell>{element}</AppShell>;
  }

  return (
    <PublicLayoutShell serverAuthenticated={false}>
      {element}
    </PublicLayoutShell>
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
