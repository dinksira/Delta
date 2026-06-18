import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_simple_back_header.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/management_table/data/models/mt_table_group_model.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/providers/management_table_providers.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/widgets/mt_group_section.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

String _bootstrapErrorMessage(Object error) {
  if (error is DioException) {
    final status = error.response?.statusCode;
    if (status == 404) {
      return 'The students-table API is not on the live server yet. '
          'Deploy the latest deltalabs-backend to Render, then try again.';
    }
    if (status == 403) {
      return 'You need school manage permission on this organization to create the students table.';
    }
    final detail = error.response?.data;
    if (detail is Map && detail['message'] != null) {
      return detail['message'].toString();
    }
    if (detail is Map && detail['detail'] != null) {
      return detail['detail'].toString();
    }
  }
  return 'Could not create students table. Check your connection and try again.';
}

class SchoolStudentRegistrationPage extends HookConsumerWidget {
  const SchoolStudentRegistrationPage({
    required this.schoolId,
    required this.studentItemId,
    this.school,
    super.key,
  });

  final String schoolId;
  final String studentItemId;
  final MySchoolModel? school;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);

    return schoolsAsync.when(
      loading: () => const Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: Center(child: DlLoadingIndicator()),
      ),
      error: (_, __) => Scaffold(
        backgroundColor: AppColors.surfaceGrey,
        body: ListView(
          children: [
            SchoolSimpleBackHeader(title: 'Students', onBack: () => context.pop()),
            SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load school',
              message: 'Try again.',
              actionLabel: 'Retry',
              onAction: () => ref.invalidate(myActiveSchoolsProvider),
            ),
          ],
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
            backgroundColor: AppColors.surfaceGrey,
            body: ListView(
              children: [
                SchoolSimpleBackHeader(title: 'Students', onBack: () => context.pop()),
                const SchoolStatePanel(
                  icon: Icons.table_chart_outlined,
                  title: 'Student registration unavailable',
                  message: 'School membership could not be resolved.',
                ),
              ],
            ),
          );
        }

        final resolvedSchool = current;
        final orgId = resolvedSchool.orgId;
        final accessAsync = ref.watch(schoolOrgAccessProvider(orgId));
        final canMutate = accessAsync.maybeWhen(
          data: (access) =>
              access.canManageSchoolWorkspace ||
              resolvedSchool.roleKeys.contains('school_owner') ||
              resolvedSchool.roleKeys.contains('school_admin'),
          orElse: () =>
              resolvedSchool.roleKeys.contains('school_owner') ||
              resolvedSchool.roleKeys.contains('school_admin'),
        );

        final itemAsync = ref.watch(
          schoolWorkspaceItemProvider((
            orgId: orgId,
            schoolId: schoolId,
            itemId: studentItemId,
          )),
        );

        return Scaffold(
          backgroundColor: AppColors.surfaceGrey,
          body: itemAsync.when(
            loading: () => ListView(
              children: [
                SchoolSimpleBackHeader(title: 'Students', onBack: () => context.pop()),
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 48),
                  child: Center(child: DlLoadingIndicator()),
                ),
              ],
            ),
            error: (_, __) => ListView(
              children: [
                SchoolSimpleBackHeader(title: 'Students', onBack: () => context.pop()),
                const SchoolStatePanel(
                  icon: Icons.error_outline_rounded,
                  title: 'Could not load student registration',
                  message: 'Pull to refresh or go back.',
                ),
              ],
            ),
            data: (item) {
              if (item.type != SchoolWorkspaceItemType.student) {
                return ListView(
                  children: [
                    SchoolSimpleBackHeader(title: item.title, onBack: () => context.pop()),
                    const SchoolStatePanel(
                      icon: Icons.error_outline_rounded,
                      title: 'Not a student registration area',
                      message: 'This workspace item is not configured for student registration.',
                    ),
                  ],
                );
              }

              return RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(
                    schoolWorkspaceItemProvider((
                      orgId: orgId,
                      schoolId: schoolId,
                      itemId: studentItemId,
                    )),
                  );
                },
                child: ListView(
                  children: [
                    SchoolSimpleBackHeader(title: item.title, onBack: () => context.pop()),
                    _StudentRegistrationBody(
                      orgId: orgId,
                      schoolId: schoolId,
                      studentItem: item,
                      canMutate: canMutate,
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
    );
  }
}

class _StudentRegistrationBody extends HookConsumerWidget {
  const _StudentRegistrationBody({
    required this.orgId,
    required this.schoolId,
    required this.studentItem,
    required this.canMutate,
  });

  final String orgId;
  final String schoolId;
  final SchoolWorkspaceItemModel studentItem;
  final bool canMutate;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final instanceId = useState<String?>(studentItem.studentsTableInstanceId);
    final bootstrapping = useState(false);
    final bootstrapError = useState<String?>(null);

    useEffect(() {
      instanceId.value = studentItem.studentsTableInstanceId;
      return null;
    }, [studentItem.studentsTableInstanceId]);

    Future<void> ensureTable({bool auto = false}) async {
      if (instanceId.value != null || bootstrapping.value) return;
      if (auto && !canMutate) return;

      bootstrapping.value = true;
      bootstrapError.value = null;
      try {
        final id = await ref.read(schoolRemoteDataSourceProvider).bootstrapStudentsTable(
              orgId: orgId,
              schoolId: schoolId,
              workspaceItemId: studentItem.id,
            );
        instanceId.value = id;
        ref.invalidate(
          schoolWorkspaceItemProvider((
            orgId: orgId,
            schoolId: schoolId,
            itemId: studentItem.id,
          )),
        );
      } catch (error) {
        bootstrapError.value = _bootstrapErrorMessage(error);
      } finally {
        bootstrapping.value = false;
      }
    }

    useEffect(() {
      if (instanceId.value == null && canMutate) {
        ensureTable(auto: true);
      }
      return null;
    }, [canMutate, instanceId.value]);

    if (instanceId.value == null) {
      if (bootstrapping.value) {
        return const Padding(
          padding: EdgeInsets.symmetric(vertical: 48),
          child: Center(child: DlLoadingIndicator()),
        );
      }
      if (!canMutate) {
        return const Padding(
          padding: EdgeInsets.all(16),
          child: SchoolStatePanel(
            icon: Icons.table_chart_outlined,
            title: 'Students table not set up',
            message: 'A school manager needs to open this area once to create the student registration table.',
          ),
        );
      }
      return Padding(
        padding: const EdgeInsets.all(16),
        child: SchoolStatePanel(
          icon: Icons.table_chart_outlined,
          title: 'Create student registration table',
          message: bootstrapError.value ??
              'Add columns for the fields you track, then add rows for each student.',
          actionLabel: 'Create table',
          onAction: () => ensureTable(),
        ),
      );
    }

    final boardQuery = (
      orgId: orgId,
      schoolId: schoolId,
      instanceId: instanceId.value!,
    );
    final board = ref.watch(mtInstanceBoardProvider(boardQuery));

    return ListenableBuilder(
      listenable: board,
      builder: (context, _) {
        final boardState = board.state;

        if (boardState.isLoadingBundle && boardState.bundle == null) {
          return const Padding(
            padding: EdgeInsets.symmetric(vertical: 48),
            child: Center(child: DlLoadingIndicator()),
          );
        }

        final bundle = boardState.bundle;
        if (bundle == null) {
          return Padding(
            padding: const EdgeInsets.all(16),
            child: SchoolStatePanel(
              icon: Icons.error_outline_rounded,
              title: 'Could not load students table',
              message: boardState.errorMessage ?? 'Pull to refresh.',
            ),
          );
        }

        final groups = bundle.instance.tableGroups;
        final mainGroup = groups.isNotEmpty ? groups.first : MtTableGroupModel.fallbackMain();

        return Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (studentItem.description != null && studentItem.description!.trim().isNotEmpty) ...[
                Text(
                  studentItem.description!,
                  style: const TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              const Text(
                'Add columns to define student fields, then tap Add row for each student. '
                'Pick a student in the Student column to register them at this school.',
                style: TextStyle(
                  fontSize: 13,
                  height: 1.4,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 16),
              MtGroupSection(
                boardQuery: boardQuery,
                groupId: mainGroup.id,
                groupTitle: mainGroup.title,
                definition: bundle.definition,
                canMutate: canMutate,
                personPicker: 'platform',
              ),
            ],
          ),
        );
      },
    );
  }
}
