"use client";

import React, { useState } from 'react';
import { QADashboardLayout } from '@/components/templates/QADashboardLayout';
import { QuestionCard } from '@/components/molecules/QuestionCard';
import { Button, SearchInput } from '@/components/theme';

const MOCK_QUESTIONS = [
  {
    id: 'q1',
    title: 'How do I implement custom hooks in React with TypeScript?',
    excerpt: 'I am trying to abstract some of my component logic into a custom hook but struggling with the generic types...',
    author: { name: 'Alice Smith', avatarUrl: '' },
    tags: ['react', 'typescript', 'hooks'],
    upvotes: 12,
    answersCount: 2,
    createdAt: '2 hours ago',
    isResolved: false,
    isBookmarked: true,
  },
  {
    id: 'q2',
    title: 'What is the best way to handle state in Next.js 13?',
    excerpt: 'With server components becoming the default, should I still use Redux or switch to Context/Zustand?',
    author: { name: 'Bob Johnson', avatarUrl: '' },
    tags: ['nextjs', 'state-management'],
    upvotes: 45,
    answersCount: 8,
    createdAt: '1 day ago',
    isResolved: true,
    isBookmarked: false,
  }
];

export const MyQuestionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'my' | 'community' | 'school' | 'live'>('my');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <QADashboardLayout
      header={
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Q&A Dashboard</h1>
            <p className="text-text-secondary">Manage your questions, find answers, and help the community.</p>
          </div>
          <Button variant="primary" size="lg">Ask a Question</Button>
        </div>
      }
      tabs={
        <nav className="flex gap-8 border-b border-border-default pt-6">
          {[
            { id: 'my', label: 'My Questions' },
            { id: 'community', label: 'Community' },
            { id: 'school', label: 'School' },
            { id: 'live', label: 'Live Q&A' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-4 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border-default'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      }
      filters={
        <div className="flex gap-4 items-center">
          <div className="w-96">
            <SearchInput 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions..."
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Unresolved</Button>
            <Button variant="secondary" size="sm">Bounties</Button>
            <Button variant="secondary" size="sm">Bookmarked</Button>
          </div>
        </div>
      }
      content={
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-text-primary">
              {activeTab === 'my' && 'Questions You Asked'}
              {activeTab === 'community' && 'Latest Community Questions'}
              {activeTab === 'school' && 'School Knowledge Base'}
              {activeTab === 'live' && 'Active Live Sessions'}
            </h2>
            <select className="bg-transparent border-none text-sm text-text-secondary cursor-pointer outline-none">
              <option>Newest first</option>
              <option>Most voted</option>
              <option>Unanswered</option>
            </select>
          </div>

          <div className="grid gap-4">
            {MOCK_QUESTIONS.map(q => (
              <QuestionCard key={q.id} {...q} />
            ))}
          </div>
        </div>
      }
    />
  );
};
