/**
 * Course Context
 * Manages the state of the user's enrolled courses, online status, and Q&A bookmarks.
 */

"use client";

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import type { CourseState, CourseContextValue, Course } from '../types/courseTypes';

// ============================================================================
// ACTIONS
// ============================================================================

type CourseAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ENROLLED_COURSES'; payload: Course[] }
  | { type: 'SET_USER_STATUS'; payload: boolean }
  | { type: 'TOGGLE_BOOKMARK'; payload: string };

// ============================================================================
// REDUCER
// ============================================================================

const courseReducer = (state: CourseState, action: CourseAction): CourseState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_ENROLLED_COURSES':
      return { ...state, enrolledCourses: action.payload };
    case 'SET_USER_STATUS':
      return { ...state, currentUserStatus: action.payload };
    case 'TOGGLE_BOOKMARK':
      // This is a naive implementation for demo purposes.
      return { ...state };
    default:
      return state;
  }
};

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: CourseState = {
  enrolledCourses: [],
  bookmarkedQuestions: [],
  currentUserStatus: true,
  isLoading: false,
  error: null,
};

// ============================================================================
// CONTEXT
// ============================================================================

const CourseContext = createContext<CourseContextValue | undefined>(undefined);

// ============================================================================
// PROVIDER
// ============================================================================

interface CourseProviderProps {
  children: ReactNode;
}

export function CourseProvider({ children }: CourseProviderProps) {
  const [state, dispatch] = useReducer(courseReducer, initialState);

  const fetchEnrolledCourses = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Mock API call
      setTimeout(() => {
        dispatch({ 
          type: 'SET_ENROLLED_COURSES', 
          payload: [
            {
              id: '1',
              title: 'Introduction to Delta Labs Systems',
              provider: 'Delta Academy',
              progress: 60,
              status: 'in_progress',
              tags: ['System', 'Basics']
            }
          ] 
        });
        dispatch({ type: 'SET_LOADING', payload: false });
      }, 500);
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to fetch courses' });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const toggleUserStatus = useCallback((status: boolean) => {
    dispatch({ type: 'SET_USER_STATUS', payload: status });
  }, []);

  const toggleQuestionBookmark = useCallback((questionId: string) => {
    dispatch({ type: 'TOGGLE_BOOKMARK', payload: questionId });
  }, []);

  const contextValue: CourseContextValue = {
    ...state,
    fetchEnrolledCourses,
    toggleUserStatus,
    toggleQuestionBookmark,
  };

  return (
    <CourseContext.Provider value={contextValue}>
      {children}
    </CourseContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useCourse(): CourseContextValue {
  const context = useContext(CourseContext);
  if (context === undefined) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}

export default CourseContext;
