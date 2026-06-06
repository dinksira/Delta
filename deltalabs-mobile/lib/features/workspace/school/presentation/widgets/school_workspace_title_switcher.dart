import 'package:deltalabs_mobile/core/routing/app_routes.dart';
import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/features/presentation/providers/features_hub_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/utils/school_workspace_navigation.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// ClickUp-style top-left workspace switcher: square icon · name · chevron.
class SchoolWorkspaceTitleSwitcher extends ConsumerWidget {
  const SchoolWorkspaceTitleSwitcher({
    required this.currentSchool,
    required this.schools,
    this.featureInstanceId,
    super.key,
  });

  final MySchoolModel currentSchool;
  final List<MySchoolModel> schools;
  final String? featureInstanceId;

  bool get _canSwitch => schools.length > 1;

  Future<void> _openSwitcher(BuildContext context, WidgetRef ref) async {
    if (!_canSwitch) return;

    final box = context.findRenderObject() as RenderBox?;
    if (box == null || !box.hasSize) return;

    final offset = box.localToGlobal(Offset.zero);
    final top = offset.dy + box.size.height + 4;
    final left = offset.dx;

    final selected = await SchoolWorkspaceSwitcherDropdown.show(
      context,
      top: top,
      left: left,
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

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: _canSwitch ? () => _openSwitcher(context, ref) : null,
        borderRadius: BorderRadius.circular(8),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
          child: Row(
            children: [
              _SchoolMark(name: currentSchool.name),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  currentSchool.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                    height: 1.2,
                  ),
                ),
              ),
              if (_canSwitch)
                const Padding(
                  padding: EdgeInsets.only(left: 2),
                  child: Icon(
                    Icons.keyboard_arrow_down_rounded,
                    size: 22,
                    color: AppColors.textSecondary,
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

/// App bar with optional back + left-aligned school switcher (ClickUp layout).
class SchoolWorkspaceTopBar extends StatelessWidget implements PreferredSizeWidget {
  const SchoolWorkspaceTopBar({
    required this.currentSchool,
    required this.schools,
    this.showBack = true,
    this.featureInstanceId,
    super.key,
  });

  final MySchoolModel currentSchool;
  final List<MySchoolModel> schools;
  final bool showBack;
  final String? featureInstanceId;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final canPop = showBack;

    return AppBar(
      backgroundColor: AppColors.surfaceGrey,
      foregroundColor: AppColors.primary,
      elevation: 0,
      scrolledUnderElevation: 0,
      automaticallyImplyLeading: false,
      centerTitle: false,
      titleSpacing: 0,
      flexibleSpace: SafeArea(
        bottom: false,
        child: Padding(
          padding: EdgeInsets.only(left: canPop ? 0 : 12, right: 12),
          child: Row(
            children: [
              if (canPop)
                IconButton(
                  onPressed: () => SchoolWorkspaceNavigation.backFromDetail(
                    context,
                    featureInstanceId: featureInstanceId,
                  ),
                  icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
                ),
              Expanded(
                child: SchoolWorkspaceTitleSwitcher(
                  currentSchool: currentSchool,
                  schools: schools,
                  featureInstanceId: featureInstanceId,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Dropdown panel anchored under the title (not a bottom sheet).
class SchoolWorkspaceSwitcherDropdown extends StatefulWidget {
  const SchoolWorkspaceSwitcherDropdown({
    required this.schools,
    required this.currentSchoolId,
    super.key,
  });

  final List<MySchoolModel> schools;
  final String currentSchoolId;

  static Future<MySchoolModel?> show(
    BuildContext context, {
    required double top,
    required double left,
    required List<MySchoolModel> schools,
    required String currentSchoolId,
  }) {
    return showGeneralDialog<MySchoolModel>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Dismiss',
      barrierColor: Colors.black.withValues(alpha: 0.25),
      transitionDuration: const Duration(milliseconds: 160),
      pageBuilder: (ctx, _, __) => Stack(
        children: [
          Positioned(
            top: top,
            left: left.clamp(8.0, MediaQuery.sizeOf(ctx).width - 288),
            child: Material(
              color: Colors.transparent,
              child: SchoolWorkspaceSwitcherDropdown(
                schools: schools,
                currentSchoolId: currentSchoolId,
              ),
            ),
          ),
        ],
      ),
      transitionBuilder: (ctx, anim, _, child) {
        return FadeTransition(
          opacity: anim,
          child: ScaleTransition(
            scale: Tween<double>(begin: 0.96, end: 1).animate(
              CurvedAnimation(parent: anim, curve: Curves.easeOutCubic),
            ),
            alignment: Alignment.topLeft,
            child: child,
          ),
        );
      },
    );
  }

  @override
  State<SchoolWorkspaceSwitcherDropdown> createState() =>
      _SchoolWorkspaceSwitcherDropdownState();
}

class _SchoolWorkspaceSwitcherDropdownState extends State<SchoolWorkspaceSwitcherDropdown> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<MySchoolModel> get _filtered {
    final q = _query.trim().toLowerCase();
    if (q.isEmpty) return widget.schools;
    return widget.schools
        .where(
          (s) =>
              s.name.toLowerCase().contains(q) ||
              s.slug.toLowerCase().contains(q) ||
              s.schoolType.toLowerCase().contains(q),
        )
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filtered;
    final screenH = MediaQuery.sizeOf(context).height;

    return Container(
      width: 280,
      constraints: BoxConstraints(maxHeight: screenH * 0.52),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.55)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.12),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 12, 12, 8),
            child: TextField(
              controller: _searchCtrl,
              autofocus: true,
              onChanged: (v) => setState(() => _query = v),
              style: const TextStyle(fontSize: 14),
              decoration: InputDecoration(
                hintText: 'Search schools',
                hintStyle: const TextStyle(color: AppColors.textHint, fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, size: 18, color: AppColors.textHint),
                isDense: true,
                filled: true,
                fillColor: AppColors.surfaceGrey,
                contentPadding: const EdgeInsets.symmetric(vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),
          const Divider(height: 1, color: AppColors.divider),
          Flexible(
            child: filtered.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(20),
                    child: Text(
                      'No schools found',
                      style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 2),
                    itemBuilder: (context, index) {
                      final school = filtered[index];
                      final selected = school.schoolId == widget.currentSchoolId;
                      return _DropdownSchoolRow(
                        school: school,
                        selected: selected,
                        onTap: selected
                            ? null
                            : () => Navigator.of(context).pop(school),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _DropdownSchoolRow extends StatelessWidget {
  const _DropdownSchoolRow({
    required this.school,
    required this.selected,
    this.onTap,
  });

  final MySchoolModel school;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.surfaceGrey : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              _SchoolMark(name: school.name, size: 28),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  school.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? AppColors.primary : AppColors.textPrimary,
                  ),
                ),
              ),
              if (selected)
                const Icon(Icons.check_rounded, size: 18, color: AppColors.primary),
            ],
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

/// Backwards-compatible alias for any callers using the old sheet API.
typedef SchoolWorkspaceSwitcherSheet = SchoolWorkspaceSwitcherDropdown;
