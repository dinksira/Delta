import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/offer_share_access_list.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

/// Rich school detail bottom sheet (same layout language as offer details).
class SchoolDetailSheet extends ConsumerWidget {
  const SchoolDetailSheet({
    required this.school,
    this.onOpenSchool,
    this.onEdit,
    super.key,
  });

  final MySchoolModel school;
  final VoidCallback? onOpenSchool;
  final VoidCallback? onEdit;

  static Future<void> show(
    BuildContext context, {
    required MySchoolModel school,
    VoidCallback? onOpenSchool,
    VoidCallback? onEdit,
  }) {
    final maxSheetHeight = MediaQuery.sizeOf(context).height * 0.92;

    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: false,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxSheetHeight),
          child: SchoolDetailSheet(
            school: school,
            onOpenSchool: onOpenSchool,
            onEdit: onEdit,
          ),
        ),
      ),
    );
  }

  String get _rolesLabel => school.roleKeys.isEmpty
      ? 'Member'
      : school.roleKeys.map((r) => r.replaceAll('_', ' ')).join(', ');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final systemBottom = MediaQuery.paddingOf(context).bottom;
    final canFetch = school.orgId.isNotEmpty;

    final detailAsync = canFetch
        ? ref.watch(
            schoolDetailProvider((orgId: school.orgId, schoolId: school.schoolId)),
          )
        : null;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Color(0x1A000000),
              blurRadius: 24,
              offset: Offset(0, -8),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 10),
            Container(
              width: 44,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.divider,
                borderRadius: BorderRadius.circular(999),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.6)),
                    ),
                    child: const Text(
                      'School details',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Flexible(
              fit: FlexFit.loose,
              child: detailAsync == null
                  ? _ContentBody(
                      school: school,
                      detail: null,
                      rolesLabel: _rolesLabel,
                    )
                  : detailAsync.when(
                      loading: () => const Padding(
                        padding: EdgeInsets.symmetric(vertical: 48),
                        child: Center(child: DlLoadingIndicator()),
                      ),
                      error: (_, __) => _ContentBody(
                        school: school,
                        detail: null,
                        rolesLabel: _rolesLabel,
                        loadError: true,
                      ),
                      data: (detail) => _ContentBody(
                        school: school,
                        detail: detail,
                        rolesLabel: _rolesLabel,
                      ),
                    ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 16 + systemBottom),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (onOpenSchool != null) ...[
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        onPressed: () {
                          Navigator.of(context).pop();
                          onOpenSchool!();
                        },
                        icon: const Icon(Icons.open_in_new_rounded, size: 18),
                        label: const Text('Go to School'),
                        style: FilledButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                  ],
                  Row(
                    children: [
                      if (onEdit != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () {
                              Navigator.of(context).pop();
                              onEdit!();
                            },
                            icon: const Icon(Icons.edit_outlined, size: 18),
                            label: const Text('Edit'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(vertical: 13),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      if (onEdit != null) const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => Navigator.of(context).pop(),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.textSecondary,
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                          child: const Text('Close'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ContentBody extends StatelessWidget {
  const _ContentBody({
    required this.school,
    required this.detail,
    required this.rolesLabel,
    this.loadError = false,
  });

  final MySchoolModel school;
  final SchoolDetailModel? detail;
  final String rolesLabel;
  final bool loadError;

  String get _name => detail?.name ?? school.name;
  String get _schoolType =>
      (detail?.schoolType ?? school.schoolType).replaceAll('_', ' ');
  String get _slug => detail?.slug ?? school.slug;
  bool get _archived => detail?.archived ?? school.archived;

  String get _statusSubtitle {
    final parts = <String>[];
    parts.add(_archived ? 'Archived' : 'Active');
    if (detail != null) {
      parts.add(_formatOnboarding(detail!.onboardingStatus));
    }
    if (_schoolType.isNotEmpty) parts.add(_schoolType);
    return parts.join(' · ');
  }

  double get _ownershipTotal => (detail?.partners ?? [])
      .fold<double>(0, (sum, p) => sum + (double.tryParse(p.ownershipPercentage) ?? 0));

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _HeroCard(
            name: _name,
            logoUrl: detail?.logoUrl,
            subtitle: _statusSubtitle,
            meta: _buildHeroMeta(),
          ),
          if (loadError) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.error.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.error.withValues(alpha: 0.2)),
              ),
              child: const Text(
                'Could not load full school profile. Showing summary from your membership.',
                style: TextStyle(fontSize: 13, color: AppColors.error, height: 1.4),
              ),
            ),
          ],
          const SizedBox(height: 16),
          _SectionCard(
            title: 'School overview',
            icon: Icons.school_outlined,
            children: [
              _InfoTile(label: 'School name', value: _name),
              _InfoTile(label: 'School type', value: _schoolType.isEmpty ? '—' : _schoolType),
              _InfoTile(
                label: 'Contact email',
                value: detail?.email?.trim().isNotEmpty == true ? detail!.email! : 'Not set',
              ),
              _InfoTile(label: 'Organization slug', value: _slug.isEmpty ? '—' : _slug),
              if (detail != null)
                _InfoTile(label: 'Organization ID', value: detail!.orgId),
            ],
          ),
          const SizedBox(height: 12),
          _SectionCard(
            title: 'Your membership',
            icon: Icons.badge_outlined,
            children: [
              _InfoTile(label: 'Your roles', value: rolesLabel),
              _InfoTile(
                label: 'School ID',
                value: detail?.id ?? school.schoolId,
              ),
              _InfoTile(
                label: 'Status',
                value: _archived ? 'Archived' : 'Active',
              ),
            ],
          ),
          if (detail != null && detail!.partners.isNotEmpty) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: 'Owners and partners',
              icon: Icons.groups_outlined,
              children: [
                Text(
                  'Total ownership: ${_ownershipTotal.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '')}%',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 10),
                ...detail!.partners.map(
                  (partner) => _PartnerTile(partner: partner),
                ),
              ],
            ),
          ],
          if (detail != null &&
              detail!.partners.any((p) => p.shareAccesses.isNotEmpty)) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: 'Share access',
              icon: Icons.vpn_key_outlined,
              children: [
                const Text(
                  'Access levels configured for school partners:',
                  style: TextStyle(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 10),
                ...detail!.partners.where((p) => p.shareAccesses.isNotEmpty).map(
                      (partner) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              partner.fullName,
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                            if (partner.email.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                partner.email,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textHint,
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            OfferShareAccessList(
                              accesses: partner.shareAccesses.isEmpty
                                  ? defaultShareAccesses()
                                  : partner.shareAccesses,
                            ),
                          ],
                        ),
                      ),
                    ),
              ],
            ),
          ],
          if (detail != null && detail!.customFields.isNotEmpty) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: 'Custom fields',
              icon: Icons.tune_outlined,
              children: detail!.customFields
                  .map(
                    (field) => _InfoTile(
                      label: field.key,
                      value: field.value,
                    ),
                  )
                  .toList(),
            ),
          ],
          if (detail != null && detail!.documents.isNotEmpty) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: 'Documents',
              icon: Icons.description_outlined,
              children: detail!.documents
                  .map(
                    (doc) => _InfoTile(
                      label: doc.title.isEmpty ? 'Document' : doc.title,
                      value: doc.url.isEmpty ? 'No URL' : doc.url,
                    ),
                  )
                  .toList(),
            ),
          ],
          if (detail != null &&
              (detail!.createdAt != null || detail!.updatedAt != null)) ...[
            const SizedBox(height: 12),
            _SectionCard(
              title: 'Activity',
              icon: Icons.schedule_outlined,
              children: [
                if (detail!.createdAt != null)
                  _InfoTile(
                    label: 'Created',
                    value: _formatDate(detail!.createdAt!),
                  ),
                if (detail!.updatedAt != null)
                  _InfoTile(
                    label: 'Last updated',
                    value: _formatDate(detail!.updatedAt!),
                  ),
                _InfoTile(
                  label: 'Onboarding',
                  value: _formatOnboarding(detail!.onboardingStatus),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  String? _buildHeroMeta() {
    if (detail?.createdAt != null) {
      return 'Created ${_formatDate(detail!.createdAt!)}';
    }
    if (detail?.updatedAt != null) {
      return 'Updated ${_formatDate(detail!.updatedAt!)}';
    }
    return null;
  }

  static String _formatDate(DateTime date) {
    return DateFormat.yMMMd().add_jm().format(date.toLocal());
  }

  static String _formatOnboarding(String raw) {
    return switch (raw) {
      'pending_partner_acceptance' => 'Pending partner acceptance',
      'active' => 'Active',
      _ => raw.replaceAll('_', ' '),
    };
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.name,
    required this.subtitle,
    this.logoUrl,
    this.meta,
  });

  final String name;
  final String subtitle;
  final String? logoUrl;
  final String? meta;

  @override
  Widget build(BuildContext context) {
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'S';
    final hasLogo = logoUrl != null && logoUrl!.trim().isNotEmpty;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
            ),
            clipBehavior: Clip.antiAlias,
            child: hasLogo
                ? Image.network(
                    logoUrl!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _InitialAvatar(initial: initial),
                  )
                : _InitialAvatar(initial: initial),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w800,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                ),
                if (meta != null) ...[
                  const SizedBox(height: 10),
                  Text(
                    meta!,
                    style: const TextStyle(fontSize: 12, color: AppColors.textHint),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _InitialAvatar extends StatelessWidget {
  const _InitialAvatar({required this.initial});

  final String initial;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.primary.withValues(alpha: 0.08),
      child: Center(
        child: Text(
          initial,
          style: const TextStyle(
            color: AppColors.primary,
            fontSize: 24,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}

class _PartnerTile extends StatelessWidget {
  const _PartnerTile({required this.partner});

  final SchoolPartner partner;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            partner.fullName,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          if (partner.email.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              partner.email,
              style: const TextStyle(fontSize: 12, color: AppColors.textHint),
            ),
          ],
          const SizedBox(height: 6),
          Text(
            '${partner.ownershipPercentage}% ownership',
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: AppColors.primary,
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({
    required this.title,
    required this.icon,
    required this.children,
  });

  final String title;
  final IconData icon;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.label,
    required this.value,
  });

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.5)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.8,
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }
}
