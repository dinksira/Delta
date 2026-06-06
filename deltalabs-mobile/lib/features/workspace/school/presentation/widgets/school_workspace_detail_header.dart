import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/school_workspace_navigation.dart';
import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_workspace_title_switcher.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Compact detail header — aligned with [SchoolInstanceBackBar] on the hub.
class SchoolWorkspaceDetailHeader extends ConsumerWidget {
  const SchoolWorkspaceDetailHeader({
    required this.currentSchool,
    required this.schools,
    required this.segments,
    required this.onRootTap,
    required this.onSegmentTap,
    this.featureInstanceId,
    this.departmentRootLabel,
    this.onDepartmentRootTap,
    super.key,
  });

  final MySchoolModel currentSchool;
  final List<MySchoolModel> schools;
  final List<({String id, String label, bool loading})> segments;
  final VoidCallback onRootTap;
  final void Function(int index) onSegmentTap;
  final String? featureInstanceId;
  final String? departmentRootLabel;
  final VoidCallback? onDepartmentRootTap;

  static const _horizontalPadding = EdgeInsets.fromLTRB(4, 2, 16, 6);

  bool get _canSwitchSchools => schools.length > 1;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: AppColors.surfaceGrey,
      child: Padding(
        padding: _horizontalPadding,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            IconButton(
              onPressed: () => SchoolWorkspaceNavigation.backFromDetail(
                context,
                featureInstanceId: featureInstanceId,
              ),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
              color: AppColors.primary,
              visualDensity: VisualDensity.compact,
              tooltip: 'Back to schools',
            ),
            Expanded(
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    _SchoolSwitcherChip(
                      school: currentSchool,
                      canSwitch: _canSwitchSchools,
                      onTap: _canSwitchSchools
                          ? () => _openSwitcher(context, ref)
                          : null,
                    ),
                    const _PathSeparator(),
                    _PathCrumb(
                      label: 'Root',
                      active: segments.isEmpty && departmentRootLabel == null,
                      onTap: onRootTap,
                    ),
                    if (departmentRootLabel != null) ...[
                      const _PathSeparator(),
                      _PathCrumb(
                        label: departmentRootLabel!,
                        active: segments.isEmpty,
                        onTap: onDepartmentRootTap,
                      ),
                    ],
                    for (var i = 0; i < segments.length; i++) ...[
                      const _PathSeparator(),
                      _PathCrumb(
                        label: segments[i].loading ? '…' : segments[i].label,
                        active: i == segments.length - 1,
                        onTap: () => onSegmentTap(i),
                      ),
                    ],
                    if (_canSwitchSchools) ...[
                      const SizedBox(width: 2),
                      IconButton(
                        onPressed: () => _openSwitcher(context, ref),
                        icon: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          size: 22,
                          color: AppColors.textSecondary,
                        ),
                        visualDensity: VisualDensity.compact,
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                        tooltip: 'Switch school',
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _openSwitcher(BuildContext context, WidgetRef ref) async {
    if (!_canSwitchSchools) return;

    final box = context.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;

    final offset = box.localToGlobal(Offset.zero);
    final selected = await SchoolWorkspaceSwitcherDropdown.show(
      context,
      top: offset.dy + box.size.height + 4,
      left: offset.dx,
      schools: schools,
      currentSchoolId: currentSchool.schoolId,
    );

    if (selected == null || selected.schoolId == currentSchool.schoolId) return;
    if (!context.mounted) return;

    final instanceId = featureInstanceId?.trim();
    if (instanceId != null && instanceId.isNotEmpty) {
      await ref
          .read(featuresHubProvider.notifier)
          .bindInstanceSchool(instanceId, selected.schoolId);
    }

    if (!context.mounted) return;
    var location = AppRoutes.workspaceSchoolDetailPath(selected.schoolId);
    if (instanceId != null && instanceId.isNotEmpty) {
      location = AppRoutes.attachInstance(location, instanceId);
    }
    context.pushReplacement(location, extra: selected);
  }
}

class _SchoolSwitcherChip extends StatelessWidget {
  const _SchoolSwitcherChip({
    required this.school,
    required this.canSwitch,
    this.onTap,
  });

  final MySchoolModel school;
  final bool canSwitch;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              _SchoolMark(name: school.name, size: 28),
              const SizedBox(width: 8),
              Text(
                school.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                  height: 1.2,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PathSeparator extends StatelessWidget {
  const _PathSeparator();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 6),
      child: Text(
        '/',
        style: TextStyle(
          color: AppColors.textHint,
          fontSize: 14,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _PathCrumb extends StatelessWidget {
  const _PathCrumb({
    required this.label,
    required this.active,
    this.onTap,
  });

  final String label;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(6),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 4),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: active ? AppColors.primary : AppColors.textSecondary,
            height: 1.2,
          ),
        ),
      ),
    );
  }
}

/// Rounded-square school mark (ClickUp workspace icon style).
class _SchoolMark extends StatelessWidget {
  const _SchoolMark({required this.name, this.size = 32});

  final String name;
  final double size;

  static const _palette = [
    Color(0xFFF5C542),
    Color(0xFF7CB342),
    Color(0xFF42A5F5),
    Color(0xFFAB47BC),
    Color(0xFFEF5350),
    Color(0xFF26A69A),
  ];

  @override
  Widget build(BuildContext context) {
    final initial = name.trim().isEmpty ? '?' : name.trim()[0].toUpperCase();
    final color = _palette[name.hashCode.abs() % _palette.length];
    final radius = size * 0.28;

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
      ),
      alignment: Alignment.center,
      child: Text(
        initial,
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w800,
          fontSize: size * 0.46,
          height: 1,
        ),
      ),
    );
  }
}
