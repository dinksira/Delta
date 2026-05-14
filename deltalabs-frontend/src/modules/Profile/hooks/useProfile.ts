/**
 * useProfile
 * Custom hook for managing user profile data and operations.
 *
 * @example
 * ```tsx
 * const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/apiClient';
import type { AuthenticatedUser } from '@/modules/Auth/types/auth';
import { 
  loadUsers, 
  toPublicUser, 
  findUserByIdentifier, 
  saveUsers 
} from '@/modules/Auth/api/mockAuthStore';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UseProfileReturn {
  profile: AuthenticatedUser | null;
  isLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (data: { fullName?: string; bio?: string }) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Try real API
      const response = await apiClient.get<AuthenticatedUser>('/v1/me/profile');
      setProfile(response);
    } catch (err: any) {
      // 2. Fallback to mock store
      const mockUsers = loadUsers();
      if (mockUsers.length > 0) {
        // Just pick the first mock user for the demo profile
        setProfile(toPublicUser(mockUsers[0]));
      } else {
        setError(err?.response?.data?.message || err?.message || 'Failed to fetch profile');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: { fullName?: string; bio?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.patch<AuthenticatedUser>('/v1/me/profile', {
        json: {
          full_name: data.fullName,
          bio: data.bio,
        }
      });
      setProfile(response);
    } catch (err: any) {
      // Mock fallback: Update local storage
      if (profile) {
        const users = loadUsers();
        const idx = users.findIndex(u => u.id === profile.id || u.username === profile.username);
        if (idx !== -1) {
          const names = (data.fullName || "").trim().split(/\s+/);
          users[idx] = {
            ...users[idx],
            firstName: names[0] || users[idx].firstName,
            lastName: names.slice(1).join(" ") || users[idx].lastName,
            bio: data.bio ?? users[idx].bio,
          } as any;
          saveUsers(users);
          setProfile(toPublicUser(users[idx]));
        }
      }
      // Don't throw if it's just a connection error in dev
      if (err.name !== 'ApiError') throw err;
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  const uploadAvatar = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await apiClient.post<AuthenticatedUser>('/v1/me/avatar', {
        body: formData,
      });
      setProfile(response);
    } catch (err: any) {
      // Mock fallback: create a local object URL
      if (profile) {
        const localUrl = URL.createObjectURL(file);
        const updated = { ...profile, avatarUrl: localUrl };
        setProfile(updated);
        
        // Also persist to mock store if possible
        const users = loadUsers();
        const idx = users.findIndex(u => u.id === profile.id || u.username === profile.username);
        if (idx !== -1) {
          users[idx] = { ...users[idx], avatarUrl: localUrl } as any;
          saveUsers(users);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    uploadAvatar,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useProfile;
