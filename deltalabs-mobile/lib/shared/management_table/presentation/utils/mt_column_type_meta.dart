import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:flutter/material.dart';

class MtAddColumnOption {
  const MtAddColumnOption({
    required this.id,
    required this.label,
    required this.icon,
    this.supportedType,
  });

  final String id;
  final String label;
  final IconData icon;
  final MtColumnType? supportedType;
}

class MtAddColumnGroup {
  const MtAddColumnGroup({required this.title, required this.options});

  final String title;
  final List<MtAddColumnOption> options;
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
