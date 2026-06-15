import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

typedef ClassSessionFormInput = ({
  String title,
  String? description,
  String sessionType,
  int? durationMinutes,
  double? weight,
  String? scheduledAt,
  String? status,
});

class ClassSessionFormSheet extends HookWidget {
  const ClassSessionFormSheet({this.session, super.key});

  final SchoolClassSessionModel? session;

  static Future<ClassSessionFormInput?> showCreate(BuildContext context) {
    return _show(context, session: null);
  }

  static Future<ClassSessionFormInput?> showEdit(
    BuildContext context, {
    required SchoolClassSessionModel session,
  }) {
    return _show(context, session: session);
  }

  static Future<ClassSessionFormInput?> _show(
    BuildContext context, {
    required SchoolClassSessionModel? session,
  }) {
    final maxH = MediaQuery.sizeOf(context).height * 0.92;
    return showModalBottomSheet<ClassSessionFormInput>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
        child: Align(
          alignment: Alignment.bottomCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxH),
            child: ClassSessionFormSheet(session: session),
          ),
        ),
      ),
    );
  }

  bool get _isEdit => session != null;

  @override
  Widget build(BuildContext context) {
    final existing = session;
    final titleCtrl = useTextEditingController(text: existing?.title ?? '');
    final descCtrl = useTextEditingController(text: existing?.description ?? '');
    final durationCtrl = useTextEditingController(
      text: existing?.durationMinutes?.toString() ?? '',
    );
    final weightCtrl = useTextEditingController(
      text: existing?.weight?.toString() ?? '',
    );
    final sessionType = useState(existing?.sessionType ?? 'virtual');
    final status = useState(existing?.status ?? 'draft');
    final scheduledDate = useState<DateTime?>(_parseScheduledDate(existing?.scheduledAt));
    final scheduledTime = useState<TimeOfDay?>(_parseScheduledTime(existing?.scheduledAt));

    Future<void> pickDate() async {
      final picked = await showDatePicker(
        context: context,
        initialDate: scheduledDate.value ?? DateTime.now(),
        firstDate: DateTime.now().subtract(const Duration(days: 365)),
        lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
      );
      if (picked != null) scheduledDate.value = picked;
    }

    Future<void> pickTime() async {
      final picked = await showTimePicker(
        context: context,
        initialTime: scheduledTime.value ?? TimeOfDay.now(),
      );
      if (picked != null) scheduledTime.value = picked;
    }

    void submit() {
      final title = titleCtrl.text.trim();
      if (title.isEmpty) return;

      final durationRaw = durationCtrl.text.trim();
      final duration = durationRaw.isEmpty ? null : int.tryParse(durationRaw);
      final weightRaw = weightCtrl.text.trim();
      final weight = weightRaw.isEmpty ? null : double.tryParse(weightRaw);

      String? scheduledAt;
      final date = scheduledDate.value;
      final time = scheduledTime.value;
      if (date != null && time != null) {
        final dt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
        scheduledAt = dt.toUtc().toIso8601String();
      }

      Navigator.of(context).pop((
        title: title,
        description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
        sessionType: sessionType.value,
        durationMinutes: duration,
        weight: weight,
        scheduledAt: scheduledAt,
        status: _isEdit ? status.value : null,
      ));
    }

    final scheduleLabel = () {
      final date = scheduledDate.value;
      final time = scheduledTime.value;
      if (date == null) return 'Pick date & time (optional)';
      final dateStr = MaterialLocalizations.of(context).formatMediumDate(date);
      if (time == null) return dateStr;
      return '$dateStr · ${time.format(context)}';
    }();

    final canEditStatus = _isEdit && existing!.status != 'live';

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.inputBorder,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                _isEdit ? 'Edit session' : 'New session',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.primary,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: titleCtrl,
                textInputAction: TextInputAction.next,
                decoration: _fieldDecoration('Title'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                maxLines: 3,
                decoration: _fieldDecoration('Description (optional)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: durationCtrl,
                keyboardType: TextInputType.number,
                decoration: _fieldDecoration('Duration in minutes (optional)'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: weightCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: _fieldDecoration('Weight (optional)'),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: sessionType.value,
                decoration: _fieldDecoration('Session type'),
                items: const [
                  DropdownMenuItem(value: 'virtual', child: Text('Virtual')),
                  DropdownMenuItem(value: 'in_person', child: Text('In person')),
                  DropdownMenuItem(value: 'hybrid', child: Text('Hybrid')),
                ],
                onChanged: (v) {
                  if (v != null) sessionType.value = v;
                },
              ),
              if (canEditStatus) ...[
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  initialValue: status.value,
                  decoration: _fieldDecoration('Status'),
                  items: const [
                    DropdownMenuItem(value: 'draft', child: Text('Draft')),
                    DropdownMenuItem(value: 'scheduled', child: Text('Scheduled')),
                    DropdownMenuItem(value: 'completed', child: Text('Completed')),
                  ],
                  onChanged: (v) {
                    if (v != null) status.value = v;
                  },
                ),
              ],
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  await pickDate();
                  if (context.mounted) await pickTime();
                },
                icon: const Icon(Icons.event_outlined),
                label: Text(scheduleLabel),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.primary,
                  side: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.8)),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                  const Spacer(),
                  FilledButton(
                    onPressed: submit,
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                    child: Text(_isEdit ? 'Save changes' : 'Create session'),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  static InputDecoration _fieldDecoration(String label) {
    return InputDecoration(
      labelText: label,
      filled: true,
      fillColor: AppColors.surfaceGrey,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
    );
  }

  static DateTime? _parseScheduledDate(String? iso) {
    if (iso == null || iso.trim().isEmpty) return null;
    try {
      return DateTime.parse(iso).toLocal();
    } catch (_) {
      return null;
    }
  }

  static TimeOfDay? _parseScheduledTime(String? iso) {
    if (iso == null || iso.trim().isEmpty) return null;
    try {
      final dt = DateTime.parse(iso).toLocal();
      return TimeOfDay(hour: dt.hour, minute: dt.minute);
    } catch (_) {
      return null;
    }
  }
}
