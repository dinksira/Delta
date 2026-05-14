/**
 * SettingsView
 * A critical and creative settings page for organizing user preferences and account switching.
 *
 * @example
 * ```tsx
 * <SettingsView />
 * ```
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  User, 
  Lock, 
  Bell, 
  Globe, 
  Shield, 
  Moon, 
  LogOut, 
  Users,
  CheckCircle2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { BackButton, Card, CardContent, Typography, Button, Input, Field } from '@/components/theme';
import { useAuthSession } from '@/contexts/AuthSession_Context';
import { useProfile } from '@/modules/Profile/hooks/useProfile';
import { loadUsers, saveUsers } from '@/modules/Auth/api/mockAuthStore';
import type { AuthenticatedUser, AccountHistoryItem } from '@/modules/Auth/types/auth';
import { apiClient } from '@/lib/apiClient';
import { AUTH_SESSION_COOKIE } from '@/lib/authSession';
import { cx } from '@/components/theme/utils';

import { useThemeContext } from '@/contexts/Theme_Context';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, description, children }) => (
  <div className="flex flex-col gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      <p className="text-sm text-text-secondary">{description}</p>
    </div>
    <Card className="overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-sm">
      <CardContent className="p-0 divide-y divide-border-default">
        {children}
      </CardContent>
    </Card>
  </div>
);

interface SettingsRowProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  onClick?: () => void;
  action?: React.ReactNode;
  danger?: boolean;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ icon: Icon, title, description, onClick, action, danger }) => (
  <div 
    className={cx(
      'group flex items-center justify-between gap-4 p-4 transition-colors',
      onClick ? 'cursor-pointer hover:bg-surface-muted/50' : ''
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-4">
      <div className={cx(
        'flex size-10 items-center justify-center rounded-xl transition-colors',
        danger ? 'bg-error-50 text-error-500 group-hover:bg-error-100' : 'bg-surface-muted text-text-secondary group-hover:bg-surface-default group-hover:text-primary-600'
      )}>
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={cx('text-sm font-semibold', danger ? 'text-error-600' : 'text-text-primary')}>{title}</span>
        {description && <p className="text-xs text-text-secondary">{description}</p>}
      </div>
    </div>
    <div className="flex items-center gap-3">
      {action}
      {onClick && <ChevronRight className="size-4 text-text-disabled group-hover:text-text-secondary" />}
    </div>
  </div>
);

const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onToggle();
    }}
    className={cx(
      'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
      enabled ? 'bg-primary-600' : 'bg-slate-200'
    )}
  >
    <span
      className={cx(
        'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
        enabled ? 'translate-x-5' : 'translate-x-0'
      )}
    />
  </button>
);

// ============================================================================
// COMPONENT
// ============================================================================

export const SettingsView: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'general' | 'account' | 'security') || 'general';
  
  const { session, establishSession, clearSession } = useAuthSession();
  const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
  const { mode, toggleMode } = useThemeContext();
  const [activeTab, setActiveTab] = useState<'general' | 'account' | 'security'>(initialTab);

  // Account Switching State
  const [accounts, setAccounts] = useState<AuthenticatedUser[]>([]);

  useEffect(() => {
    if (activeTab === 'account' && session) {
      // 1. Get history from localStorage
      const rawHistory = localStorage.getItem('dl.auth.account_history.v1');
      let history: AccountHistoryItem[] = [];
      try {
        if (rawHistory) history = JSON.parse(rawHistory);
      } catch { /* ignore */ }

      // 2. Ensure current session user is in history with real token
      const current = session.user;
      const exists = history.some(h => h.user?.id === current.id);
      
      if (!exists && session.accessToken) {
        history.push({
          user: current,
          accessToken: session.accessToken,
          expiresAt: session.expiresAt || (Date.now() + 24 * 60 * 60 * 1000)
        });
        localStorage.setItem('dl.auth.account_history.v1', JSON.stringify(history));
      }

      setAccounts(history.map(h => h.user).filter((u): u is AuthenticatedUser => !!u));
    }
  }, [activeTab, session]);

  const handleSwitchAccount = (user: AuthenticatedUser) => {
    if (user.id === session?.user.id) return;
    
    // Find the real token in history
    const rawHistory = localStorage.getItem('dl.auth.account_history.v1');
    if (rawHistory) {
      try {
        const history: AccountHistoryItem[] = JSON.parse(rawHistory);
        const account = history.find((h) => h.user?.id === user.id);
        if (account?.accessToken) {
          establishSession({
            accessToken: account.accessToken,
            expiresAt: account.expiresAt,
            user: account.user
          });
          router.refresh();
          return;
        }
      } catch { /* ignore */ }
    }

    // Fallback if no real token found (shouldn't happen with new logic)
    establishSession({
      accessToken: `mock_token_${user.id}`,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      user
    });
    router.refresh();
  };

  const handleAddAccount = () => {
    router.push('/?auth=login');
  };

  const handleDeleteAccount = async () => {
    if (!profile) return;
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // 1. Try real backend deletion
        await apiClient.delete('/v1/me/profile');
      } catch (error) {
        console.warn('Backend deletion failed, falling back to mock store:', error);
      } finally {
        // 2. Always clean up mock store for demo resilience
        const users = loadUsers();
        const filtered = users.filter(u => u.id !== profile.id && u.username !== profile.username);
        saveUsers(filtered);
        
        // 3. Complete logout
        await handleLogout();
      }
    }
  };

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordFormOpen, setIsPasswordFormOpen] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handlePasswordChange = async () => {
    // 1. Basic matching check
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' });
      return;
    }

    // 2. Frontend Security Policy Check (Matches backend app/core/security.py)
    const pass = passwordData.newPassword;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;':",./<>?]/.test(pass);
    
    if (pass.length < 10) {
      setPasswordStatus({ type: 'error', message: 'Password must be at least 10 characters long.' });
      return;
    }
    if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setPasswordStatus({ 
        type: 'error', 
        message: 'Password must include uppercase, lowercase, numbers, and special characters.' 
      });
      return;
    }
    
    setPasswordStatus(null);
    setIsSavingPassword(true);

    try {
      // 3. Try real backend
      await apiClient.patch('/v1/me/password', {
        json: {
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword,
        }
      });
      setPasswordStatus({ type: 'success', message: 'Password updated successfully!' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setIsPasswordFormOpen(false), 2000);
    } catch (error: unknown) {
      console.warn('Backend password change failed:', error);
      
      // Extract specific validation message if available
      let errorMessage = error instanceof Error ? error.message : 'Failed to update password';
      const apiErr = error as { details?: { details?: Array<{ msg: string }> }; status?: number };
      if (apiErr.details?.details && Array.isArray(apiErr.details.details)) {
        const firstError = apiErr.details.details[0];
        if (firstError?.msg) {
          errorMessage = firstError.msg;
        }
      }

      // 4. Mock Fallback (only if not a validation error)
      if (profile && apiErr.status !== 400) {
        const users = loadUsers();
        const user = users.find(u => u.id === profile.id);
        if (user && user.password === passwordData.currentPassword) {
          const next = users.map(u => u.id === profile.id ? { ...u, password: passwordData.newPassword } : u);
          saveUsers(next);
          setPasswordStatus({ type: 'success', message: 'Password updated (mock store)!' });
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
          setTimeout(() => setIsPasswordFormOpen(false), 2000);
          setIsSavingPassword(false);
          return;
        }
      }
      
      setPasswordStatus({ type: 'error', message: errorMessage });
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
  });

  // Preferences State
  const [notifications, setNotifications] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('dl-notifications') !== 'false';
  });

  const [language, setLanguage] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('dl-language') || 'en';
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile(formData);
      // Optional: show a success toast or notification
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleToggleNotifications = () => {
    const next = !notifications;
    setNotifications(next);
    localStorage.setItem('dl-notifications', String(next));
  };

  const handleLanguageChange = () => {
    const next = language === 'en' ? 'es' : 'en'; // Simple toggle for demo
    setLanguage(next);
    localStorage.setItem('dl-language', next);
  };

  const handleLogout = async () => {
    try {
      await apiClient.post('/v1/auth/logout').catch(() => {});
    } finally {
      // 2. Always clear local session and history
      localStorage.removeItem('dl.auth.account_history.v1');
      clearSession();
      document.cookie = `${AUTH_SESSION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
      router.replace('/');
      router.refresh();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <BackButton onClick={() => router.back()} label="Back" />
        <Typography variant="h1" className="text-3xl font-extrabold tracking-tight">Settings</Typography>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1">
          <nav className="flex flex-col gap-1">
            {(['general', 'account', 'security'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cx(
                  'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all',
                  activeTab === tab 
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20' 
                    : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                )}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-10 lg:col-span-3">
          {activeTab === 'general' && (
            <>
              <SettingsSection title="Personal Information" description="Update your public profile and contact details.">
                <div className="p-4 flex flex-col gap-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Full Name">
                      <Input 
                        value={formData.fullName} 
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="Your name" 
                      />
                    </Field>
                    <Field label="Bio">
                      <Input 
                        value={formData.bio} 
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        placeholder="Tell us about yourself" 
                      />
                    </Field>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      className="w-full sm:w-fit" 
                      onClick={handleSaveProfile}
                      disabled={isProfileLoading}
                    >
                      {isProfileLoading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="size-4 animate-spin" />
                          <span>Saving...</span>
                        </div>
                      ) : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </SettingsSection>

              <SettingsSection title="Preferences" description="Customize your Delta Labs experience.">
                <SettingsRow 
                  icon={Moon} 
                  title="Dark Mode" 
                  description="Use dark theme across the application" 
                  action={<Toggle enabled={mode === 'dark'} onToggle={toggleMode} />}
                />
                <SettingsRow 
                  icon={Bell} 
                  title="Notifications" 
                  description="Manage email and push alerts" 
                  action={<Toggle enabled={notifications} onToggle={handleToggleNotifications} />}
                />
                <SettingsRow 
                  icon={Globe} 
                  title="Language" 
                  description="Set your preferred interface language" 
                  action={
                    <button 
                      onClick={handleLanguageChange}
                      className="text-xs font-semibold text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full transition-colors hover:bg-primary-100"
                    >
                      {language === 'en' ? 'English (US)' : 'Español (ES)'}
                    </button>
                  }
                />
              </SettingsSection>
            </>
          )}

          {activeTab === 'account' && (
            <>
              <SettingsSection title="Switch Account" description="Access other profiles associated with your session.">
                {accounts.map((acc) => (
                  <SettingsRow 
                    key={acc.id}
                    icon={Users}
                    title={acc.fullName || acc.username}
                    description={acc.email}
                    action={acc.id === session?.user.id ? <CheckCircle2 className="size-5 text-success-500" /> : null}
                    onClick={() => handleSwitchAccount(acc)}
                  />
                ))}
                <SettingsRow 
                  icon={User}
                  title="Add another account"
                  onClick={handleAddAccount}
                />
              </SettingsSection>

              <SettingsSection title="Account Management" description="Dangerous actions for your account.">
                <SettingsRow 
                  icon={LogOut} 
                  title="Sign out of all devices" 
                  onClick={handleLogout}
                />
                <SettingsRow 
                  icon={Shield} 
                  title="Delete Account" 
                  description="Permanently remove all your data" 
                  danger
                  onClick={handleDeleteAccount}
                />
              </SettingsSection>
            </>
          )}

          {activeTab === 'security' && (
            <SettingsSection title="Security" description="Protect your account from unauthorized access.">
              <div className="flex flex-col">
                <SettingsRow 
                  icon={Lock} 
                  title="Change Password" 
                  description="Update your secret credentials" 
                  onClick={() => setIsPasswordFormOpen(!isPasswordFormOpen)}
                />
                {isPasswordFormOpen && (
                  <div className="border-t border-border-default bg-surface-muted/30 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    {passwordStatus && (
                      <div className={cx(
                        'p-3 rounded-lg text-xs font-medium',
                        passwordStatus.type === 'success' ? 'bg-success-50 text-success-700 border border-success-200' : 'bg-error-50 text-error-700 border border-error-200'
                      )}>
                        {passwordStatus.message}
                      </div>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                      <Field label="Current Password">
                        <Input 
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="••••••••"
                        />
                      </Field>
                      <Field label="New Password">
                        <Input 
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Min. 10 characters"
                        />
                      </Field>
                      <Field label="Confirm New Password">
                        <Input 
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Re-type new password"
                        />
                      </Field>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="secondary" size="sm" onClick={() => setIsPasswordFormOpen(false)}>Cancel</Button>
                      <Button size="sm" onClick={handlePasswordChange} disabled={isSavingPassword}>
                        {isSavingPassword ? <Loader2 className="size-4 animate-spin" /> : 'Update Password'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <SettingsRow 
                icon={Shield} 
                title="Two-Factor Authentication" 
                description="Add an extra layer of protection" 
                action={<span className="text-[10px] font-bold uppercase tracking-widest text-error-500 bg-error-50 px-2 py-0.5 rounded-full">Disabled</span>}
                onClick={() => {}}
              />
            </SettingsSection>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default SettingsView;
