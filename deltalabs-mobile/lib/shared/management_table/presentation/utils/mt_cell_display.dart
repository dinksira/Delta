import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_person_cell.dart';
import 'package:flutter/material.dart';

/// Read-only display text for a management-table cell (Phase 1).
String resolveMtOptionLabel(MtColumnModel column, Object? value) {
  if (value == null) return '';
  final id = value.toString();
  for (final option in column.options) {
    if (option.id == id) return option.label;
  }
  return id;
}

String formatMtCellDisplay(MtColumnModel column, Object? value) {
  if (column.usesPersonPicker) {
    final person = MtPersonCellValue.fromRaw(value);
    return person.displayName;
  }
  if (value == null) return '';

  switch (column.type) {
    case MtColumnType.checkbox:
      if (value is bool) return value ? 'Yes' : 'No';
      final text = value.toString().toLowerCase();
      if (text == 'true') return 'Yes';
      if (text == 'false') return 'No';
      return text;
    case MtColumnType.number:
      if (value is num) return value.toString();
      return value.toString();
    case MtColumnType.date:
      return value.toString();
    case MtColumnType.dropdown:
    case MtColumnType.status:
      return resolveMtOptionLabel(column, value);
    case MtColumnType.link:
    case MtColumnType.phone:
    case MtColumnType.text:
    case MtColumnType.textarea:
      return value.toString();
  }
}

Widget buildMtCellDisplayWidget(MtColumnModel column, Object? value) {
  if (column.type == MtColumnType.checkbox) {
    final checked = value == true ||
        value.toString().toLowerCase() == 'true';
    return Icon(
      checked ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
      size: 20,
      color: checked ? AppColors.primary : AppColors.textHint,
    );
  }

  if (column.type == MtColumnType.status && value != null) {
    final label = resolveMtOptionLabel(column, value);
    if (label.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: AppColors.primary,
        ),
      ),
    );
  }

  return Text(formatMtCellDisplay(column, value));
}
