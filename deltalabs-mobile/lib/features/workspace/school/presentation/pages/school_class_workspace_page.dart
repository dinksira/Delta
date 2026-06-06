import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_title_switcher.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolClassWorkspacePage extends HookConsumerWidget {
  const SchoolClassWorkspacePage({
    required this.schoolId,
    required this.classItemId,
    this.school,
    super.key,
  });

  final String schoolId;
  final String classItemId;
  final MySchoolModel? school;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    final createOpen = useState(false);
    final titleCtrl = useTextEditingController();
    final descCtrl = useTextEditingController();
    final submitting = useState(false);

    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
        body: SchoolStatePanel(
          icon: Icons.error_outline_rounded,
          title: 'Could not load class',
          message: 'Try again.',
          actionLabel: 'Retry',
          onAction: () => ref.invalidate(myActiveSchoolsProvider),
        ),
      ),
      data: (schools) {
        MySchoolModel? current = school;
        if (current == null || current.schoolId != schoolId) {
          for (final s in schools) {
            if (s.schoolId == schoolId) {
              current = s;
              break;
            }
          }
        }

        if (current == null || current.orgId.isEmpty) {
          return Scaffold(
            appBar: AppBar(backgroundColor: AppColors.surfaceGrey),
            body: const SchoolStatePanel(
              icon: Icons.school_outlined,
              title: 'Class unavailable',
              message: 'School membership could not be resolved.',
            ),
          );
        }

        final orgId = current.orgId;
        final classItemAsync = ref.watch(
          schoolWorkspaceItemProvider((
            orgId: orgId,
            schoolId: schoolId,
            itemId: classItemId,
          )),
        );
        final accessAsync = ref.watch(schoolOrgAccessProvider(orgId));
        final sessionsQuery = (
          orgId: orgId,
          schoolId: schoolId,
          classWorkspaceItemId: classItemId,
        );
        final sessionsAsync = ref.watch(schoolClassSessionsProvider(sessionsQuery));

        final canMutate = accessAsync.maybeWhen(
          data: (access) => access.canManageSchoolWorkspace,
          orElse: () => false,
        );

        Future<void> refresh() async {
          ref.invalidate(schoolClassSessionsProvider(sessionsQuery));
          ref.invalidate(
            schoolWorkspaceItemProvider((
              orgId: orgId,
              schoolId: schoolId,
              itemId: classItemId,
            )),
          );
        }

        Future<void> createSession() async {
          final title = titleCtrl.text.trim();
          if (title.isEmpty) return;
          submitting.value = true;
          try {
            await ref.read(schoolRemoteDataSourceProvider).createClassSession(
                  orgId: orgId,
                  schoolId: schoolId,
                  classWorkspaceItemId: classItemId,
                  title: title,
                  description: descCtrl.text.trim().isEmpty ? null : descCtrl.text.trim(),
                );
            titleCtrl.clear();
            descCtrl.clear();
            createOpen.value = false;
            await refresh();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Session created'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not create session'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } finally {
            submitting.value = false;
          }
        }

        return classItemAsync.when(
          loading: () => const Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Center(child: DlLoadingIndicator()),
          ),
          error: (e, _) => Scaffold(
            appBar: AppBar(
              backgroundColor: AppColors.surfaceGrey,
              leading: IconButton(
                onPressed: () => context.pop(),
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
              ),
            ),
            body: SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Class not found',
              message: 'This class may have been removed.',
              actionLabel: 'Back',
              onAction: () => context.pop(),
            ),
          ),
          data: (classItem) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            appBar: SchoolWorkspaceTopBar(
              currentSchool: current!,
              schools: schools,
            ),
            floatingActionButton: canMutate
                ? FloatingActionButton.extended(
                    onPressed: () => createOpen.value = true,
                    backgroundColor: AppColors.primary,
                    icon: const Icon(Icons.add_rounded, color: Colors.white),
                    label: const Text(
                      'Session',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  )
                : null,
            body: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: refresh,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                children: [
                  Row(
                    children: [
                      IconButton(
                        onPressed: () => context.pop(),
                        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                      ),
                      Expanded(
                        child: Text(
                          classItem.title,
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (classItem.description?.isNotEmpty == true) ...[
                    const SizedBox(height: 4),
                    Text(
                      classItem.description!,
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 14),
                    ),
                  ],
                  const SizedBox(height: 20),
                  const Text(
                    'Sessions',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                    ),
                  ),
                  const SizedBox(height: 12),
                  if (createOpen.value) ...[
                    _SessionCreateForm(
                      titleCtrl: titleCtrl,
                      descCtrl: descCtrl,
                      submitting: submitting.value,
                      onCancel: () => createOpen.value = false,
                      onSubmit: createSession,
                    ),
                    const SizedBox(height: 16),
                  ],
                  sessionsAsync.when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 32),
                      child: Center(child: DlLoadingIndicator()),
                    ),
                    error: (e, _) => SchoolStatePanel(
                      icon: Icons.error_outline_rounded,
                      title: 'Could not load sessions',
                      message: 'Pull to refresh.',
                      actionLabel: 'Retry',
                      onAction: refresh,
                    ),
                    data: (sessions) {
                      if (sessions.isEmpty) {
                        return SchoolStatePanel(
                          icon: Icons.event_note_outlined,
                          title: 'No sessions yet',
                          message: canMutate
                              ? 'Create your first class session.'
                              : 'Sessions will appear here when added.',
                          actionLabel: canMutate ? 'Add session' : null,
                          onAction: canMutate ? () => createOpen.value = true : null,
                        );
                      }
                      return Column(
                        children: [
                          for (final session in sessions) ...[
                            _SessionCard(session: session),
                            const SizedBox(height: 10),
                          ],
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _SessionCreateForm extends StatelessWidget {
  const _SessionCreateForm({
    required this.titleCtrl,
    required this.descCtrl,
    required this.submitting,
    required this.onCancel,
    required this.onSubmit,
  });

  final TextEditingController titleCtrl;
  final TextEditingController descCtrl;
  final bool submitting;
  final VoidCallback onCancel;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'New session',
            style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: titleCtrl,
            decoration: InputDecoration(
              labelText: 'Title',
              filled: true,
              fillColor: AppColors.surfaceGrey,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: descCtrl,
            maxLines: 2,
            decoration: InputDecoration(
              labelText: 'Description (optional)',
              filled: true,
              fillColor: AppColors.surfaceGrey,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              TextButton(onPressed: submitting ? null : onCancel, child: const Text('Cancel')),
              const Spacer(),
              FilledButton(
                onPressed: submitting ? null : onSubmit,
                style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                child: Text(submitting ? 'Creating…' : 'Create'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _SessionCard extends StatelessWidget {
  const _SessionCard({required this.session});

  final SchoolClassSessionModel session;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            session.title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppColors.primary,
            ),
          ),
          if (session.description?.isNotEmpty == true) ...[
            const SizedBox(height: 4),
            Text(
              session.description!,
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
          ],
          const SizedBox(height: 10),
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _SessionChip(label: session.status),
              _SessionChip(label: session.sessionType),
              if (session.durationMinutes != null)
                _SessionChip(label: '${session.durationMinutes} min'),
            ],
          ),
        ],
      ),
    );
  }
}

class _SessionChip extends StatelessWidget {
  const _SessionChip({required this.label});

  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.primary,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
