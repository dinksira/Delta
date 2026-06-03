import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/shell/school_hub_tab.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_floating_bottom_nav.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// School product hub — app theme + floating bottom navigation.
class SchoolHubShell extends StatelessWidget {
  const SchoolHubShell({required this.child, super.key});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final location = GoRouterState.of(context).uri.path;
    final currentTab = _resolveTab(location);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _handleBack(context, location);
      },
      child: Scaffold(
      backgroundColor: AppColors.surfaceGrey,
      extendBody: true,
      appBar: AppBar(
        backgroundColor: AppColors.surfaceGrey,
        foregroundColor: AppColors.primary,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          onPressed: () => _handleBack(context, location),
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        ),
        title: const Text(
          'School',
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.primary,
          ),
        ),
      ),
      body: Padding(
        padding: EdgeInsets.only(
          bottom: currentTab != null
              ? SchoolFloatingBottomNav.fabSize +
                  SchoolFloatingBottomNav.bottomInset +
                  MediaQuery.paddingOf(context).bottom
              : 0,
        ),
        child: child,
      ),
      bottomNavigationBar: currentTab != null
          ? SchoolFloatingBottomNav(currentTab: currentTab)
          : null,
      ),
    );
  }

  /// Back from a hub tab → home first; from home → leave the hub (features if stack was replaced by `go`).
  static void _handleBack(BuildContext context, String location) {
    final onHubHome = location == AppRoutes.workspaceSchool;
    if (!onHubHome && _isHubTabRoute(location)) {
      context.pop();
      return;
    }

    if (context.canPop()) {
      context.pop();
    } else {
      context.go(AppRoutes.featuresHub);
    }
  }

  static bool _isHubTabRoute(String location) {
    return SchoolHubTab.values.any((tab) => tab.route == location);
  }

  SchoolHubTab? _resolveTab(String location) {
    if (location.startsWith(AppRoutes.workspaceSchoolDetail) ||
        location.startsWith(AppRoutes.workspaceSchoolCreate) ||
        location.startsWith(AppRoutes.workspaceSchoolEditPrefix)) {
      return null;
    }
    if (location.startsWith('${AppRoutes.workspaceSchoolMarketplace}/') &&
        location != AppRoutes.workspaceSchoolMarketplace) {
      return null;
    }
    for (final tab in SchoolHubTab.values) {
      if (location == tab.route) return tab;
    }
    if (location == AppRoutes.workspaceSchool) return SchoolHubTab.home;
    return null;
  }
}
