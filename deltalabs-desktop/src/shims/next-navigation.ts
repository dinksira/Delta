/**
 * Navigation Shim
 * Shim to replace next/navigation in the desktop build environment.
 * Tracks client-side hash change events to trigger React re-renders and handles dynamic route params.
 *
 * @example
 * ```ts
 * const router = useRouter();
 * router.push('/dashboard');
 * const { id } = useParams();
 * ```
 */

import { useState, useEffect } from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface NavigateOptions {
  scroll?: boolean;
}

export interface RouterInstance {
  back: () => void;
  forward: () => void;
  refresh: () => void;
  push: (href: string, options?: NavigateOptions) => void;
  replace: (href: string, options?: NavigateOptions) => void;
  prefetch: (href: string) => void;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to retrieve the current router instance.
 *
 * @returns {RouterInstance} Custom desktop router shim.
 */
export function useRouter(): RouterInstance {
  const routerInstance: RouterInstance = {
    back: (): void => {
      window.history.back();
    },
    forward: (): void => {
      window.history.forward();
    },
    refresh: (): void => {
      window.location.reload();
    },
    push: (href: string): void => {
      window.location.hash = href;
    },
    replace: (href: string): void => {
      window.history.replaceState(null, '', `#${href}`);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    prefetch: (): void => {
      // No-op for desktop client shim
    }
  };

  return routerInstance;
}

/**
 * Hook to retrieve the current clean path name, listening to hashchange.
 *
 * @returns {string} Current hash path name.
 */
export function usePathname(): string {
  const [pathname, setPathname] = useState<string>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const cleanHash = hash.split('?')[0] || '#/';
    return cleanHash.replace(/^#/, '') || '/';
  });

  useEffect((): () => void => {
    const handleHashChange = (): void => {
      const hash = window.location.hash;
      const cleanHash = hash.split('?')[0] || '#/';
      setPathname(cleanHash.replace(/^#/, '') || '/');
    };

    window.addEventListener('hashchange', handleHashChange);
    return (): void => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return pathname;
}

/**
 * Hook to retrieve search parameters, listening to hashchange.
 *
 * @returns {URLSearchParams} Search parameters object.
 */
export function useSearchParams(): URLSearchParams {
  const [searchParams, setSearchParams] = useState<URLSearchParams>(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    const queryIndex = hash.indexOf('?');
    if (queryIndex === -1) {
      return new URLSearchParams();
    }
    return new URLSearchParams(hash.substring(queryIndex + 1));
  });

  useEffect((): () => void => {
    const handleHashChange = (): void => {
      const hash = window.location.hash;
      const queryIndex = hash.indexOf('?');
      if (queryIndex === -1) {
        setSearchParams(new URLSearchParams());
      } else {
        setSearchParams(new URLSearchParams(hash.substring(queryIndex + 1)));
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return (): void => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  return searchParams;
}

/**
 * Hook to retrieve route parameters parsed from the clean pathname.
 *
 * @returns {Record<string, string | string[]>} Parameter dictionary.
 */
export function useParams(): Record<string, string | string[]> {
  const pathname = usePathname();
  const parts = pathname.split('/').filter(Boolean);
  const params: Record<string, string | string[]> = {};

  if (parts.includes('workspace') && parts.indexOf('workspace') < parts.length - 1) {
    params.workspaceId = parts[parts.indexOf('workspace') + 1]!;
  }
  if (parts.includes('class') && parts.indexOf('class') < parts.length - 1) {
    params.classId = parts[parts.indexOf('class') + 1]!;
  }

  // Fallback: extract the last segment of the path as "id" if dynamic
  const lastPart = parts[parts.length - 1];
  if (lastPart && (lastPart.length > 5 || /^\d+$/.test(lastPart))) {
    params.id = lastPart;
  }

  return params;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  useRouter,
  usePathname,
  useSearchParams,
  useParams
};
