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
    ClassWorkspaceSection(id: 'academics', label: 'Academics'),
    ClassWorkspaceSection(id: 'resources', label: 'Resources'),
  ];

  static const sectionIds = [
    'overview',
    'sessions',
    'people',
    'parents',
    'academics',
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
      targetTab: 'academics',
    ),
    ClassQuickAction(
      id: 'assignments',
      label: 'Assignments',
      icon: Icons.assignment_outlined,
      targetTab: 'academics',
    ),
    ClassQuickAction(
      id: 'schedule',
      label: 'Schedule',
      icon: Icons.calendar_today_outlined,
      targetTab: 'academics',
    ),
  ];

  static const comingSoonCopy = <String, ({String title, String message, IconData icon})>{
    'people': (
      title: 'People',
      message: 'Students, teachers, and parents will appear here.',
      icon: Icons.people_outline_rounded,
    ),
    'academics': (
      title: 'Academics',
      message: 'Attendance, grades, assignments, and schedule are coming soon.',
      icon: Icons.school_outlined,
    ),
    'resources': (
      title: 'Resources',
      message: 'Class assets and materials will appear here.',
      icon: Icons.folder_open_outlined,
    ),
  };
}
