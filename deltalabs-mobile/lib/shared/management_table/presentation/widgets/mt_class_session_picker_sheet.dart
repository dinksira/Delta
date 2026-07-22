import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_session_utils.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_class_session_cell.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

Future<Map<String, dynamic>?> showMtClassSessionPickerSheet(
  BuildContext context, {
  required String orgId,
  required String schoolId,
  required String classWorkspaceItemId,
  MtClassSessionCellValue? current,
}) {
  return showModalBottomSheet<Map<String, dynamic>?>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.viewInsetsOf(ctx).bottom),
      child: _MtClassSessionPickerSheet(
        orgId: orgId,
        schoolId: schoolId,
        classWorkspaceItemId: classWorkspaceItemId,
        current: current,
      ),
    ),
  );
}

class _MtClassSessionPickerSheet extends HookConsumerWidget {
  const _MtClassSessionPickerSheet({
    required this.orgId,
    required this.schoolId,
    required this.classWorkspaceItemId,
    this.current,
  });

  final String orgId;
  final String schoolId;
  final String classWorkspaceItemId;
  final MtClassSessionCellValue? current;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = useState('');
    final sessionsAsync = ref.watch(
      schoolClassSessionsProvider((
        orgId: orgId,
        schoolId: schoolId,
        classWorkspaceItemId: classWorkspaceItemId,
      )),
    );

    List<SchoolClassSessionModel> filtered(List<SchoolClassSessionModel> all) {
      final q = query.value.trim().toLowerCase();
      if (q.isEmpty) return all;
      return all.where((s) => s.title.toLowerCase().contains(q)).toList();
    }

    String subtitle(SchoolClassSessionModel session) {
      return [
        classSessionTypeLabel(session.sessionType),
        if (session.durationMinutes != null && session.durationMinutes! > 0)
          '${session.durationMinutes} min',
        if (session.status != 'draft') classSessionStatusLabel(session.status),
      ].join(' · ');
    }

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.inputBorder,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Select class session',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Sessions listed here are created on this class Sessions tab. '
              'Pick one to link it to this schedule row.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search class sessions',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: AppColors.surfaceGrey,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                isDense: true,
              ),
              onChanged: (value) => query.value = value,
            ),
            if (current != null && !current!.isEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: InputChip(
                  label: Text(
                    current!.displayLabel.isNotEmpty
                        ? current!.displayLabel
                        : 'Selected',
                  ),
                  onDeleted: () => Navigator.of(context).pop(<String, dynamic>{}),
                  deleteIcon: const Icon(Icons.close_rounded, size: 18),
                ),
              ),
            ],
            const SizedBox(height: 12),
            Flexible(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.sizeOf(context).height * 0.45,
                ),
                child: sessionsAsync.when(
                  loading: () => const Center(child: DlLoadingIndicator()),
                  error: (_, __) => const Center(
                    child: Text(
                      'Could not load class sessions.',
                      style: TextStyle(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  data: (sessions) {
                    if (sessions.isEmpty) {
                      return const Center(
                        child: Text(
                          'No sessions on this class yet. Create sessions on the Sessions tab first.',
                          style: TextStyle(color: AppColors.textSecondary),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }
                    final items = filtered(sessions);
                    if (items.isEmpty) {
                      return const Center(
                        child: Text(
                          'No sessions match your search.',
                          style: TextStyle(color: AppColors.textSecondary),
                          textAlign: TextAlign.center,
                        ),
                      );
                    }
                    return ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.only(bottom: 4),
                      itemCount: items.length,
                      itemBuilder: (context, index) {
                        final session = items[index];
                        final sub = subtitle(session);
                        return Padding(
                          padding: EdgeInsets.only(
                            bottom: index == items.length - 1 ? 0 : 8,
                          ),
                          child: Material(
                            color: AppColors.surfaceGrey,
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => Navigator.of(context).pop(
                                MtClassSessionCellValue(
                                  sessionId: session.id,
                                  title: session.title,
                                ).toJson(),
                              ),
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 10,
                                ),
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(
                                    color: AppColors.inputBorder
                                        .withValues(alpha: 0.85),
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 18,
                                      backgroundColor: AppColors.primary
                                          .withValues(alpha: 0.12),
                                      child: const Icon(
                                        Icons.event_repeat_rounded,
                                        size: 18,
                                        color: AppColors.primary,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            session.title,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                              fontSize: 15,
                                              fontWeight: FontWeight.w700,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                          if (sub.isNotEmpty)
                                            Text(
                                              sub,
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                              style: const TextStyle(
                                                fontSize: 12,
                                                color: AppColors.textSecondary,
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    const Icon(
                                      Icons.chevron_right_rounded,
                                      color: AppColors.textSecondary,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
