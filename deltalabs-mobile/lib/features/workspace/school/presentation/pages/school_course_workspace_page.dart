import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/course_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/course/course_coming_soon_panel.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/course/course_intro_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/course/course_workspace_section_tabs.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_simple_back_header.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:go_router/go_router.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

class SchoolCourseWorkspacePage extends HookConsumerWidget {
  const SchoolCourseWorkspacePage({
    required this.schoolId,
    required this.courseItemId,
    this.school,
    this.initialTab = CourseWorkspaceConstants.defaultTab,
    super.key,
  });

  final String schoolId;
  final String courseItemId;
  final MySchoolModel? school;
  final String initialTab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final schoolsAsync = ref.watch(myActiveSchoolsProvider);
    final currentTab = useState(AppRoutes.parseCourseWorkspaceTab(initialTab));

    useEffect(() {
      currentTab.value = AppRoutes.parseCourseWorkspaceTab(initialTab);
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
          title: 'Could not load course',
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
              title: 'Course unavailable',
              message: 'School membership could not be resolved.',
            ),
          );
        }

        final orgId = current.orgId;
        final courseItemAsync = ref.watch(
          schoolWorkspaceItemProvider((
            orgId: orgId,
            schoolId: schoolId,
            itemId: courseItemId,
          )),
        );
        final accessAsync = ref.watch(schoolOrgAccessProvider(orgId));
        final canMutate = accessAsync.maybeWhen(
          data: (access) => access.canManageSchoolWorkspace,
          orElse: () => false,
        );

        void navigateTab(String tabId) {
          currentTab.value = tabId;
          final instanceId = AppRoutes.instanceIdFrom(GoRouterState.of(context).uri);
          context.go(
            AppRoutes.workspaceSchoolCourseUri(
              schoolId,
              courseItemId,
              tab: tabId,
              instanceId: instanceId,
            ),
            extra: current,
          );
        }

        Future<void> refresh() async {
          ref.invalidate(
            schoolWorkspaceItemProvider((
              orgId: orgId,
              schoolId: schoolId,
              itemId: courseItemId,
            )),
          );
        }

        Widget buildHeader({required String courseTitle}) {
          return SchoolSimpleBackHeader(
            title: courseTitle,
            onBack: () {
              if (context.canPop()) {
                context.pop();
              } else {
                context.go(AppRoutes.workspaceSchoolDetailPath(schoolId));
              }
            },
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: 'Integrate',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Integrate is coming soon'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.bolt_outlined, color: AppColors.primary),
                ),
                IconButton(
                  tooltip: 'Automate',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Automate is coming soon'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.smart_toy_outlined, color: AppColors.primary),
                ),
                IconButton(
                  tooltip: 'Invite',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Invite is coming soon'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.person_add_alt_1_outlined, color: AppColors.primary),
                ),
                IconButton(
                  tooltip: 'Run',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Run is coming soon'),
                        behavior: SnackBarBehavior.floating,
                      ),
                    );
                  },
                  icon: const Icon(Icons.play_arrow_rounded, color: AppColors.primary),
                ),
              ],
            ),
          );
        }

        return courseItemAsync.when(
          loading: () => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              children: [
                buildHeader(courseTitle: 'Course'),
                const Expanded(child: Center(child: DlLoadingIndicator())),
              ],
            ),
          ),
          error: (_, __) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              children: [
                buildHeader(courseTitle: 'Course'),
                Expanded(
                  child: SchoolStatePanel(
                    icon: Icons.error_outline_rounded,
                    title: 'Course not found',
                    message: 'This course may have been removed.',
                    actionLabel: 'Back',
                    onAction: () => context.pop(),
                  ),
                ),
              ],
            ),
          ),
          data: (courseItem) => Scaffold(
            backgroundColor: AppColors.surfaceGrey,
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                buildHeader(courseTitle: courseItem.title),
                const SizedBox(height: 8),
                CourseWorkspaceSectionTabs(
                  currentTabId: currentTab.value,
                  onTabChanged: navigateTab,
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: RefreshIndicator(
                    color: AppColors.primary,
                    onRefresh: refresh,
                    child: currentTab.value == 'intro'
                        ? CourseIntroTab(
                            orgId: orgId,
                            schoolId: schoolId,
                            courseItem: courseItem,
                            canMutate: canMutate,
                            onSaved: refresh,
                          )
                        : ListView(
                            physics: const AlwaysScrollableScrollPhysics(),
                            children: [
                              CourseComingSoonPanel(tabId: currentTab.value),
                            ],
                          ),
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
