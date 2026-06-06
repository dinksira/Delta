import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:flutter/material.dart';

class SchoolWorkspaceSection {
  const SchoolWorkspaceSection({required this.id, required this.label});

  final String id;
  final String label;
}

class SchoolWorkspaceCreationChoice {
  const SchoolWorkspaceCreationChoice({
    required this.id,
    required this.label,
    required this.icon,
  });

  final String id;
  final String label;
  final IconData icon;
}

abstract class SchoolWorkspaceConstants {
  static const sections = <SchoolWorkspaceSection>[
    SchoolWorkspaceSection(id: 'all', label: 'All'),
    SchoolWorkspaceSection(id: 'departments', label: 'Departments'),
    SchoolWorkspaceSection(id: 'class', label: 'Class'),
    SchoolWorkspaceSection(id: 'course', label: 'Course'),
    SchoolWorkspaceSection(id: 'management-table', label: 'Management Table'),
    SchoolWorkspaceSection(id: 'resource', label: 'Resource'),
    SchoolWorkspaceSection(id: 'students', label: 'Students'),
    SchoolWorkspaceSection(id: 'service', label: 'Service'),
  ];

  static const defaultVisibleSectionIds = [
    'all',
    'departments',
    'class',
    'course',
    'management-table',
    'resource',
    'students',
  ];

  static const creationChoices = <SchoolWorkspaceCreationChoice>[
    SchoolWorkspaceCreationChoice(
      id: 'folder',
      label: 'Folder',
      icon: Icons.folder_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'department',
      label: 'Department',
      icon: Icons.account_tree_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'class',
      label: 'Class',
      icon: Icons.school_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'course',
      label: 'Course',
      icon: Icons.menu_book_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'management-table',
      label: 'Management Table',
      icon: Icons.table_chart_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'resource',
      label: 'Resource',
      icon: Icons.description_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'student',
      label: 'Student',
      icon: Icons.person_outline_rounded,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'service',
      label: 'Service',
      icon: Icons.handshake_outlined,
    ),
    SchoolWorkspaceCreationChoice(
      id: 'staff',
      label: 'Staff',
      icon: Icons.badge_outlined,
    ),
  ];

  static String? sectionToItemType(String sectionId) {
    switch (sectionId) {
      case 'all':
        return null;
      case 'departments':
        return 'department';
      case 'students':
        return 'student';
      default:
        return sectionId;
    }
  }

  static String sectionToCreationChoice(String sectionId) {
    if (sectionId == 'departments') return 'department';
    if (sectionId == 'students') return 'student';
    return sectionId;
  }

  static IconData iconForItemType(SchoolWorkspaceItemType type) {
    switch (type) {
      case SchoolWorkspaceItemType.folder:
        return Icons.folder_outlined;
      case SchoolWorkspaceItemType.department:
        return Icons.account_tree_outlined;
      case SchoolWorkspaceItemType.classItem:
        return Icons.school_outlined;
      case SchoolWorkspaceItemType.course:
        return Icons.menu_book_outlined;
      case SchoolWorkspaceItemType.managementTable:
        return Icons.table_chart_outlined;
      case SchoolWorkspaceItemType.resource:
        return Icons.description_outlined;
      case SchoolWorkspaceItemType.student:
        return Icons.person_outline_rounded;
      case SchoolWorkspaceItemType.service:
        return Icons.handshake_outlined;
      case SchoolWorkspaceItemType.staff:
        return Icons.badge_outlined;
    }
  }

  static String primaryMeta(SchoolWorkspaceItemModel item) {
    final meta = item.metadata;
    switch (item.type) {
      case SchoolWorkspaceItemType.classItem:
        return (meta['grade'] ?? 'Grade 12').toString();
      case SchoolWorkspaceItemType.course:
        return 'Introduction Course';
      case SchoolWorkspaceItemType.managementTable:
        return 'Template Based';
      case SchoolWorkspaceItemType.resource:
        return 'Category Based';
      case SchoolWorkspaceItemType.student:
        return '${meta['count'] ?? '23'} Students';
      default:
        return item.type.label;
    }
  }

  static String secondaryMeta(SchoolWorkspaceItemModel item) {
    final meta = item.metadata;
    switch (item.type) {
      case SchoolWorkspaceItemType.classItem:
        return 'No of Students: ${meta['studentCount'] ?? '20'}';
      case SchoolWorkspaceItemType.course:
        return item.description ?? 'For grade students';
      case SchoolWorkspaceItemType.managementTable:
        return 'Self Owned';
      case SchoolWorkspaceItemType.resource:
        return 'Resource';
      case SchoolWorkspaceItemType.student:
        return item.description ?? 'Student Registration';
      default:
        return item.description ?? '';
    }
  }
}
