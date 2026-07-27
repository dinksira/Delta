/**
 * CreateTopicBattlePage
 * The page view that orchestrates the 8-step wizard.
 */

import React, { useState } from 'react';
import {
  FileText,
  Swords,
  Globe2,
  Users,
  Trophy,
  CalendarClock,
  Database,
  Rocket,
} from 'lucide-react';

import { useCreateTopicBattle } from '../hooks/useCreateTopicBattle';
import { CreateTopicBattleTemplate } from '@/components/templates/CreateTopicBattleTemplate/CreateTopicBattleTemplate';
import { TopicSelectionStep } from '@/components/organisms/CreateTopicBattleSteps/TopicSelectionStep';
import { BattleFormatStep } from '@/components/organisms/CreateTopicBattleSteps/BattleFormatStep';
import { MatchVisibilityStep } from '@/components/organisms/CreateTopicBattleSteps/MatchVisibilityStep';
import { PlayerEntrySetupStep } from '@/components/organisms/CreateTopicBattleSteps/PlayerEntrySetupStep';
import { PrizeDistributionStep } from '@/components/organisms/CreateTopicBattleSteps/PrizeDistributionStep';
import { ScheduleBattleStep } from '@/components/organisms/CreateTopicBattleSteps/ScheduleBattleStep';
import { QuestionPoolSetupStep } from '@/components/organisms/CreateTopicBattleSteps/QuestionPoolSetupStep';
import { ReviewLaunchStep } from '@/components/organisms/CreateTopicBattleSteps/ReviewLaunchStep';
import { QuestionBuilderStep } from '@/components/organisms/CreateTopicBattleSteps/QuestionBuilderStep';
import { BattleCreatedModal } from '@/components/organisms/BattleCreatedModal/BattleCreatedModal';

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_CATEGORIES = [
  'All',
  'Science',
  'History',
  'Math',
  'Geography',
  'Tech',
  'Programming',
  'Literature',
  'Art & Music',
  'Sports',
  'Business & Economics',
  'Psychology & Philosophy',
  'Biology & Medicine',
  'Engineering',
  'Languages',
  'General Knowledge',
  'Entertainment',
  'Law & Politics',
  'Religion & Mythology',
];

const MOCK_TOPICS = [
  // Science
  { id: 'sci-1', name: 'Quantum Mechanics', category: 'Science', difficulty: 'Expert' as const, isPopular: true },
  { id: 'sci-2', name: 'General Relativity', category: 'Science', difficulty: 'Expert' as const },
  { id: 'sci-3', name: 'Newtonian Physics', category: 'Science', difficulty: 'Beginner' as const },
  { id: 'sci-4', name: 'Thermodynamics', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-5', name: 'Electromagnetism', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-6', name: 'Optics & Waves', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-7', name: 'Astronomy & Cosmology', category: 'Science', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'sci-8', name: 'Chemistry: Organic', category: 'Science', difficulty: 'Expert' as const },
  { id: 'sci-9', name: 'Chemistry: Inorganic', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-10', name: 'Periodic Table Fundamentals', category: 'Science', difficulty: 'Beginner' as const },
  { id: 'sci-11', name: 'Chemical Reactions & Stoichiometry', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-12', name: 'Climate & Atmospheric Science', category: 'Science', difficulty: 'Intermediate' as const },
  { id: 'sci-13', name: 'Geology & Earth Science', category: 'Science', difficulty: 'Beginner' as const },

  // Biology & Medicine
  { id: 'bio-1', name: 'Cell Biology', category: 'Biology & Medicine', difficulty: 'Intermediate' as const },
  { id: 'bio-2', name: 'Genetics & DNA', category: 'Biology & Medicine', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'bio-3', name: 'Human Anatomy', category: 'Biology & Medicine', difficulty: 'Intermediate' as const },
  { id: 'bio-4', name: 'Human Physiology', category: 'Biology & Medicine', difficulty: 'Expert' as const },
  { id: 'bio-5', name: 'Evolution & Natural Selection', category: 'Biology & Medicine', difficulty: 'Beginner' as const },
  { id: 'bio-6', name: 'Ecology & Ecosystems', category: 'Biology & Medicine', difficulty: 'Beginner' as const },
  { id: 'bio-7', name: 'Microbiology & Bacteria', category: 'Biology & Medicine', difficulty: 'Intermediate' as const },
  { id: 'bio-8', name: 'Immunology', category: 'Biology & Medicine', difficulty: 'Expert' as const },
  { id: 'bio-9', name: 'Pharmacology Basics', category: 'Biology & Medicine', difficulty: 'Expert' as const },
  { id: 'bio-10', name: 'Botany & Plant Biology', category: 'Biology & Medicine', difficulty: 'Beginner' as const },
  { id: 'bio-11', name: 'Neuroscience & Brain', category: 'Biology & Medicine', difficulty: 'Expert' as const, isPopular: true },

  // History
  { id: 'hist-1', name: 'World War II', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-2', name: 'World War I', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-3', name: 'Ancient Rome', category: 'History', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'hist-4', name: 'Ancient Greece', category: 'History', difficulty: 'Beginner' as const },
  { id: 'hist-5', name: 'Ancient Egypt', category: 'History', difficulty: 'Beginner' as const },
  { id: 'hist-6', name: 'Medieval Europe', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-7', name: 'Renaissance Period', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-8', name: 'Industrial Revolution', category: 'History', difficulty: 'Beginner' as const },
  { id: 'hist-9', name: 'Age of Exploration', category: 'History', difficulty: 'Beginner' as const },
  { id: 'hist-10', name: 'American Civil War', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-11', name: 'French Revolution', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-12', name: 'Cold War Era', category: 'History', difficulty: 'Expert' as const },
  { id: 'hist-13', name: 'African History', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-14', name: 'Asian History (East)', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-15', name: 'Middle East History', category: 'History', difficulty: 'Intermediate' as const },
  { id: 'hist-16', name: 'Prehistoric & Early Humans', category: 'History', difficulty: 'Beginner' as const },
  { id: 'hist-17', name: 'Maya, Aztec & Inca Civilizations', category: 'History', difficulty: 'Beginner' as const, isPopular: true },

  // Math
  { id: 'math-1', name: 'Calculus III (Multivariable)', category: 'Math', difficulty: 'Expert' as const },
  { id: 'math-2', name: 'Calculus I (Derivatives)', category: 'Math', difficulty: 'Intermediate' as const },
  { id: 'math-3', name: 'Calculus II (Integrals)', category: 'Math', difficulty: 'Intermediate' as const },
  { id: 'math-4', name: 'Linear Algebra', category: 'Math', difficulty: 'Expert' as const, isPopular: true },
  { id: 'math-5', name: 'Algebra Fundamentals', category: 'Math', difficulty: 'Beginner' as const },
  { id: 'math-6', name: 'Geometry', category: 'Math', difficulty: 'Beginner' as const },
  { id: 'math-7', name: 'Trigonometry', category: 'Math', difficulty: 'Intermediate' as const },
  { id: 'math-8', name: 'Statistics & Probability', category: 'Math', difficulty: 'Intermediate' as const },
  { id: 'math-9', name: 'Discrete Math', category: 'Math', difficulty: 'Expert' as const },
  { id: 'math-10', name: 'Number Theory', category: 'Math', difficulty: 'Expert' as const },
  { id: 'math-11', name: 'Differential Equations', category: 'Math', difficulty: 'Expert' as const },
  { id: 'math-12', name: 'Arithmetic & Mental Math', category: 'Math', difficulty: 'Beginner' as const },
  { id: 'math-13', name: 'Mathematical Logic', category: 'Math', difficulty: 'Expert' as const },
  { id: 'math-14', name: 'Real Analysis', category: 'Math', difficulty: 'Expert' as const },

  // Geography
  { id: 'geo-1', name: 'European Capitals', category: 'Geography', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'geo-2', name: 'African Countries', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-3', name: 'Asian Countries', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-4', name: 'South American Geography', category: 'Geography', difficulty: 'Beginner' as const },
  { id: 'geo-5', name: 'North American Geography', category: 'Geography', difficulty: 'Beginner' as const },
  { id: 'geo-6', name: 'Oceania & Pacific Islands', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-7', name: 'World Oceans & Seas', category: 'Geography', difficulty: 'Beginner' as const },
  { id: 'geo-8', name: 'World Rivers', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-9', name: 'Mountain Ranges', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-10', name: 'World Flags', category: 'Geography', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'geo-11', name: 'Volcanoes & Tectonics', category: 'Geography', difficulty: 'Intermediate' as const },
  { id: 'geo-12', name: 'Climate Zones & Biomes', category: 'Geography', difficulty: 'Beginner' as const },

  // Tech
  { id: 'tech-1', name: 'Computer Architecture', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-2', name: 'Operating Systems', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-3', name: 'Computer Networks', category: 'Tech', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'tech-4', name: 'Cybersecurity Basics', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-5', name: 'Cloud Computing (AWS/Azure/GCP)', category: 'Tech', difficulty: 'Expert' as const },
  { id: 'tech-6', name: 'Database Systems', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-7', name: 'DevOps & CI/CD', category: 'Tech', difficulty: 'Expert' as const },
  { id: 'tech-8', name: 'Docker & Containers', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-9', name: 'Kubernetes Orchestration', category: 'Tech', difficulty: 'Expert' as const },
  { id: 'tech-10', name: 'Artificial Intelligence Basics', category: 'Tech', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'tech-11', name: 'Machine Learning Theory', category: 'Tech', difficulty: 'Expert' as const },
  { id: 'tech-12', name: 'Semiconductor & Chips', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-13', name: 'Blockchain & Web3', category: 'Tech', difficulty: 'Intermediate' as const },
  { id: 'tech-14', name: 'History of Computing', category: 'Tech', difficulty: 'Beginner' as const },

  // Programming
  { id: 'prog-1', name: 'JavaScript Fundamentals', category: 'Programming', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'prog-2', name: 'TypeScript Advanced', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-3', name: 'Python for Data Science', category: 'Programming', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'prog-4', name: 'Python Fundamentals', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-5', name: 'Java Programming', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-6', name: 'C++ Memory & STL', category: 'Programming', difficulty: 'Expert' as const },
  { id: 'prog-7', name: 'Go (Golang) Basics', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-8', name: 'Rust Ownership System', category: 'Programming', difficulty: 'Expert' as const },
  { id: 'prog-9', name: 'Rust Fundamentals', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-10', name: 'React & Component Patterns', category: 'Programming', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'prog-11', name: 'SQL & Queries', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-12', name: 'Algorithms & Data Structures', category: 'Programming', difficulty: 'Expert' as const, isPopular: true },
  { id: 'prog-13', name: 'LeetCode: Easy Problems', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-14', name: 'LeetCode: Medium Problems', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-15', name: 'LeetCode: Hard Problems', category: 'Programming', difficulty: 'Expert' as const },
  { id: 'prog-16', name: 'Dynamic Programming', category: 'Programming', difficulty: 'Expert' as const },
  { id: 'prog-17', name: 'HTML & CSS Fundamentals', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-18', name: 'Tailwind CSS', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-19', name: 'Next.js Framework', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-20', name: 'Node.js & Express', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-21', name: 'GraphQL vs REST', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-22', name: 'Git & Version Control', category: 'Programming', difficulty: 'Beginner' as const },
  { id: 'prog-23', name: 'Shell Scripting (Bash)', category: 'Programming', difficulty: 'Intermediate' as const },
  { id: 'prog-24', name: 'Design Patterns (OOP)', category: 'Programming', difficulty: 'Expert' as const },
  { id: 'prog-25', name: 'API Design Best Practices', category: 'Programming', difficulty: 'Intermediate' as const },

  // Engineering
  { id: 'eng-1', name: 'Mechanical Engineering Basics', category: 'Engineering', difficulty: 'Intermediate' as const },
  { id: 'eng-2', name: 'Electrical Circuits', category: 'Engineering', difficulty: 'Intermediate' as const },
  { id: 'eng-3', name: 'Civil Engineering: Structures', category: 'Engineering', difficulty: 'Expert' as const },
  { id: 'eng-4', name: 'Fluid Mechanics', category: 'Engineering', difficulty: 'Expert' as const },
  { id: 'eng-5', name: 'Material Science', category: 'Engineering', difficulty: 'Intermediate' as const },
  { id: 'eng-6', name: 'Robotics Fundamentals', category: 'Engineering', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'eng-7', name: 'Control Systems', category: 'Engineering', difficulty: 'Expert' as const },
  { id: 'eng-8', name: 'Signal Processing', category: 'Engineering', difficulty: 'Expert' as const },

  // Literature
  { id: 'lit-1', name: 'Shakespeare Plays', category: 'Literature', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'lit-2', name: '19th Century Novels', category: 'Literature', difficulty: 'Intermediate' as const },
  { id: 'lit-3', name: '20th Century Literature', category: 'Literature', difficulty: 'Intermediate' as const },
  { id: 'lit-4', name: 'Greek Mythology', category: 'Literature', difficulty: 'Beginner' as const },
  { id: 'lit-5', name: 'Poetry & Poets', category: 'Literature', difficulty: 'Beginner' as const },
  { id: 'lit-6', name: 'World Classics', category: 'Literature', difficulty: 'Beginner' as const },
  { id: 'lit-7', name: 'English Grammar & Vocabulary', category: 'Literature', difficulty: 'Beginner' as const },
  { id: 'lit-8', name: 'Essay Writing', category: 'Literature', difficulty: 'Intermediate' as const },

  // Art & Music
  { id: 'art-1', name: 'Art History: Renaissance', category: 'Art & Music', difficulty: 'Beginner' as const },
  { id: 'art-2', name: 'Modern Art (1900s+)', category: 'Art & Music', difficulty: 'Intermediate' as const },
  { id: 'art-3', name: 'Famous Painters', category: 'Art & Music', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'art-4', name: 'Music Theory Basics', category: 'Art & Music', difficulty: 'Beginner' as const },
  { id: 'art-5', name: 'Famous Composers', category: 'Art & Music', difficulty: 'Intermediate' as const },
  { id: 'art-6', name: 'Rock & Pop Music', category: 'Art & Music', difficulty: 'Beginner' as const },
  { id: 'art-7', name: 'Jazz & Blues History', category: 'Art & Music', difficulty: 'Intermediate' as const },
  { id: 'art-8', name: 'Classical Music Eras', category: 'Art & Music', difficulty: 'Intermediate' as const },
  { id: 'art-9', name: 'Architecture History', category: 'Art & Music', difficulty: 'Intermediate' as const },
  { id: 'art-10', name: 'Cinema & Film History', category: 'Art & Music', difficulty: 'Beginner' as const, isPopular: true },

  // Sports
  { id: 'sport-1', name: 'FIFA World Cup History', category: 'Sports', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'sport-2', name: 'Olympic Games History', category: 'Sports', difficulty: 'Beginner' as const },
  { id: 'sport-3', name: 'American Football (NFL)', category: 'Sports', difficulty: 'Intermediate' as const },
  { id: 'sport-4', name: 'Basketball (NBA)', category: 'Sports', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'sport-5', name: 'Baseball (MLB)', category: 'Sports', difficulty: 'Intermediate' as const },
  { id: 'sport-6', name: 'Formula 1 Racing', category: 'Sports', difficulty: 'Intermediate' as const },
  { id: 'sport-7', name: 'Tennis Grand Slams', category: 'Sports', difficulty: 'Beginner' as const },
  { id: 'sport-8', name: 'Chess Strategy', category: 'Sports', difficulty: 'Expert' as const },
  { id: 'sport-9', name: 'Cricket World Cup', category: 'Sports', difficulty: 'Intermediate' as const },
  { id: 'sport-10', name: 'eSports History & Leagues', category: 'Sports', difficulty: 'Beginner' as const },
  { id: 'sport-11', name: 'MMA & Boxing', category: 'Sports', difficulty: 'Beginner' as const },
  { id: 'sport-12', name: 'Athletics & Track & Field', category: 'Sports', difficulty: 'Intermediate' as const },

  // Business & Economics
  { id: 'biz-1', name: 'Microeconomics', category: 'Business & Economics', difficulty: 'Intermediate' as const },
  { id: 'biz-2', name: 'Macroeconomics', category: 'Business & Economics', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'biz-3', name: 'Stock Market Investing', category: 'Business & Economics', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'biz-4', name: 'Cryptocurrency Basics', category: 'Business & Economics', difficulty: 'Beginner' as const },
  { id: 'biz-5', name: 'Accounting Fundamentals', category: 'Business & Economics', difficulty: 'Beginner' as const },
  { id: 'biz-6', name: 'Marketing Principles', category: 'Business & Economics', difficulty: 'Beginner' as const },
  { id: 'biz-7', name: 'Startup & Entrepreneurship', category: 'Business & Economics', difficulty: 'Intermediate' as const },
  { id: 'biz-8', name: 'Corporate Finance', category: 'Business & Economics', difficulty: 'Expert' as const },
  { id: 'biz-9', name: 'Supply Chain Management', category: 'Business & Economics', difficulty: 'Intermediate' as const },
  { id: 'biz-10', name: 'Banking & Interest Rates', category: 'Business & Economics', difficulty: 'Beginner' as const },

  // Psychology & Philosophy
  { id: 'psy-1', name: 'Cognitive Psychology', category: 'Psychology & Philosophy', difficulty: 'Intermediate' as const },
  { id: 'psy-2', name: 'Developmental Psychology', category: 'Psychology & Philosophy', difficulty: 'Beginner' as const },
  { id: 'psy-3', name: 'Social Psychology', category: 'Psychology & Philosophy', difficulty: 'Intermediate' as const },
  { id: 'psy-4', name: 'Freud & Psychoanalysis', category: 'Psychology & Philosophy', difficulty: 'Expert' as const },
  { id: 'psy-5', name: 'Ancient Philosophy', category: 'Psychology & Philosophy', difficulty: 'Intermediate' as const, isPopular: true },
  { id: 'psy-6', name: 'Modern Philosophy', category: 'Psychology & Philosophy', difficulty: 'Expert' as const },
  { id: 'psy-7', name: 'Ethics & Moral Philosophy', category: 'Psychology & Philosophy', difficulty: 'Intermediate' as const },
  { id: 'psy-8', name: 'Logic & Critical Thinking', category: 'Psychology & Philosophy', difficulty: 'Beginner' as const },
  { id: 'psy-9', name: 'Personality Theories', category: 'Psychology & Philosophy', difficulty: 'Intermediate' as const },

  // Languages
  { id: 'lang-1', name: 'Spanish Vocabulary', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-2', name: 'French Vocabulary', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-3', name: 'German Grammar', category: 'Languages', difficulty: 'Intermediate' as const },
  { id: 'lang-4', name: 'Italian Basics', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-5', name: 'Japanese Hiragana & Katakana', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-6', name: 'Japanese Kanji', category: 'Languages', difficulty: 'Expert' as const },
  { id: 'lang-7', name: 'Chinese (Mandarin) Basics', category: 'Languages', difficulty: 'Intermediate' as const },
  { id: 'lang-8', name: 'Korean Hangul', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-9', name: 'Arabic Alphabet', category: 'Languages', difficulty: 'Intermediate' as const },
  { id: 'lang-10', name: 'Russian Cyrillic', category: 'Languages', difficulty: 'Beginner' as const },
  { id: 'lang-11', name: 'Latin Fundamentals', category: 'Languages', difficulty: 'Expert' as const },
  { id: 'lang-12', name: 'English Writing & Composition', category: 'Languages', difficulty: 'Beginner' as const },

  // Entertainment
  { id: 'ent-1', name: 'Marvel Cinematic Universe', category: 'Entertainment', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'ent-2', name: 'Harry Potter Universe', category: 'Entertainment', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'ent-3', name: 'Star Wars Lore', category: 'Entertainment', difficulty: 'Intermediate' as const },
  { id: 'ent-4', name: 'Game of Thrones', category: 'Entertainment', difficulty: 'Intermediate' as const },
  { id: 'ent-5', name: 'The Lord of the Rings', category: 'Entertainment', difficulty: 'Beginner' as const },
  { id: 'ent-6', name: 'Video Game History', category: 'Entertainment', difficulty: 'Beginner' as const },
  { id: 'ent-7', name: 'Pokemon Franchise', category: 'Entertainment', difficulty: 'Beginner' as const },
  { id: 'ent-8', name: 'Anime & Manga General', category: 'Entertainment', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'ent-9', name: 'Disney & Pixar Films', category: 'Entertainment', difficulty: 'Beginner' as const },
  { id: 'ent-10', name: 'Hollywood Celebrities', category: 'Entertainment', difficulty: 'Beginner' as const },

  // Law & Politics
  { id: 'law-1', name: 'Constitutional Law Basics', category: 'Law & Politics', difficulty: 'Intermediate' as const },
  { id: 'law-2', name: 'International Relations', category: 'Law & Politics', difficulty: 'Intermediate' as const },
  { id: 'law-3', name: 'World Political Systems', category: 'Law & Politics', difficulty: 'Beginner' as const },
  { id: 'law-4', name: 'Criminal Law Basics', category: 'Law & Politics', difficulty: 'Beginner' as const },
  { id: 'law-5', name: 'US Government & Congress', category: 'Law & Politics', difficulty: 'Intermediate' as const },
  { id: 'law-6', name: 'European Union Basics', category: 'Law & Politics', difficulty: 'Beginner' as const },
  { id: 'law-7', name: 'Human Rights Law', category: 'Law & Politics', difficulty: 'Intermediate' as const },
  { id: 'law-8', name: 'Intellectual Property Law', category: 'Law & Politics', difficulty: 'Expert' as const },

  // Religion & Mythology
  { id: 'myth-1', name: 'Greek Mythology', category: 'Religion & Mythology', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'myth-2', name: 'Norse Mythology', category: 'Religion & Mythology', difficulty: 'Beginner' as const },
  { id: 'myth-3', name: 'Egyptian Mythology', category: 'Religion & Mythology', difficulty: 'Beginner' as const },
  { id: 'myth-4', name: 'Hindu Mythology', category: 'Religion & Mythology', difficulty: 'Intermediate' as const },
  { id: 'myth-5', name: 'Buddhism Basics', category: 'Religion & Mythology', difficulty: 'Beginner' as const },
  { id: 'myth-6', name: 'Christianity History', category: 'Religion & Mythology', difficulty: 'Beginner' as const },
  { id: 'myth-7', name: 'Islam History & Culture', category: 'Religion & Mythology', difficulty: 'Intermediate' as const },
  { id: 'myth-8', name: 'Judaism Basics', category: 'Religion & Mythology', difficulty: 'Beginner' as const },
  { id: 'myth-9', name: 'Celtic Mythology', category: 'Religion & Mythology', difficulty: 'Intermediate' as const },

  // General Knowledge
  { id: 'gk-1', name: 'Food & Cooking Around the World', category: 'General Knowledge', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'gk-2', name: 'Famous Inventions & Inventors', category: 'General Knowledge', difficulty: 'Beginner' as const },
  { id: 'gk-3', name: 'World Records', category: 'General Knowledge', difficulty: 'Beginner' as const },
  { id: 'gk-4', name: 'Logos & Brand Trivia', category: 'General Knowledge', difficulty: 'Beginner' as const },
  { id: 'gk-5', name: 'Animals & Wildlife', category: 'General Knowledge', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'gk-6', name: 'Space & Universe Facts', category: 'General Knowledge', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'gk-7', name: 'Transportation History', category: 'General Knowledge', difficulty: 'Beginner' as const },
  { id: 'gk-8', name: 'Mixed Trivia: Easy', category: 'General Knowledge', difficulty: 'Beginner' as const, isPopular: true },
  { id: 'gk-9', name: 'Mixed Trivia: Medium', category: 'General Knowledge', difficulty: 'Intermediate' as const },
  { id: 'gk-10', name: 'Mixed Trivia: Hard', category: 'General Knowledge', difficulty: 'Expert' as const },
];

const MOCK_FORMATS = [
  {
    id: '1v1',
    title: '1v1 Duel',
    description: 'Head to head match against a single opponent',
    isRecommended: true,
    stats: { players: '2', questions: '10' },
    features: ['Quick matchmaking', 'Winner takes all', 'Ranked matching'],
    structureLabel: 'STRUCTURE',
    chips: ['1 Player', '1 Player'],
  },
  {
    id: 'team',
    title: 'Team Battle',
    description: 'Form a squad and battle another team',
    stats: { players: '4-10', questions: '20' },
    features: ['Party system', 'Combined score', 'Voice chat enabled'],
    structureLabel: 'STRUCTURE',
    chips: ['Team A', 'Team B'],
  },
  {
    id: 'last-man',
    title: 'Last Man Standing',
    description: 'A large lobby where lowest scorers are eliminated',
    stats: { players: '100', questions: '50' },
    features: ['Elimination rounds', 'Progressive difficulty', 'Huge prize pool'],
    structureLabel: 'STRUCTURE',
    chips: ['1 Player', '99 Players'],
  },
];

const MOCK_VISIBILITIES = [
  {
    id: 'public',
    title: 'Public Match',
    description: 'Anyone on the platform can see and join this battle.',
    features: ['Listed on active battles page', 'Skill-based matchmaking', 'Results affect global rank'],
    bestFor: 'Competitive Play',
  },
  {
    id: 'private',
    title: 'Private Match',
    description: 'Only players with the invite link or room code can join.',
    features: ['Hidden from public pages', 'Custom room code', 'Unranked (No Elo change)'],
    bestFor: 'Playing with Friends',
  },
  {
    id: 'practice',
    title: 'Casual / Practice',
    description: 'Play without risking entry fees or platform rank.',
    features: ['Free entry only', 'Bots can fill empty slots', 'Detailed post-match analytics'],
    bestFor: 'Learning & Warmup',
  },
];

const MOCK_FEES = [
  { label: 'Free', isPopular: true, value: 0, sub: null },
  { label: 5, isPopular: true, value: 5, sub: 'Per Player' },
  { label: 10, isPopular: false, value: 10, sub: 'Per Player' },
  { label: 20, isPopular: false, value: 20, sub: 'Per Player' },
];

const MOCK_PRIZE_RULES = [
  {
    id: 'winner-takes-all',
    title: 'Winner Takes All',
    description: 'The player in 1st place receives the entire prize pool.',
    details: '1st: 100%',
  },
  {
    id: 'top-3-split',
    title: 'Top 3 Split',
    description: 'Prize pool is divided among the top 3 players.',
    details: '1st: 60% | 2nd: 30% | 3rd: 10%',
  },
  {
    id: 'top-50-share',
    title: 'Top 50% Share',
    description: 'Everyone in the top half of the leaderboard gets a piece.',
    details: 'Even split among top 50%',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function CreateTopicBattlePage() {
  const {
    currentStep,
    draft,
    isFirstStep,
    isLastStep,
    canGoNext,
    nextStep,
    prevStep,
    setStep,
    submitBattle,
    updateTopic,
    updateFormat,
    updateVisibility,
    updateEntrySetup,
    updatePrizeDistribution,
    updateSchedule,
    updateQuestionPool,
    updateQuestionPoolMode,
    addQuestion,
    updateQuestion,
    removeQuestion,
    getCurrentQuestion,
    setActiveQuestionId,
    activeQuestionId,
  } = useCreateTopicBattle();

  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('All');
  const [seeMore, setSeeMore] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTopicIdsMap, setSelectedTopicIdsMap] = useState<Map<string, Topic>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreatedModal, setShowCreatedModal] = useState(false);
  const [showQuestionBuilder, setShowQuestionBuilder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const steps = [
    { label: 'Topic Selection', icon: <FileText className="size-5" /> },
    { label: 'Battle Format', icon: <Swords className="size-5" /> },
    { label: 'Match Visibility', icon: <Globe2 className="size-5" /> },
    { label: 'Player & Entry', icon: <Users className="size-5" /> },
    { label: 'Prize Rules', icon: <Trophy className="size-5" /> },
    { label: 'Schedule', icon: <CalendarClock className="size-5" /> },
    { label: 'Question Pool', icon: <Database className="size-5" /> },
    { label: 'Review & Launch', icon: <Rocket className="size-5" /> },
  ];

  const handleBack = () => {
    window.location.hash = '/features/competitions/topic-battles';
  };

  const handleToggleMultiSelectMode = () => {
    if (isMultiSelectMode) {
      setSelectedTopicIdsMap(new Map());
    }
    setIsMultiSelectMode((prev) => !prev);
  };

  const handleToggleMultiSelectTopic = (topicId: string, name: string, category: string) => {
    setSelectedTopicIdsMap((prev) => {
      const next = new Map(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        const topic = MOCK_TOPICS.find((t) => t.id === topicId) ?? {
          id: topicId, name, category, difficulty: 'Intermediate' as const,
        };
        next.set(topicId, topic);
      }
      if (next.size >= 1) {
        const selectedArr = Array.from(next.values());
        const mergedId = `custom-mixed--${selectedArr.map((t) => t.id).join('__')}`;
        const mergedName = selectedArr.length === 1
          ? selectedArr[0].name
          : `${selectedArr[0].name} +${selectedArr.length - 1} Mixed`;
        const mergedCategory = selectedArr.length === 1
          ? selectedArr[0].category
          : 'Mixed Topics';
        updateTopic(mergedId, mergedName, mergedCategory);
      } else {
        updateTopic('', '', '');
      }
      return next;
    });
  };

  const handleClearMultiSelect = () => {
    setSelectedTopicIdsMap(new Map());
    updateTopic('', '', '');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    const result = await submitBattle();
    setIsSubmitting(false);
    if (result.ok) {
      setShowCreatedModal(true);
    } else {
      setSubmitError(result.message ?? 'Failed to create battle. Please try again.');
    }
  };

  let body: React.ReactNode = null;
  switch (currentStep) {
    case 0:
      body = (
        <TopicSelectionStep
          topics={MOCK_TOPICS}
          selectedTopicId={draft.topic.id}
          selectedTopicIds={Array.from(selectedTopicIdsMap.keys())}
          onSelectTopic={(id, name, category) => {
            if (isMultiSelectMode) return;
            updateTopic(id, name, category);
          }}
          onToggleMultiSelect={handleToggleMultiSelectTopic}
          onClearMultiSelect={handleClearMultiSelect}
          isMultiSelectMode={isMultiSelectMode}
          onToggleMultiSelectMode={handleToggleMultiSelectMode}
          searchQuery={searchQuery}
          onSearchChange={(q) => { setSearchQuery(q); setSeeMore(false); }}
          filter={filter}
          onFilterChange={(f) => { setFilter(f); setSeeMore(false); }}
          categories={MOCK_CATEGORIES}
          seeMore={seeMore}
          onToggleSeeMore={() => setSeeMore((prev) => !prev)}
        />
      );
      break;
    case 1:
      body = (
        <BattleFormatStep
          formats={MOCK_FORMATS}
          selectedFormatId={draft.format.id}
          onSelectFormat={updateFormat}
        />
      );
      break;
    case 2:
      body = (
        <MatchVisibilityStep
          options={MOCK_VISIBILITIES}
          selectedVisibilityId={draft.visibility.id}
          onSelectVisibility={(id) => updateVisibility(id, draft.visibility.timing)}
          timing={draft.visibility.timing}
          onTimingChange={(timing) => updateVisibility(draft.visibility.id, timing)}
        />
      );
      break;
    case 3: {
      const getFormatSlotsLimits = (formatId: string) => {
        switch (formatId) {
          case '1v1': return { min: 2, max: 2, title: 'Format: 1 vs 1 Duel', desc: 'This format supports up to 2 players maximum' };
          case 'team': return { min: 4, max: 10, title: 'Format: Team Battle', desc: 'This format supports up to 10 players maximum' };
          case 'last-man': return { min: 10, max: 100, title: 'Format: Last Man Standing', desc: 'This format supports up to 100 players maximum' };
          default: return { min: 2, max: 2, title: 'Format: 1 vs 1 Duel', desc: 'This format supports up to 2 players maximum' };
        }
      };
      const limits = getFormatSlotsLimits(draft.format.id);
      body = (
        <PlayerEntrySetupStep
          slots={draft.entrySetup.slots}
          onSlotsChange={(s) => updateEntrySetup(s, draft.entrySetup.fee, draft.entrySetup.customFee)}
          fee={draft.entrySetup.fee}
          customFee={draft.entrySetup.customFee}
          onFeeChange={(f, cf) => updateEntrySetup(draft.entrySetup.slots, f, cf)}
          feeOptions={MOCK_FEES}
          minSlots={limits.min}
          maxSlots={limits.max}
          formatTitle={limits.title}
          formatDesc={limits.desc}
        />
      );
      break;
    }
    case 4:
      body = (
        <PrizeDistributionStep
          totalPool={draft.prizeDistribution.totalPool}
          onTotalPoolChange={(p) => updatePrizeDistribution(draft.prizeDistribution.id, p)}
          rules={MOCK_PRIZE_RULES}
          selectedRuleId={draft.prizeDistribution.id}
          onSelectRule={(id) => updatePrizeDistribution(id)}
        />
      );
      break;
    case 5:
      body = (
        <ScheduleBattleStep
          date={draft.schedule.date}
          time={draft.schedule.time}
          timezone={draft.schedule.timezone}
          onDateChange={(d) => updateSchedule(d, draft.schedule.time, draft.schedule.timezone)}
          onTimeChange={(t) => updateSchedule(draft.schedule.date, t, draft.schedule.timezone)}
          onTimezoneChange={(tz) => updateSchedule(draft.schedule.date, draft.schedule.time, tz)}
        />
      );
      break;
    case 6:
      if (showQuestionBuilder) {
        body = (
          <QuestionBuilderStep
            questions={draft.customQuestions}
            activeQuestionId={activeQuestionId}
            onAddQuestion={addQuestion}
            onUpdateQuestion={updateQuestion}
            onRemoveQuestion={removeQuestion}
            onSetActiveQuestion={setActiveQuestionId}
            onBack={() => setShowQuestionBuilder(false)}
            totalQuestions={50}
          />
        );
      } else {
        body = (
          <QuestionPoolSetupStep
            topicName={draft.topic.name}
            categories={[draft.topic.category]}
            easyPct={draft.questionPool.easyPct}
            mediumPct={draft.questionPool.mediumPct}
            hardPct={draft.questionPool.hardPct}
            mode={draft.questionPool.mode}
            customQuestionCount={draft.customQuestions.length}
            onModeChange={updateQuestionPoolMode}
            onStartCustomQuestion={() => {
              if (draft.customQuestions.length === 0) addQuestion();
              setShowQuestionBuilder(true);
            }}
          />
        );
      }
      break;
    case 7:
      body = <ReviewLaunchStep draft={draft} onEditStep={setStep} />;
      break;
  }

  return (
    <>
      <CreateTopicBattleTemplate
        currentStep={currentStep}
        totalSteps={8}
        steps={steps}
        body={body}
        onBack={handleBack}
        onPrevStep={prevStep}
        onNextStep={nextStep}
        onSubmit={handleSubmit}
        canGoNext={canGoNext}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        submitError={submitError}
        hideNav={showQuestionBuilder}
      />

      <BattleCreatedModal
        isOpen={showCreatedModal}
        onClose={() => setShowCreatedModal(false)}
        onManageBattle={() => {
          setShowCreatedModal(false);
          handleBack();
        }}
        battleDetails={{
          title: draft.topic.name || 'Your',
          format: draft.format.id.toUpperCase(),
          entryFee: draft.entrySetup.fee === 'Free' ? 'Free' : `${draft.entrySetup.fee} ETB`,
          prizePool: draft.entrySetup.fee === 'Free' ? '0 ETB' : `${(draft.entrySetup.fee === 'Custom' ? (draft.entrySetup.customFee || 0) : Number(draft.entrySetup.fee)) * draft.entrySetup.slots} ETB`,
          date: draft.schedule.date ? `${draft.schedule.date} ${draft.schedule.time}` : 'Now',
        }}
      />
    </>
  );
}

export default CreateTopicBattlePage;
