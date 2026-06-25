import 'package:flutter/material.dart';

class ClassWorkspaceSection {
  const ClassWorkspaceSection({required this.id, required this.label});

  final String id;
  final String label;
}

class ClassQuickAction {
  const ClassQuickAction({
    required this.id,
    required this.label,
    required this.icon,
    required this.targetTab,
  });

  final String id;
  final String label;
  final IconData icon;
  final String targetTab;
}

abstract class ClassWorkspaceConstants {
  static const defaultTab = 'overview';

  static const sections = <ClassWorkspaceSection>[
    ClassWorkspaceSection(id: 'overview', label: 'Overview'),
    ClassWorkspaceSection(id: 'sessions', label: 'Sessions'),
    ClassWorkspaceSection(id: 'people', label: 'Students'),
    ClassWorkspaceSection(id: 'parents', label: 'Parents'),
    ClassWorkspaceSection(id: 'attendance', label: 'Attendance'),
    ClassWorkspaceSection(id: 'teachers', label: 'Teachers'),
    ClassWorkspaceSection(id: 'resources', label: 'Resources'),
  ];

  static const sectionIds = [
    'overview',
    'sessions',
    'people',
    'parents',
    'attendance',
    'teachers',
    'resources',
  ];

  static const quickActions = <ClassQuickAction>[
    ClassQuickAction(
      id: 'sessions',
      label: 'Sessions',
      icon: Icons.play_lesson_outlined,
      targetTab: 'sessions',
    ),
    ClassQuickAction(
      id: 'attendance',
      label: 'Attendance',
      icon: Icons.fingerprint_outlined,
      targetTab: 'attendance',
    ),
    ClassQuickAction(
      id: 'teachers',
      label: 'Teachers',
      icon: Icons.person_outline_rounded,
      targetTab: 'teachers',
    ),
    ClassQuickAction(
      id: 'assignments',
      label: 'Assignments',
      icon: Icons.assignment_outlined,
      targetTab: 'resources',
    ),
  ];

  static const comingSoonCopy = <String, ({String title, String message, IconData icon})>{
    'resources': (
      title: 'Resources',
      message: 'Class assets, assignments, and schedule are coming soon.',
      icon: Icons.folder_open_outlined,
    ),
  };
}
