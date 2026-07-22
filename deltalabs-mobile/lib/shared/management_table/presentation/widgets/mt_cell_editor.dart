import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_model.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_column_type.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_cell_display.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_cell_value.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_class_session_cell.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_person_cell.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_class_session_picker_sheet.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_person_picker_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

typedef MtCellCommitCallback = void Function(Object? value);

class MtCellEditor extends StatelessWidget {
  const MtCellEditor({
    required this.column,
    required this.value,
    required this.onCommit,
    this.personSearchOrgId,
    this.personSearchSchoolId,
    this.personPicker = 'school_students',
    this.classWorkspaceItemId,
    super.key,
  });

  final MtColumnModel column;
  final Object? value;
  final MtCellCommitCallback onCommit;
  final String? personSearchOrgId;
  final String? personSearchSchoolId;
  final String personPicker;
  final String? classWorkspaceItemId;

  @override
  Widget build(BuildContext context) {
    if (column.usesPersonPicker &&
        personSearchOrgId != null &&
        personSearchSchoolId != null) {
      return _MtPersonPickerEditor(
        value: value,
        orgId: personSearchOrgId!,
        schoolId: personSearchSchoolId!,
        picker: column.resolvePersonPicker(personPicker),
        classWorkspaceItemId: classWorkspaceItemId,
        onCommit: onCommit,
      );
    }

    if (column.usesClassSessionPicker &&
        personSearchOrgId != null &&
        personSearchSchoolId != null &&
        classWorkspaceItemId != null &&
        classWorkspaceItemId!.isNotEmpty) {
      return _MtClassSessionPickerEditor(
        value: value,
        orgId: personSearchOrgId!,
        schoolId: personSearchSchoolId!,
        classWorkspaceItemId: classWorkspaceItemId!,
        onCommit: onCommit,
      );
    }

    if (column.usesTimeEditor) {
      return _MtTimeEditor(value: value, onCommit: onCommit);
    }

    switch (column.type) {
      case MtColumnType.checkbox:
        return _MtCheckboxEditor(value: value, onCommit: onCommit);
      case MtColumnType.number:
        return _MtNumberEditor(value: value, onCommit: onCommit);
      case MtColumnType.date:
        return _MtDateEditor(value: value, onCommit: onCommit);
      case MtColumnType.textarea:
        return _MtTextareaEditor(value: value, onCommit: onCommit);
      case MtColumnType.dropdown:
      case MtColumnType.status:
        return _MtSelectEditor(column: column, value: value, onCommit: onCommit);
      case MtColumnType.link:
        return _MtTextEditor(
          value: value,
          onCommit: onCommit,
          keyboardType: TextInputType.url,
        );
      case MtColumnType.phone:
        return _MtTextEditor(
          value: value,
          onCommit: onCommit,
          keyboardType: TextInputType.phone,
        );
      case MtColumnType.text:
        return _MtTextEditor(value: value, onCommit: onCommit);
    }
  }
}

class _MtPersonPickerEditor extends StatelessWidget {
  const _MtPersonPickerEditor({
    required this.value,
    required this.orgId,
    required this.schoolId,
    required this.picker,
    this.classWorkspaceItemId,
    required this.onCommit,
  });

  final Object? value;
  final String orgId;
  final String schoolId;
  final String picker;
  final String? classWorkspaceItemId;
  final MtCellCommitCallback onCommit;

  Future<void> _openPicker(BuildContext context) async {
    final current = MtPersonCellValue.fromRaw(value);
    final selected = await showMtPersonPickerSheet(
      context,
      orgId: orgId,
      schoolId: schoolId,
      picker: picker,
      classWorkspaceItemId: classWorkspaceItemId,
      current: current.isEmpty ? null : current,
    );
    if (selected == null) return;
    if (selected.isEmpty) {
      onCommit(null);
      return;
    }
    onCommit(selected);
  }

  @override
  Widget build(BuildContext context) {
    final person = MtPersonCellValue.fromRaw(value);
    final label = person.displayName;
    final emptyHint = picker == 'school_parents'
        ? 'Search parent'
        : picker == 'class_students'
            ? 'Search class student'
            : picker == 'platform'
                ? 'Search account'
                : 'Search student';

    return InkWell(
      onTap: () => _openPicker(context),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceGrey,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.person_search_outlined,
              size: 16,
              color: label.isEmpty ? AppColors.textHint : AppColors.primary,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label.isEmpty ? emptyHint : label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: label.isEmpty ? AppColors.textHint : AppColors.textPrimary,
                  fontWeight: label.isEmpty ? FontWeight.w500 : FontWeight.w600,
                ),
              ),
            ),
            const Icon(Icons.expand_more_rounded, size: 18, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _MtClassSessionPickerEditor extends StatelessWidget {
  const _MtClassSessionPickerEditor({
    required this.value,
    required this.orgId,
    required this.schoolId,
    required this.classWorkspaceItemId,
    required this.onCommit,
  });

  final Object? value;
  final String orgId;
  final String schoolId;
  final String classWorkspaceItemId;
  final MtCellCommitCallback onCommit;

  Future<void> _openPicker(BuildContext context) async {
    final current = MtClassSessionCellValue.fromRaw(value);
    final selected = await showMtClassSessionPickerSheet(
      context,
      orgId: orgId,
      schoolId: schoolId,
      classWorkspaceItemId: classWorkspaceItemId,
      current: current.isEmpty ? null : current,
    );
    if (selected == null) return;
    if (selected.isEmpty) {
      onCommit(null);
      return;
    }
    onCommit(selected);
  }

  @override
  Widget build(BuildContext context) {
    final session = MtClassSessionCellValue.fromRaw(value);
    final label = session.displayLabel;

    return InkWell(
      onTap: () => _openPicker(context),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.surfaceGrey,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
        ),
        child: Row(
          children: [
            Icon(
              Icons.event_repeat_rounded,
              size: 16,
              color: label.isEmpty ? AppColors.textHint : AppColors.primary,
            ),
            const SizedBox(width: 6),
            Expanded(
              child: Text(
                label.isEmpty ? 'Select session' : label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: label.isEmpty ? AppColors.textHint : AppColors.textPrimary,
                  fontWeight: label.isEmpty ? FontWeight.w500 : FontWeight.w600,
                ),
              ),
            ),
            const Icon(Icons.expand_more_rounded, size: 18, color: AppColors.textSecondary),
          ],
        ),
      ),
    );
  }
}

class _MtCheckboxEditor extends StatelessWidget {
  const _MtCheckboxEditor({required this.value, required this.onCommit});

  final Object? value;
  final MtCellCommitCallback onCommit;

  @override
  Widget build(BuildContext context) {
    final checked =
        value == true || value.toString().toLowerCase() == 'true';
    return Center(
      child: Checkbox(
        value: checked,
        activeColor: AppColors.primary,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
        onChanged: (next) => onCommit(next ?? false),
      ),
    );
  }
}

class _MtNumberEditor extends StatefulWidget {
  const _MtNumberEditor({required this.value, required this.onCommit});

  final Object? value;
  final MtCellCommitCallback onCommit;

  @override
  State<_MtNumberEditor> createState() => _MtNumberEditorState();
}

class _MtNumberEditorState extends State<_MtNumberEditor> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _displayText(widget.value));
  }

  @override
  void didUpdateWidget(covariant _MtNumberEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _displayText(widget.value);
    if (_displayText(oldWidget.value) != next && _controller.text != next) {
      _controller.text = next;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _displayText(Object? value) {
    if (value == null) return '';
    return value.toString();
  }

  void _commit() {
    final normalized = normalizeMtCellValue(MtColumnType.number, _controller.text);
    if (!mtCellValuesEqual(MtColumnType.number, normalized, widget.value)) {
      widget.onCommit(normalized);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: const TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^-?\d*\.?\d*')),
      ],
      style: const TextStyle(fontSize: 13),
      decoration: const InputDecoration(
        isDense: true,
        border: InputBorder.none,
        contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      ),
      textAlign: TextAlign.center,
      onSubmitted: (_) => _commit(),
      onEditingComplete: _commit,
      onTapOutside: (_) => _commit(),
    );
  }
}

class _MtTextEditor extends StatefulWidget {
  const _MtTextEditor({
    required this.value,
    required this.onCommit,
    this.keyboardType = TextInputType.text,
  });

  final Object? value;
  final MtCellCommitCallback onCommit;
  final TextInputType keyboardType;

  @override
  State<_MtTextEditor> createState() => _MtTextEditorState();
}

class _MtTextEditorState extends State<_MtTextEditor> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _displayText(widget.value));
  }

  @override
  void didUpdateWidget(covariant _MtTextEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _displayText(widget.value);
    if (_displayText(oldWidget.value) != next && _controller.text != next) {
      _controller.text = next;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _displayText(Object? value) {
    if (value == null) return '';
    return value.toString();
  }

  void _commit() {
    final normalized = normalizeMtCellValue(MtColumnType.text, _controller.text);
    if (!mtCellValuesEqual(MtColumnType.text, normalized, widget.value)) {
      widget.onCommit(normalized);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      keyboardType: widget.keyboardType,
      style: const TextStyle(fontSize: 13),
      decoration: const InputDecoration(
        isDense: true,
        border: InputBorder.none,
        contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      ),
      onSubmitted: (_) => _commit(),
      onEditingComplete: _commit,
      onTapOutside: (_) => _commit(),
    );
  }
}

class _MtTextareaEditor extends StatefulWidget {
  const _MtTextareaEditor({required this.value, required this.onCommit});

  final Object? value;
  final MtCellCommitCallback onCommit;

  @override
  State<_MtTextareaEditor> createState() => _MtTextareaEditorState();
}

class _MtTextareaEditorState extends State<_MtTextareaEditor> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: _displayText(widget.value));
  }

  @override
  void didUpdateWidget(covariant _MtTextareaEditor oldWidget) {
    super.didUpdateWidget(oldWidget);
    final next = _displayText(widget.value);
    if (_displayText(oldWidget.value) != next && _controller.text != next) {
      _controller.text = next;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _displayText(Object? value) {
    if (value == null) return '';
    return value.toString();
  }

  void _commit() {
    final normalized =
        normalizeMtCellValue(MtColumnType.textarea, _controller.text);
    if (!mtCellValuesEqual(MtColumnType.textarea, normalized, widget.value)) {
      widget.onCommit(normalized);
    }
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      maxLines: 2,
      minLines: 1,
      style: const TextStyle(fontSize: 13),
      decoration: const InputDecoration(
        isDense: true,
        border: InputBorder.none,
        contentPadding: EdgeInsets.symmetric(horizontal: 4, vertical: 8),
      ),
      onEditingComplete: _commit,
      onTapOutside: (_) => _commit(),
    );
  }
}

class _MtDateEditor extends StatelessWidget {
  const _MtDateEditor({required this.value, required this.onCommit});

  final Object? value;
  final MtCellCommitCallback onCommit;

  String get _isoDate {
    if (value == null) return '';
    final text = value.toString();
    return text.length >= 10 ? text.substring(0, 10) : text;
  }

  Future<void> _pickDate(BuildContext context) async {
    final initial = DateTime.tryParse(_isoDate) ?? DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: initial,
      firstDate: DateTime(1900),
      lastDate: DateTime(2100),
    );
    if (picked == null) return;
    final iso =
        '${picked.year.toString().padLeft(4, '0')}-${picked.month.toString().padLeft(2, '0')}-${picked.day.toString().padLeft(2, '0')}';
    if (iso != _isoDate) {
      onCommit(iso);
    }
  }

  @override
  Widget build(BuildContext context) {
    final label = _isoDate.isEmpty ? 'Pick date' : _isoDate;
    return InkWell(
      onTap: () => _pickDate(context),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            color: _isoDate.isEmpty ? AppColors.textHint : AppColors.textPrimary,
          ),
        ),
      ),
    );
  }
}

/// Stores `HH:mm` — matches web `<input type="time">`.
class _MtTimeEditor extends StatelessWidget {
  const _MtTimeEditor({required this.value, required this.onCommit});

  final Object? value;
  final MtCellCommitCallback onCommit;

  String get _hhmm {
    if (value == null) return '';
    final text = value.toString().trim();
    if (text.length >= 5) return text.substring(0, 5);
    return text;
  }

  TimeOfDay _parseOrNow() {
    final match = RegExp(r'^(\d{1,2}):(\d{2})').firstMatch(_hhmm);
    if (match != null) {
      final h = int.tryParse(match.group(1)!);
      final m = int.tryParse(match.group(2)!);
      if (h != null && m != null && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
        return TimeOfDay(hour: h, minute: m);
      }
    }
    return TimeOfDay.now();
  }

  Future<void> _pickTime(BuildContext context) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _parseOrNow(),
    );
    if (picked == null) return;
    final next =
        '${picked.hour.toString().padLeft(2, '0')}:${picked.minute.toString().padLeft(2, '0')}';
    if (next != _hhmm) onCommit(next);
  }

  @override
  Widget build(BuildContext context) {
    final label = _hhmm.isEmpty ? 'Pick time' : _hhmm;
    return InkWell(
      onTap: () => _pickTime(context),
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 10),
        child: Row(
          children: [
            Icon(
              Icons.schedule_rounded,
              size: 14,
              color: _hhmm.isEmpty ? AppColors.textHint : AppColors.primary,
            ),
            const SizedBox(width: 4),
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontSize: 13,
                  color: _hhmm.isEmpty ? AppColors.textHint : AppColors.textPrimary,
                  fontWeight: _hhmm.isEmpty ? FontWeight.w500 : FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _MtSelectEditor extends StatelessWidget {
  const _MtSelectEditor({
    required this.column,
    required this.value,
    required this.onCommit,
  });

  final MtColumnModel column;
  final Object? value;
  final MtCellCommitCallback onCommit;

  @override
  Widget build(BuildContext context) {
    final options = column.options;
    if (options.isEmpty) {
      return buildMtCellDisplayWidget(column, value);
    }

    final selectedId = value?.toString() ?? '';
    return DropdownButtonHideUnderline(
      child: DropdownButton<String>(
        isExpanded: true,
        isDense: true,
        value: selectedId.isEmpty || options.every((o) => o.id != selectedId)
            ? null
            : selectedId,
        hint: const Text('—', style: TextStyle(fontSize: 13)),
        items: [
          for (final option in options)
            DropdownMenuItem(
              value: option.id,
              child: Text(
                option.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13),
              ),
            ),
        ],
        onChanged: (next) => onCommit(next),
      ),
    );
  }
}
