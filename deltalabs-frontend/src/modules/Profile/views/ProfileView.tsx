/**
 * ProfileView
 * A creative and detailed profile view for content creators.
 *
 * @example
 * ```tsx
 * <ProfileView />
 * ```
 */

'use client';

import React, { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, BookOpen, Layers, Users, Star, Settings as SettingsIcon, Camera, Loader2, Heart, Bookmark, LayoutGrid } from 'lucide-react';
import { BackButton, Card, CardContent, CardHeader, CardTitle, Typography } from '@/components/theme';
import { useProfile } from '../hooks/useProfile';
import { cx } from '@/components/theme/utils';

// ============================================================================
// CONSTANTS
// ============================================================================

const mockVideos = [
  { id: 1, title: 'Introduction to Advanced Quantum Computing', views: '2.3k', date: '2 days ago', thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=400' },
  { id: 2, title: 'Mastering React Server Components', views: '1.5k', date: '5 days ago', thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=400' },
  { id: 3, title: 'The Future of AI in Education', views: '4.1k', date: '1 week ago', thumbnail: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=400' },
];

const mockLikedVideos = [
  { id: 4, title: 'AI Ethics: A Global Perspective', views: '12k', date: '3 days ago', thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&q=80&w=400' },
  { id: 5, title: 'Building a Neural Network from Scratch', views: '8.9k', date: '1 week ago', thumbnail: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&q=80&w=400' },
];

const mockSavedVideos = [
  { id: 6, title: 'The Psychology of Design Systems', views: '5.6k', date: '2 weeks ago', thumbnail: 'https://images.unsplash.com/photo-1586717791821-3f44a563dc4c?auto=format&fit=crop&q=80&w=400' },
  { id: 7, title: 'Advanced CSS Grid Techniques', views: '3.2k', date: '1 month ago', thumbnail: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?auto=format&fit=crop&q=80&w=400' },
];

const mockCourses = [
  { id: 1, title: 'Full-Stack Neural Networks', progress: 65, category: 'AI & Data' },
  { id: 2, title: 'Generative UI with Tailwind CSS', progress: 20, category: 'Design' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ProfileView: React.FC = () => {
  const router = useRouter();
  const { profile, isLoading, uploadAvatar } = useProfile();
  const [activeTab, setActiveTab] = React.useState<'recent' | 'liked' | 'saved'>('recent');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
  };

  if (isLoading && !profile) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const creatorStats = [
    { label: 'Followers', value: profile?.followersCount?.toLocaleString() || '0', icon: Users, color: 'text-blue-500' },
    { label: 'Courses', value: '8', icon: BookOpen, color: 'text-amber-500' },
    { label: 'Videos', value: '142', icon: Play, color: 'text-rose-500' },
    { label: 'Rating', value: '4.9', icon: Star, color: 'text-emerald-500' },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <BackButton onClick={() => router.back()} label="Back to Dashboard" />
        <button
          onClick={() => router.push('/settings')}
          className="flex h-9 items-center gap-2 rounded-lg bg-surface-muted px-4 text-sm font-medium text-text-primary transition-all hover:bg-surface-default hover:shadow-sm"
        >
          <SettingsIcon className="size-4" />
          Settings
        </button>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-surface-default border border-border-default shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-amber-500/10 opacity-50" />
        <div className="relative flex flex-col items-center px-6 py-10 md:flex-row md:items-start md:gap-8 md:py-12">
          {/* Avatar */}
          <div className="group relative cursor-pointer" onClick={handleAvatarClick}>
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-primary-500 to-amber-500 opacity-20 blur-sm transition-opacity group-hover:opacity-40" />
            <div className="relative flex size-24 items-center justify-center overflow-hidden rounded-full border-4 border-surface-default bg-amber-100 text-3xl font-bold text-slate-800 shadow-xl md:size-32">
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.username} className="size-full object-cover" />
              ) : (
                profile?.username?.[0]?.toUpperCase() || 'U'
              )}
              {/* Upload Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <Camera className="size-8 text-white" />
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="mt-6 flex-1 text-center md:mt-0 md:text-left">
            <div className="flex flex-col gap-1">
              <Typography variant="h1" className="text-2xl font-bold tracking-tight md:text-3xl">
                {profile?.fullName || profile?.username || 'User Profile'}
              </Typography>
              <p className="text-sm text-text-secondary">
                @{profile?.username || 'username'} • Senior Content Creator
              </p>
            </div>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-secondary/90">
              {profile?.bio || 'Passionate educator and tech enthusiast. Join me on my journey to democratize advanced technology education.'}
            </p>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 md:max-w-2xl">
              {creatorStats.map((stat) => (
                <div key={stat.label} className="flex flex-col gap-1 rounded-2xl bg-surface-muted/50 p-4 transition-transform hover:scale-[1.02]">
                  <div className="flex items-center gap-2">
                    <stat.icon className={cx('size-4', stat.color)} />
                    <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary/70">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold text-text-primary">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Videos Section */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Tabs Header */}
            <div className="flex items-center gap-1 border-b border-border-default pb-0">
              {[
                { id: 'recent', label: 'Recent', icon: LayoutGrid },
                { id: 'liked', label: 'Liked', icon: Heart },
                { id: 'saved', label: 'Saved', icon: Bookmark },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cx(
                    'flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-all',
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-text-secondary hover:text-text-primary'
                  )}
                >
                  <tab.icon className="size-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {(activeTab === 'recent' ? mockVideos : activeTab === 'liked' ? mockLikedVideos : mockSavedVideos).map((video) => (
                <div key={video.id} className="group relative flex flex-col gap-3 rounded-2xl bg-surface-default border border-border-default p-3 transition-all hover:shadow-md">
                  <div className="relative aspect-video overflow-hidden rounded-xl">
                    <img src={video.thumbnail} alt={video.title} className="size-full object-cover transition-transform group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                      <div className="flex size-10 items-center justify-center rounded-full bg-white/90 text-slate-900 shadow-xl">
                        <Play className="ml-0.5 size-5 fill-current" />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="line-clamp-2 text-sm font-semibold text-text-primary group-hover:text-primary-600 transition-colors">{video.title}</h3>
                    <p className="text-xs text-text-secondary">{video.views} views • {video.date}</p>
                  </div>
                </div>
              ))}
              
              {(activeTab === 'liked' && mockLikedVideos.length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <Heart className="size-12 text-surface-muted" />
                  <p className="mt-4 text-text-secondary">No liked videos yet.</p>
                </div>
              )}
              
              {(activeTab === 'saved' && mockSavedVideos.length === 0) && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <Bookmark className="size-12 text-surface-muted" />
                  <p className="mt-4 text-text-secondary">No saved videos yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Section: Courses & Activity */}
        <div className="flex flex-col gap-6">
          <Card className="rounded-3xl border border-border-default bg-surface-default shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg font-bold">
                <Layers className="size-5 text-primary-500" />
                Active Learning
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {mockCourses.map((course) => (
                <div key={course.id} className="flex flex-col gap-2 rounded-2xl bg-surface-muted/50 p-4 transition-all hover:bg-surface-muted">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-secondary/60">{course.category}</span>
                    <h4 className="text-sm font-semibold text-text-primary">{course.title}</h4>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span className="text-text-secondary">Progress</span>
                      <span className="text-text-primary">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-default">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-amber-500 transition-all duration-500" 
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Social Links / Achievements etc could go here */}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default ProfileView;
