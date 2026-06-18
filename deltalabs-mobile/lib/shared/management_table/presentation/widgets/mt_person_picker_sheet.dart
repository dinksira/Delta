import 'dart:async';

import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_member_search_user_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_person_cell.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

Future<Map<String, dynamic>?> showMtPersonPickerSheet(
  BuildContext context, {
  required String orgId,
  required String schoolId,
  MtPersonCellValue? current,
  String picker = 'school_students',
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
      child: _MtPersonPickerSheet(
        orgId: orgId,
        schoolId: schoolId,
        current: current,
        picker: picker,
      ),
    ),
  );
}

class _MtPersonPickerSheet extends HookConsumerWidget {
  const _MtPersonPickerSheet({
    required this.orgId,
    required this.schoolId,
    this.current,
    this.picker = 'school_students',
  });

  final String orgId;
  final String schoolId;
  final MtPersonCellValue? current;
  final String picker;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final query = useState('');
    final loading = useState(false);
    final results = useState<List<SchoolMemberSearchUserModel>>([]);
    final debounce = useRef<Timer?>(null);

    Future<void> runSearch(String text) async {
      final trimmed = text.trim();
      if (trimmed.length < 2) {
        results.value = [];
        return;
      }
      loading.value = true;
      try {
        final items = await ref.read(schoolRemoteDataSourceProvider).searchSchoolMembers(
              orgId: orgId,
              schoolId: schoolId,
              query: trimmed,
              picker: picker,
            );
        results.value = items;
      } catch (_) {
        results.value = [];
      } finally {
        loading.value = false;
      }
    }

    void onQueryChanged(String text) {
      query.value = text;
      debounce.value?.cancel();
      debounce.value = Timer(const Duration(milliseconds: 350), () {
        runSearch(text);
      });
    }

    useEffect(() {
      return () => debounce.value?.cancel();
    }, const []);

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
              'Select student',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            Text(
              picker == 'platform'
                  ? 'Search any Delta Labs account by name, username, or email.'
                  : 'Search students already registered at this school.',
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 12),
            TextField(
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search students',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: AppColors.surfaceGrey,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                isDense: true,
              ),
              onChanged: onQueryChanged,
            ),
            if (current != null && !current!.isEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: InputChip(
                  label: Text(
                    current!.displayName.isNotEmpty ? current!.displayName : 'Selected',
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
                child: loading.value
                    ? const Center(child: DlLoadingIndicator())
                    : query.value.trim().length < 2
                        ? const Center(
                            child: Text(
                              'Type at least 2 characters to search.',
                              style: TextStyle(color: AppColors.textSecondary),
                            ),
                          )
                        : results.value.isEmpty
                            ? Center(
                                child: Text(
                                  picker == 'platform'
                                      ? 'No matching Delta Labs accounts.'
                                      : 'No school students found. Register them in the school student workspace first.',
                                  style: const TextStyle(color: AppColors.textSecondary),
                                  textAlign: TextAlign.center,
                                ),
                              )
                            : ListView.separated(
                                shrinkWrap: true,
                                itemCount: results.value.length,
                                separatorBuilder: (_, __) => const Divider(height: 1),
                                itemBuilder: (context, index) {
                                  final user = results.value[index];
                                  return ListTile(
                                    leading: CircleAvatar(
                                      backgroundColor:
                                          AppColors.primary.withValues(alpha: 0.12),
                                      child: Text(
                                        user.displayName.characters.first.toUpperCase(),
                                        style: const TextStyle(
                                          color: AppColors.primary,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                    ),
                                    title: Text(user.displayName),
                                    subtitle: user.displaySecondary != null
                                        ? Text(user.displaySecondary!)
                                        : null,
                                    onTap: () =>
                                        Navigator.of(context).pop(user.toPersonCellValue()),
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
