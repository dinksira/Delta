import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/shell/school_hub_tab.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

/// Floating pill bottom bar (ClickUp-style) for the School hub.
class SchoolFloatingBottomNav extends StatelessWidget {
  const SchoolFloatingBottomNav({
    required this.currentTab,
    super.key,
  });

  final SchoolHubTab currentTab;

  static const double barHeight = 68;
  static const double bottomInset = 12;
  static const double fabSize = 56;

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(16, 0, 16, bottom + bottomInset),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Container(
              height: barHeight,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 20,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Row(
                children: [
                  for (final tab in SchoolHubTab.values)
                    Expanded(
                      child: _NavSlot(
                        tab: tab,
                        selected: tab == currentTab,
                        onTap: () {
                          if (tab != currentTab) {
                            final instanceId =
                                AppRoutes.instanceIdFrom(GoRouterState.of(context).uri);
                            var route = tab.route;
                            if (instanceId != null && instanceId.isNotEmpty) {
                              route = AppRoutes.attachInstance(route, instanceId);
                            }
                            context.go(route);
                          }
                        },
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Material(
            color: AppColors.primary,
            elevation: 4,
            shadowColor: AppColors.primary.withValues(alpha: 0.35),
            shape: const CircleBorder(),
            child: InkWell(
              onTap: () => context.push(AppRoutes.workspaceSchoolCreate),
              customBorder: const CircleBorder(),
              child: const SizedBox(
                width: fabSize,
                height: fabSize,
                child: Icon(Icons.add_rounded, color: Colors.white, size: 28),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _NavSlot extends StatelessWidget {
  const _NavSlot({
    required this.tab,
    required this.selected,
    required this.onTap,
  });

  final SchoolHubTab tab;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected ? AppColors.primary : AppColors.textSecondary;

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: SizedBox(
        height: SchoolFloatingBottomNav.barHeight,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: selected
                    ? AppColors.primary.withValues(alpha: 0.12)
                    : Colors.transparent,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(tab.icon, size: 20, color: color),
            ),
            const SizedBox(height: 2),
            Text(
              tab.label,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                fontSize: 9,
                height: 1.1,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
