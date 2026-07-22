import 'package:flutter/material.dart';

class CourseWorkspaceSection {
  const CourseWorkspaceSection({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

/// Top tabs inside Course Intro (matches web course intro chrome).
class CourseIntroSubTab {
  const CourseIntroSubTab({required this.id, required this.label});

  final String id;
  final String label;
}

/// School course workspace — mirrors Class shell; section ids match the
/// course bottom-nav from the Course Intro layout (Course Intro, Q&A, …).
abstract class CourseWorkspaceConstants {
  static const defaultTab = 'intro';
  static const defaultIntroSubTab = 'intro';
  static const defaultViewMode = 'direct';

  static const sections = <CourseWorkspaceSection>[
    CourseWorkspaceSection(
      id: 'intro',
      label: 'Course Intro',
      icon: Icons.view_list_outlined,
    ),
    CourseWorkspaceSection(
      id: 'qa',
      label: 'Q&A',
      icon: Icons.help_outline_rounded,
    ),
    CourseWorkspaceSection(
      id: 'exercise',
      label: 'Exercise & Test',
      icon: Icons.quiz_outlined,
    ),
    CourseWorkspaceSection(
      id: 'summary',
      label: 'Fast Summary',
      icon: Icons.autorenew_rounded,
    ),
    CourseWorkspaceSection(
      id: 'score',
      label: 'Score',
      icon: Icons.flag_outlined,
    ),
    CourseWorkspaceSection(
      id: 'supplement',
      label: 'Supplement',
      icon: Icons.description_outlined,
    ),
    CourseWorkspaceSection(
      id: 'resources',
      label: 'Resources',
      icon: Icons.inventory_2_outlined,
    ),
    CourseWorkspaceSection(
      id: 'roadmap',
      label: 'Roadmap',
      icon: Icons.account_tree_outlined,
    ),
    CourseWorkspaceSection(
      id: 'communication',
      label: 'Communication',
      icon: Icons.groups_outlined,
    ),
  ];

  static const sectionIds = [
    'intro',
    'qa',
    'exercise',
    'summary',
    'score',
    'supplement',
    'resources',
    'roadmap',
    'communication',
  ];

  static const introSubTabs = <CourseIntroSubTab>[
    CourseIntroSubTab(id: 'intro', label: 'Intro'),
    CourseIntroSubTab(id: 'about', label: 'About Course'),
    CourseIntroSubTab(id: 'related', label: 'Related Courses'),
    CourseIntroSubTab(id: 'reviews', label: 'Reviews & Rating'),
    CourseIntroSubTab(id: 'prerequisites', label: 'Prerequisites & Requirements'),
    CourseIntroSubTab(id: 'analysis', label: 'Course Analysis'),
  ];

  static const introSubTabIds = [
    'intro',
    'about',
    'related',
    'reviews',
    'prerequisites',
    'analysis',
  ];

  static const comingSoonCopy = <String, ({String title, String message, IconData icon})>{
    'qa': (
      title: 'Q&A',
      message: 'Ask questions and discuss course topics. Coming soon on mobile.',
      icon: Icons.help_outline_rounded,
    ),
    'exercise': (
      title: 'Exercise & Test',
      message: 'Practice exercises and tests for this course are coming soon.',
      icon: Icons.quiz_outlined,
    ),
    'summary': (
      title: 'Fast Summary',
      message: 'Quick notes and summaries for this course are coming soon.',
      icon: Icons.autorenew_rounded,
    ),
    'score': (
      title: 'Score',
      message: 'Course scoring and progress dashboards are coming soon.',
      icon: Icons.flag_outlined,
    ),
    'supplement': (
      title: 'Supplement',
      message: 'Supplementary materials for this course are coming soon.',
      icon: Icons.description_outlined,
    ),
    'resources': (
      title: 'Resources',
      message: 'Course resource library is coming soon.',
      icon: Icons.inventory_2_outlined,
    ),
    'roadmap': (
      title: 'Roadmap',
      message: 'Course learning roadmap is coming soon.',
      icon: Icons.account_tree_outlined,
    ),
    'communication': (
      title: 'Communication',
      message: 'Course communication and community tools are coming soon.',
      icon: Icons.groups_outlined,
    ),
  };

  static const introSubComingSoon = <String, ({String title, String message})>{};
}

