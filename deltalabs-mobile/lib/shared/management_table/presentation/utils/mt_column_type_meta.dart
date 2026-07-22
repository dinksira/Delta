import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:flutter/material.dart';

class MtAddColumnOption {
  const MtAddColumnOption({
    required this.id,
    required this.label,
    required this.icon,
    this.supportedType,
    this.columnTitle,
    this.columnSettings,
  });

  final String id;
  final String label;
  final IconData icon;
  final MtColumnType? supportedType;
  final String? columnTitle;
  final Map<String, dynamic>? columnSettings;
}

class MtAddColumnGroup {
  const MtAddColumnGroup({required this.title, required this.options});

  final String title;
  final List<MtAddColumnOption> options;
}

/// Result of picking an add-column option (type + optional title/settings).
class MtAppendColumnSpec {
  const MtAppendColumnSpec({
    required this.type,
    this.title,
    this.settings,
  });

  final MtColumnType type;
  final String? title;
  final Map<String, dynamic>? settings;
}

const mtAddColumnGroups = <MtAddColumnGroup>[
  MtAddColumnGroup(
    title: 'Most used',
    options: [
      MtAddColumnOption(
        id: 'text',
        label: 'Text',
        icon: Icons.text_fields_rounded,
        supportedType: MtColumnType.text,
      ),
      MtAddColumnOption(
        id: 'link',
        label: 'Link',
        icon: Icons.link_rounded,
        supportedType: MtColumnType.link,
      ),
      MtAddColumnOption(
        id: 'status',
        label: 'Status',
        icon: Icons.local_offer_outlined,
        supportedType: MtColumnType.status,
      ),
    ],
  ),
  MtAddColumnGroup(
    title: 'More',
    options: [
      MtAddColumnOption(
        id: 'date',
        label: 'Date',
        icon: Icons.calendar_today_rounded,
        supportedType: MtColumnType.date,
      ),
      MtAddColumnOption(
        id: 'number',
        label: 'Number',
        icon: Icons.numbers_rounded,
        supportedType: MtColumnType.number,
      ),
      MtAddColumnOption(
        id: 'dropdown',
        label: 'Dropdown',
        icon: Icons.arrow_drop_down_circle_outlined,
        supportedType: MtColumnType.dropdown,
      ),
      MtAddColumnOption(
        id: 'checkbox',
        label: 'Checkbox',
        icon: Icons.check_box_outlined,
        supportedType: MtColumnType.checkbox,
      ),
      MtAddColumnOption(
        id: 'textarea',
        label: 'Long text',
        icon: Icons.notes_rounded,
        supportedType: MtColumnType.textarea,
      ),
      MtAddColumnOption(
        id: 'phone',
        label: 'Phone',
        icon: Icons.phone_outlined,
        supportedType: MtColumnType.phone,
      ),
    ],
  ),
];

/// Matches web `CLASS_ASSIGNMENTS_TABLE_ADD_COLUMN_GROUPS`.
const classAssignmentsAddColumnGroups = <MtAddColumnGroup>[
  MtAddColumnGroup(
    title: 'Tracking',
    options: [
      MtAddColumnOption(
        id: 'text',
        label: 'Text',
        icon: Icons.text_fields_rounded,
        supportedType: MtColumnType.text,
      ),
      MtAddColumnOption(
        id: 'date',
        label: 'Date',
        icon: Icons.calendar_today_rounded,
        supportedType: MtColumnType.date,
      ),
      MtAddColumnOption(
        id: 'status',
        label: 'Status',
        icon: Icons.local_offer_outlined,
        supportedType: MtColumnType.status,
        columnSettings: {
          'options': [
            {'id': 'assigned', 'label': 'Assigned'},
            {'id': 'in_progress', 'label': 'In Progress'},
            {'id': 'submitted', 'label': 'Submitted'},
            {'id': 'graded', 'label': 'Graded'},
            {'id': 'overdue', 'label': 'Overdue'},
            {'id': 'cancelled', 'label': 'Cancelled'},
          ],
        },
      ),
      MtAddColumnOption(
        id: 'teacher',
        label: 'Teacher',
        icon: Icons.person_outline_rounded,
        supportedType: MtColumnType.text,
        columnTitle: 'Teacher',
        columnSettings: {'cellEditor': 'person'},
      ),
      MtAddColumnOption(
        id: 'link',
        label: 'Link / document',
        icon: Icons.link_rounded,
        supportedType: MtColumnType.link,
      ),
    ],
  ),
  MtAddColumnGroup(
    title: 'More',
    options: [
      MtAddColumnOption(
        id: 'number',
        label: 'Number',
        icon: Icons.numbers_rounded,
        supportedType: MtColumnType.number,
      ),
      MtAddColumnOption(
        id: 'dropdown',
        label: 'Dropdown',
        icon: Icons.arrow_drop_down_circle_outlined,
        supportedType: MtColumnType.dropdown,
      ),
      MtAddColumnOption(
        id: 'checkbox',
        label: 'Checkbox',
        icon: Icons.check_box_outlined,
        supportedType: MtColumnType.checkbox,
      ),
      MtAddColumnOption(
        id: 'textarea',
        label: 'Long text',
        icon: Icons.notes_rounded,
        supportedType: MtColumnType.textarea,
      ),
      MtAddColumnOption(
        id: 'phone',
        label: 'Phone',
        icon: Icons.phone_outlined,
        supportedType: MtColumnType.phone,
      ),
    ],
  ),
];

/// Matches web `CLASS_GRADES_TABLE_ADD_COLUMN_GROUPS`.
const classGradesAddColumnGroups = <MtAddColumnGroup>[
  MtAddColumnGroup(
    title: 'Assessments',
    options: [
      MtAddColumnOption(
        id: 'number',
        label: 'Number',
        icon: Icons.numbers_rounded,
        supportedType: MtColumnType.number,
      ),
      MtAddColumnOption(
        id: 'text',
        label: 'Text',
        icon: Icons.text_fields_rounded,
        supportedType: MtColumnType.text,
      ),
      MtAddColumnOption(
        id: 'status',
        label: 'Status',
        icon: Icons.local_offer_outlined,
        supportedType: MtColumnType.status,
      ),
    ],
  ),
  MtAddColumnGroup(
    title: 'More',
    options: [
      MtAddColumnOption(
        id: 'date',
        label: 'Date',
        icon: Icons.calendar_today_rounded,
        supportedType: MtColumnType.date,
      ),
      MtAddColumnOption(
        id: 'dropdown',
        label: 'Dropdown',
        icon: Icons.arrow_drop_down_circle_outlined,
        supportedType: MtColumnType.dropdown,
      ),
      MtAddColumnOption(
        id: 'checkbox',
        label: 'Checkbox',
        icon: Icons.check_box_outlined,
        supportedType: MtColumnType.checkbox,
      ),
      MtAddColumnOption(
        id: 'textarea',
        label: 'Long text',
        icon: Icons.notes_rounded,
        supportedType: MtColumnType.textarea,
      ),
      MtAddColumnOption(
        id: 'link',
        label: 'Link',
        icon: Icons.link_rounded,
        supportedType: MtColumnType.link,
      ),
      MtAddColumnOption(
        id: 'phone',
        label: 'Phone',
        icon: Icons.phone_outlined,
        supportedType: MtColumnType.phone,
      ),
    ],
  ),
];

/// Matches web `CLASS_LEAVE_REQUESTS_TABLE_ADD_COLUMN_GROUPS`.
const classLeaveRequestsAddColumnGroups = <MtAddColumnGroup>[
  MtAddColumnGroup(
    title: 'Most used',
    options: [
      MtAddColumnOption(
        id: 'text',
        label: 'Text',
        icon: Icons.text_fields_rounded,
        supportedType: MtColumnType.text,
      ),
      MtAddColumnOption(
        id: 'date',
        label: 'Date',
        icon: Icons.calendar_today_rounded,
        supportedType: MtColumnType.date,
      ),
      MtAddColumnOption(
        id: 'textarea',
        label: 'Long text',
        icon: Icons.notes_rounded,
        supportedType: MtColumnType.textarea,
      ),
      MtAddColumnOption(
        id: 'link',
        label: 'Link / document',
        icon: Icons.link_rounded,
        supportedType: MtColumnType.link,
      ),
      MtAddColumnOption(
        id: 'status',
        label: 'Status',
        icon: Icons.local_offer_outlined,
        supportedType: MtColumnType.status,
      ),
    ],
  ),
  MtAddColumnGroup(
    title: 'More',
    options: [
      MtAddColumnOption(
        id: 'number',
        label: 'Number',
        icon: Icons.numbers_rounded,
        supportedType: MtColumnType.number,
      ),
      MtAddColumnOption(
        id: 'dropdown',
        label: 'Dropdown',
        icon: Icons.arrow_drop_down_circle_outlined,
        supportedType: MtColumnType.dropdown,
      ),
      MtAddColumnOption(
        id: 'checkbox',
        label: 'Checkbox',
        icon: Icons.check_box_outlined,
        supportedType: MtColumnType.checkbox,
      ),
      MtAddColumnOption(
        id: 'phone',
        label: 'Phone',
        icon: Icons.phone_outlined,
        supportedType: MtColumnType.phone,
      ),
    ],
  ),
];

/// Matches web `CLASS_SCHEDULES_TABLE_ADD_COLUMN_GROUPS`.
const classSchedulesAddColumnGroups = <MtAddColumnGroup>[
  MtAddColumnGroup(
    title: 'Most used',
    options: [
      MtAddColumnOption(
        id: 'session',
        label: 'Session',
        icon: Icons.event_repeat_rounded,
        supportedType: MtColumnType.text,
        columnTitle: 'Session',
        columnSettings: {'cellEditor': 'class_session'},
      ),
      MtAddColumnOption(
        id: 'date',
        label: 'Date',
        icon: Icons.calendar_today_rounded,
        supportedType: MtColumnType.date,
        columnTitle: 'Date',
      ),
      MtAddColumnOption(
        id: 'text',
        label: 'Text',
        icon: Icons.text_fields_rounded,
        supportedType: MtColumnType.text,
        columnTitle: 'Text',
      ),
      MtAddColumnOption(
        id: 'duration',
        label: 'Duration',
        icon: Icons.timer_outlined,
        supportedType: MtColumnType.number,
        columnTitle: 'Duration',
        columnSettings: {'unit': 'minutes'},
      ),
    ],
  ),
  MtAddColumnGroup(
    title: 'More',
    options: [
      MtAddColumnOption(
        id: 'status',
        label: 'Status',
        icon: Icons.local_offer_outlined,
        supportedType: MtColumnType.status,
        columnTitle: 'Status',
        columnSettings: {
          'options': [
            {'id': 'scheduled', 'label': 'Scheduled'},
            {'id': 'live', 'label': 'Live'},
            {'id': 'completed', 'label': 'Completed'},
            {'id': 'cancelled', 'label': 'Cancelled'},
          ],
        },
      ),
      MtAddColumnOption(
        id: 'time',
        label: 'Time',
        icon: Icons.schedule_rounded,
        supportedType: MtColumnType.text,
        columnTitle: 'Time',
        columnSettings: {'cellEditor': 'time'},
      ),
      MtAddColumnOption(
        id: 'assign_teacher',
        label: 'Assign Teacher',
        icon: Icons.person_outline_rounded,
        supportedType: MtColumnType.text,
        columnTitle: 'Assign Teacher',
        columnSettings: {'cellEditor': 'person'},
      ),
      MtAddColumnOption(
        id: 'class_room',
        label: 'Class Room',
        icon: Icons.meeting_room_outlined,
        supportedType: MtColumnType.text,
        columnTitle: 'Class Room',
      ),
    ],
  ),
];

Map<String, dynamic> defaultSettingsForColumnType(MtColumnType type) {
  switch (type) {
    case MtColumnType.dropdown:
    case MtColumnType.status:
      return {
        'options': [
          {
            'id': 'opt_a',
            'label': type == MtColumnType.status ? 'Working on it' : 'Option A',
          },
          {
            'id': 'opt_b',
            'label': type == MtColumnType.status ? 'Done' : 'Option B',
          },
        ],
      };
    default:
      return const {};
  }
}

String defaultTitleForColumnType(MtColumnType type) {
  switch (type) {
    case MtColumnType.textarea:
      return 'Long text';
    case MtColumnType.checkbox:
      return 'Checkbox';
    default:
      final name = type.name;
      return name.isEmpty ? 'Column' : '${name[0].toUpperCase()}${name.substring(1)}';
  }
}
