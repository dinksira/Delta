import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/offer_amendment_payload.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/offer_share_access_list.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

/// Content-sized bottom sheet for offer details (overlays School hub nav).
class SchoolOfferDetailSheet extends StatelessWidget {
  const SchoolOfferDetailSheet({
    required this.offer,
    super.key,
  });

  final SchoolOfferModel offer;

  static Future<void> show(BuildContext context, SchoolOfferModel offer) {
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
          child: SchoolOfferDetailSheet(offer: offer),
        ),
      ),
    );
  }

  String get _permissionLabel =>
      offer.offerKind == 'ownership' ? 'Ownership invitation' : 'Offer request';

  bool get _isMarketplace => offer.offerKind == 'marketplace_transfer';

  String get _allocation {
    if (offer.ownershipPercentage != null) {
      return '${offer.ownershipPercentage}% ownership';
    }
    if (offer.offeredPrice != null) {
      return 'Bid: ${offer.offeredCurrency ?? 'USD'} ${offer.offeredPrice}';
    }
    return 'Not specified';
  }

  List<SchoolShareAccess> get _shareAccesses => mergeOfferShareAccesses(
        amendmentData: offer.amendmentData,
        offerShareAccesses: offer.shareAccesses,
      );

  bool get _hasShareAccessData => offerHasShareAccessDataFrom(
        amendmentData: offer.amendmentData,
        offerShareAccesses: offer.shareAccesses,
      );

  @override
  Widget build(BuildContext context) {
    final systemBottom = MediaQuery.paddingOf(context).bottom;

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
                      'Offer details',
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
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _HeroCard(
                      schoolName: offer.schoolName,
                      subtitle: '$_permissionLabel · Status: ${offer.status}',
                      date: _formatDate(offer.requestedAt),
                    ),
                    const SizedBox(height: 16),
                    _SectionCard(
                      title: 'Allocation and offer details',
                      icon: Icons.assignment_outlined,
                      children: [
                        _InfoTile(label: 'Allocation', value: _allocation),
                        _InfoTile(
                          label: 'Partner',
                          value: offer.partyFullName ?? 'Unknown',
                          hint: offer.partyEmail,
                        ),
                        _InfoTile(
                          label: 'Offer source',
                          value: offer.senderEmail ?? 'Delta Labs',
                        ),
                      ],
                    ),
                    if (!_isMarketplace) ...[
                      const SizedBox(height: 12),
                      _SectionCard(
                        title: 'School share access',
                        icon: Icons.vpn_key_outlined,
                        children: [
                          Text(
                            _hasShareAccessData
                                ? 'Access granted to ${offer.partyFullName ?? 'this partner'}:'
                                : 'Access levels for ${offer.partyFullName ?? 'this partner'} (defaults shown if not yet assigned):',
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                              height: 1.45,
                            ),
                          ),
                          const SizedBox(height: 10),
                          OfferShareAccessList(accesses: _shareAccesses),
                        ],
                      ),
                    ],
                    const SizedBox(height: 12),
                    _SectionCard(
                      title: 'Permissions and next steps',
                      icon: Icons.shield_outlined,
                      children: [
                        const Text(
                          'This offer is managed through Delta Labs. The recipient may respond by '
                          'accepting, rejecting, or requesting an amendment.',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.45),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Current status: ${offer.status}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _SectionCard(
                      title: 'Recipient access',
                      icon: Icons.person_outline_rounded,
                      children: [
                        const Text(
                          'Only the recipient email below can update this offer.',
                          style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.45),
                        ),
                        const SizedBox(height: 8),
                        _InfoTile(
                          label: 'Recipient',
                          value: offer.recipientEmail ?? 'Not available',
                        ),
                      ],
                    ),
                    if (offer.note != null && offer.note!.trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _SectionCard(
                        title: 'Note',
                        icon: Icons.notes_outlined,
                        children: [
                          Text(
                            offer.note!,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textPrimary,
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(20, 8, 20, 16 + systemBottom),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: () => Navigator.of(context).pop(),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Close details'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat.yMMMd().format(parsed.toLocal());
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({
    required this.schoolName,
    required this.subtitle,
    required this.date,
  });

  final String schoolName;
  final String subtitle;
  final String date;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.surfaceGrey,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            schoolName,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.primary,
            ),
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: const TextStyle(fontSize: 13, color: AppColors.textSecondary)),
          const SizedBox(height: 10),
          Text(
            'Requested on $date',
            style: const TextStyle(fontSize: 12, color: AppColors.textHint),
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
    this.hint,
  });

  final String label;
  final String value;
  final String? hint;

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
          if (hint != null && hint!.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(hint!, style: const TextStyle(fontSize: 12, color: AppColors.textHint)),
          ],
        ],
      ),
    );
  }
}
