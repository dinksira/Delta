/**
 * useSectionObserver
 * Observes section elements and returns the ID of the most visible section.
 *
 * @example
 * ```tsx
 * const activeSection = useSectionObserver(sectionRefs, 'intro');
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import type { CourseSubNavTabId } from '../components/intro/molecules/CourseTopSubNav';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UseSectionObserverOptions {
  rootMargin?: string;
  threshold?: number | number[];
}

export interface UseSectionObserverReturn {
  activeSection: CourseSubNavTabId;
}

// ============================================================================
// COMPONENT / HOOK
// ============================================================================

export function useSectionObserver(
  sectionRefs: Record<string, React.RefObject<HTMLDivElement>>,
  defaultSection: CourseSubNavTabId = 'intro',
  options: UseSectionObserverOptions = {}
): UseSectionObserverReturn {
  const [activeSection, setActiveSection] = useState<CourseSubNavTabId>(defaultSection);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedSectionsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    console.log('useSectionObserver RUNNING! sectionRefs keys:', Object.keys(sectionRefs));
    const { rootMargin = '-50% 0px -40% 0px', threshold = 0.2 } = options;
    const orderedIds = Object.keys(sectionRefs);

    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    observedSectionsRef.current.clear();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        console.log('IntersectionObserver entries received!', entries.length, 'entries!');
        console.log('Entries details:', entries.map(e => ({ id: e.target.getAttribute('data-section-id'), isIntersecting: e.isIntersecting })));
        const visibleIds = entries
          .filter(entry => entry.isIntersecting)
          .map(entry => entry.target.getAttribute('data-section-id') as CourseSubNavTabId)
          .filter(Boolean);

        console.log('Visible section IDs:', visibleIds);

        if (visibleIds.length > 0) {
          // Find the first visible section in our ordered list
          for (const id of orderedIds) {
            if (visibleIds.includes(id as CourseSubNavTabId)) {
              console.log('Setting active section to:', id);
              setActiveSection(id as CourseSubNavTabId);
              break;
            }
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    // Function to try to observe all sections
    const tryObserveAllSections = () => {
      let allObserved = true;
      for (const [id, ref] of Object.entries(sectionRefs)) {
        if (observedSectionsRef.current.has(id)) continue;
        console.log('Checking ref for id:', id, 'ref.current:', ref.current);
        if (ref.current) {
          ref.current.setAttribute('data-section-id', id);
          observerRef.current?.observe(ref.current);
          observedSectionsRef.current.add(id);
          console.log('Observing section:', id);
        } else {
          allObserved = false;
        }
      }
      return allObserved;
    };

    // Try initial observation
    let allObserved = tryObserveAllSections();

    // If not all observed, keep checking every 100ms until they are
    let interval: NodeJS.Timeout | undefined;
    if (!allObserved) {
      interval = setInterval(() => {
        const done = tryObserveAllSections();
        if (done && interval) {
          clearInterval(interval);
        }
      }, 100);
    }

    // Cleanup
    return () => {
      if (interval) clearInterval(interval);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [sectionRefs, options]);

  return { activeSection };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useSectionObserver;
