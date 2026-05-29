import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:flutter/material.dart';

enum SchoolEntityCardVariant { portal, archive }

/// School card matching web `SchoolEntityCard` layout.
class SchoolEntityCard extends StatelessWidget {
  const SchoolEntityCard({
    required this.school,
    required this.onPrimaryAction,
    this.onDetailsAction,
    this.onEditAction,
    this.onArchiveAction,
    this.variant = SchoolEntityCardVariant.portal,
    this.primaryLabel,
    super.key,
  });

  final MySchoolModel school;
  final VoidCallback onPrimaryAction;
  final VoidCallback? onDetailsAction;
  final VoidCallback? onEditAction;
  final VoidCallback? onArchiveAction;
  final SchoolEntityCardVariant variant;
  final String? primaryLabel;

  bool get _showMenu => onEditAction != null || onArchiveAction != null;

  @override
  Widget build(BuildContext context) {
    final locationLabel = school.schoolType.isEmpty
        ? 'School'
        : school.schoolType.replaceAll('_', ' ');
    final orgLabel = school.slug.isEmpty ? 'org' : school.slug;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.75)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      padding: const EdgeInsets.all(16),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              if (_showMenu) const SizedBox(height: 8),
              _SchoolLogo(name: school.name),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      school.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 17,
                        fontWeight: FontWeight.w700,
                        height: 1.25,
                      ),
                    ),
                  ),
                  if (onDetailsAction != null) ...[
                    const SizedBox(width: 8),
                    _DetailsChip(onTap: onDetailsAction!),
                  ],
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _MetaRow(
                      icon: Icons.location_on_outlined,
                      label: locationLabel,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _MetaRow(
                      icon: Icons.people_outline_rounded,
                      label: 'Org: $orgLabel',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _PrimaryButton(
                label: primaryLabel ??
                    (variant == SchoolEntityCardVariant.archive
                        ? 'Restore'
                        : 'Go to School'),
                variant: variant,
                onPressed: onPrimaryAction,
              ),
            ],
          ),
          if (_showMenu)
            Positioned(
              top: 0,
              right: 0,
              child: _CardMenu(
                onEdit: onEditAction,
                onArchive: onArchiveAction,
              ),
            ),
        ],
      ),
    );
  }
}

class _SchoolLogo extends StatelessWidget {
  const _SchoolLogo({required this.name});

  final String name;

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'S';

    return Center(
      child: Container(
        width: 88,
        height: 88,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: Colors.white,
          border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
        ),
        alignment: Alignment.center,
        child: CircleAvatar(
          radius: 40,
          backgroundColor: AppColors.primary.withValues(alpha: 0.08),
          child: Text(
            initial,
            style: const TextStyle(
              color: AppColors.primary,
              fontSize: 32,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }
}

class _DetailsChip extends StatelessWidget {
  const _DetailsChip({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.surfaceGrey,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
        ),
        child: const Text(
          'Details',
          style: TextStyle(
            color: AppColors.textSecondary,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }
}

class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.icon, required this.label});

  final IconData icon;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.textSecondary),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}

class _PrimaryButton extends StatelessWidget {
  const _PrimaryButton({
    required this.label,
    required this.variant,
    required this.onPressed,
  });

  final String label;
  final SchoolEntityCardVariant variant;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final isArchive = variant == SchoolEntityCardVariant.archive;

    return FilledButton(
      onPressed: onPressed,
      style: FilledButton.styleFrom(
        backgroundColor: isArchive ? AppColors.surfaceGrey : AppColors.primary,
        foregroundColor: isArchive ? AppColors.primary : Colors.white,
        minimumSize: const Size.fromHeight(44),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
          side: isArchive
              ? BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.8))
              : BorderSide.none,
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: isArchive ? AppColors.primary : Colors.white,
            ),
          ),
          if (!isArchive) ...[
            const SizedBox(width: 8),
            Icon(
              Icons.open_in_new_rounded,
              size: 18,
              color: Colors.white.withValues(alpha: 0.95),
            ),
          ],
        ],
      ),
    );
  }
}

class _CardMenu extends StatelessWidget {
  const _CardMenu({this.onEdit, this.onArchive});

  final VoidCallback? onEdit;
  final VoidCallback? onArchive;

  @override
  Widget build(BuildContext context) {
    return PopupMenuButton<String>(
      icon: const Icon(Icons.more_vert_rounded, color: AppColors.textSecondary, size: 22),
      padding: EdgeInsets.zero,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      onSelected: (value) {
        if (value == 'edit') onEdit?.call();
        if (value == 'archive') onArchive?.call();
      },
      itemBuilder: (context) => [
        if (onEdit != null)
          const PopupMenuItem(
            value: 'edit',
            child: _MenuRow(
              icon: Icons.edit_outlined,
              label: 'Edit',
              color: AppColors.primary,
            ),
          ),
        if (onArchive != null)
          const PopupMenuItem(
            value: 'archive',
            child: _MenuRow(
              icon: Icons.archive_outlined,
              label: 'Archive',
              color: Color(0xFFB4233C),
            ),
          ),
      ],
    );
  }
}

class _MenuRow extends StatelessWidget {
  const _MenuRow({
    required this.icon,
    required this.label,
    required this.color,
  });

  final IconData icon;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 18, color: color),
        const SizedBox(width: 10),
        Text(
          label,
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: color),
        ),
      ],
    );
  }
}
