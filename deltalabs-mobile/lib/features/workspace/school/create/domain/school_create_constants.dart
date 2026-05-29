/// Wizard steps aligned with web `SchoolCreateWizardModal`.
abstract final class SchoolCreateConstants {
  static const draftStorageKey = 'dl.school.create.wizard.draft.v1';

  static const steps = [
    'School',
    'Partner Detail',
    'Partners',
    'Share',
    'Documents',
  ];

  static const stepHeadings = [
    'School Information',
    'Partner Detail',
    'Partners',
    'School Share',
    'Attach School Document',
  ];

  static const schoolTypes = [
    'University',
    'College',
    'Academy',
    'High School',
  ];

  static const shareAccessNames = [
    'Root Department',
    'Class',
    'Project Management',
    'Online Course Modules',
    'Staff and Teacher',
    'Student Management',
    'Academic Management',
    'Timetable and Scheduling',
    'Parent Portal',
    'Hostel and Transport',
    'Data Analytics and Reports',
    'Document Management',
  ];

  static const shareStatuses = ['can_view', 'can_edit', 'can_manage'];

  static const shareStatusLabels = {
    'can_view': 'Can View',
    'can_edit': 'Can Edit',
    'can_manage': 'Can Manage',
  };
}
