import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

class SchoolWorkspaceBreadcrumb extends StatelessWidget {
  const SchoolWorkspaceBreadcrumb({
    required this.segments,
    required this.onRootTap,
    required this.onSegmentTap,
    this.departmentRootLabel,
    this.onDepartmentRootTap,
    super.key,
  });

  final List<({String id, String label, bool loading})> segments;
  final VoidCallback onRootTap;
  final void Function(int index) onSegmentTap;
  final String? departmentRootLabel;
  final VoidCallback? onDepartmentRootTap;

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          _Crumb(
            label: 'Root',
            active: segments.isEmpty && departmentRootLabel == null,
            onTap: onRootTap,
          ),
          if (departmentRootLabel != null) ...[
            const _Separator(),
            _Crumb(
              label: departmentRootLabel!,
              active: segments.isEmpty,
              onTap: onDepartmentRootTap,
            ),
          ],
          for (var i = 0; i < segments.length; i++) ...[
            const _Separator(),
            _Crumb(
              label: segments[i].loading ? '…' : segments[i].label,
              active: i == segments.length - 1,
              onTap: () => onSegmentTap(i),
            ),
          ],
        ],
      ),
    );
  }
}

class _Separator extends StatelessWidget {
  const _Separator();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 4),
      child: Text('/', style: TextStyle(color: AppColors.textHint, fontSize: 13)),
    );
  }
}

class _Crumb extends StatelessWidget {
  const _Crumb({
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
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Text(
          label,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: active ? AppColors.textPrimary : AppColors.primary,
          ),
        ),
      ),
    );
  }
}
