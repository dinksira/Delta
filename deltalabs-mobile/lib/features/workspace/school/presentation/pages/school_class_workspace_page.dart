import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_session_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/class_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_attendance_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_coming_soon_panel.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_overview_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_grades_table_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_parents_table_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_students_table_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_teachers_table_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/class_workspace_utils.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_session_form_sheet.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_sessions_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/class/class_workspace_section_tabs.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_confirm_dialog.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_simple_back_header.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
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
    this.initialTab = ClassWorkspaceConstants.defaultTab,
    super.key,
  });

  final String schoolId;
  final String classItemId;
  final MySchoolModel? school;
  final String initialTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    final currentTab = useState(AppRoutes.parseClassWorkspaceTab(initialTab));
    final startingSessionId = useState<String?>(null);
    final creatingSession = useState(false);
    final savingSession = useState(false);

    useEffect(() {
      currentTab.value = AppRoutes.parseClassWorkspaceTab(initialTab);
      return null;
    }, [initialTab]);

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

        void navigateTab(String tabId) {
          currentTab.value = tabId;
          final instanceId = AppRoutes.instanceIdFrom(GoRouterState.of(context).uri);
          context.go(
            AppRoutes.workspaceSchoolClassUri(
              schoolId,
              classItemId,
              tab: tabId,
              instanceId: instanceId,
            ),
            extra: current,
          );
        }

        Future<void> refresh() async {
          ref.invalidate(schoolClassSessionsProvider(sessionsQuery));
          ref.invalidate(
            schoolClassAttendanceProvider((
              orgId: orgId,
              schoolId: schoolId,
              classWorkspaceItemId: classItemId,
            )),
          );
          ref.invalidate(
            schoolWorkspaceItemProvider((
              orgId: orgId,
              schoolId: schoolId,
              itemId: classItemId,
            )),
          );
        }

        Future<void> openCreateSessionSheet() async {
          final input = await ClassSessionFormSheet.showCreate(context);
          if (input == null) return;

          creatingSession.value = true;
          try {
            await ref.read(schoolRemoteDataSourceProvider).createClassSession(
                  orgId: orgId,
                  schoolId: schoolId,
                  classWorkspaceItemId: classItemId,
                  title: input.title,
                  description: input.description,
                  durationMinutes: input.durationMinutes,
                  weight: input.weight,
                  sessionType: input.sessionType,
                  scheduledAt: input.scheduledAt,
                );
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
            creatingSession.value = false;
          }
        }

        Future<void> editSession(SchoolClassSessionModel session) async {
          final input = await ClassSessionFormSheet.showEdit(context, session: session);
          if (input == null) return;

          savingSession.value = true;
          try {
            await ref.read(schoolRemoteDataSourceProvider).updateClassSession(
                  orgId: orgId,
                  schoolId: schoolId,
                  classWorkspaceItemId: classItemId,
                  sessionId: session.id,
                  title: input.title,
                  description: input.description,
                  durationMinutes: input.durationMinutes,
                  weight: input.weight,
                  sessionType: input.sessionType,
                  scheduledAt: input.scheduledAt,
                  status: input.status,
                );
            await refresh();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Session updated'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not update session'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } finally {
            savingSession.value = false;
          }
        }

        void openSessionRoom(SchoolClassSessionModel session) {
          final instanceId = AppRoutes.instanceIdFrom(GoRouterState.of(context).uri);
          context.push(
            AppRoutes.workspaceSchoolClassSessionUri(
              schoolId,
              classItemId,
              session.id,
              instanceId: instanceId,
            ),
            extra: current,
          );
        }

        Future<void> startSession(SchoolClassSessionModel session) async {
          startingSessionId.value = session.id;
          try {
            await ref.read(schoolRemoteDataSourceProvider).updateClassSession(
                  orgId: orgId,
                  schoolId: schoolId,
                  classWorkspaceItemId: classItemId,
                  sessionId: session.id,
                  status: 'live',
                );
            await refresh();
            if (context.mounted) openSessionRoom(session);
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not start session'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } finally {
            startingSessionId.value = null;
          }
        }

        Future<void> deleteSession(SchoolClassSessionModel session) async {
          final confirmed = await SchoolConfirmDialog.show(
            context,
            title: 'Delete session?',
            description: '“${session.title}” will be removed permanently.',
            confirmLabel: 'Delete',
            confirmColor: const Color(0xFFD32F2F),
          );
          if (confirmed != true) return;

          try {
            await ref.read(schoolRemoteDataSourceProvider).deleteClassSession(
                  orgId: orgId,
                  schoolId: schoolId,
                  classWorkspaceItemId: classItemId,
                  sessionId: session.id,
                );
            await refresh();
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Session deleted'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          } catch (_) {
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Could not delete session'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            }
          }
        }

        Widget buildTabBody(SchoolWorkspaceItemModel classItem) {
          final classMeta = ClassWorkspaceMeta.fromItem(classItem);
          switch (currentTab.value) {
            case 'sessions':
              return ClassSessionsTab(
                sessionsAsync: sessionsAsync,
                canMutate: canMutate,
                startingSessionId: startingSessionId.value,
                onStartSession: startSession,
                onJoinSession: openSessionRoom,
                onEditSession: editSession,
                onDeleteSession: deleteSession,
                onCreateSession: openCreateSessionSheet,
              );
            case 'people':
              return ClassStudentsTableTab(
                orgId: orgId,
                schoolId: schoolId,
                classItemId: classItemId,
                classItem: classItem,
                canMutate: canMutate,
                onTableReady: refresh,
              );
            case 'parents':
              return ClassParentsTableTab(
                orgId: orgId,
                schoolId: schoolId,
                classItemId: classItemId,
                classItem: classItem,
                canMutate: canMutate,
                onTableReady: refresh,
              );
            case 'attendance':
              return ClassAttendanceTab(
                orgId: orgId,
                schoolId: schoolId,
                classItemId: classItemId,
                classItem: classItem,
                canMutate: canMutate,
                onGoToSessions: () => navigateTab('sessions'),
              );
            case 'teachers':
              return ClassTeachersTableTab(
                orgId: orgId,
                schoolId: schoolId,
                classItemId: classItemId,
                classItem: classItem,
                canMutate: canMutate,
                onTableReady: refresh,
              );
            case 'grades':
              return ClassGradesTableTab(
                orgId: orgId,
                schoolId: schoolId,
                classItemId: classItemId,
                classItem: classItem,
                canMutate: canMutate,
                onTableReady: refresh,
              );
            case 'resources':
              return ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
                children: [ClassComingSoonPanel(tabId: currentTab.value)],
              );
            case 'overview':
            default:
              return ClassOverviewTab(
                classMeta: classMeta,
                classDescription: classItem.description,
                sessionsAsync: sessionsAsync,
                canMutate: canMutate,
                startingSessionId: startingSessionId.value,
                onTabChanged: navigateTab,
                onStartSession: startSession,
                onJoinSession: openSessionRoom,
                onEditSession: editSession,
                onDeleteSession: deleteSession,
                onCreateSession: openCreateSessionSheet,
              );
          }
        }

        Widget buildClassHeader({required String classTitle}) {
          return SchoolSimpleBackHeader(
            title: classTitle,
            onBack: () => context.pop(),
          );
        }

        final showSessionFab = canMutate && currentTab.value == 'sessions' && !savingSession.value;

        return classItemAsync.when(
          loading: () => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                buildClassHeader(classTitle: 'Class'),
                const Expanded(child: Center(child: DlLoadingIndicator())),
              ],
            ),
          ),
          error: (e, _) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                buildClassHeader(classTitle: 'Class'),
                Expanded(
                  child: ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      SchoolStatePanel(
                        icon: Icons.error_outline_rounded,
                        title: 'Class not found',
                        message: 'This class may have been removed.',
                        actionLabel: 'Back',
                        onAction: () => context.pop(),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          data: (classItem) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            floatingActionButton: showSessionFab
                ? FloatingActionButton.extended(
                    onPressed: creatingSession.value ? null : openCreateSessionSheet,
                    backgroundColor: AppColors.primary,
                    icon: creatingSession.value
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Icon(Icons.add_rounded, color: Colors.white),
                    label: Text(
                      creatingSession.value ? 'Creating…' : 'Session',
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  )
                : null,
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                buildClassHeader(classTitle: classItem.title),
                const SizedBox(height: 8),
                ClassWorkspaceSectionTabs(
                  currentTabId: currentTab.value,
                  onTabChanged: navigateTab,
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: refresh,
                    child: buildTabBody(classItem),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
