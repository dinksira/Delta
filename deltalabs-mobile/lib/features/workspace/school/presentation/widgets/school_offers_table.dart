import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/shared/widgets/management_table/dl_management_table.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

typedef SchoolOfferAction = void Function(SchoolOfferModel offer, String status);

class SchoolOffersTable extends ConsumerWidget {
  const SchoolOffersTable({
    required this.offers,
    required this.view,
    this.onShowDetails,
    this.onChangeStatus,
    super.key,
  });

  final List<SchoolOfferModel> offers;
  final String view;
  final void Function(SchoolOfferModel offer)? onShowDetails;
  final SchoolOfferAction? onChangeStatus;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionEmail = ref.watch(authProvider).value?.email?.trim().toLowerCase();

    final leading = DlManagementTableColumn<SchoolOfferModel>(
      id: 'select',
      header: '',
      minWidth: 40,
      align: TextAlign.center,
      cellBuilder: (_, row, __) => Checkbox(
        value: false,
        onChanged: null,
        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
        visualDensity: VisualDensity.compact,
      ),
    );

    final columns = <DlManagementTableColumn<SchoolOfferModel>>[
      DlManagementTableColumn(
        id: 'school',
        header: 'School',
        minWidth: 108,
        cellBuilder: (_, row, __) => Text(
          row.schoolName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        ),
      ),
      DlManagementTableColumn(
        id: 'partner',
        header: 'Partner / stake',
        minWidth: 132,
        cellBuilder: (_, row, __) => _PartnerCell(offer: row),
      ),
      DlManagementTableColumn(
        id: 'date',
        header: 'Date',
        minWidth: 72,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          _formatDate(row.requestedAt),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ),
      DlManagementTableColumn(
        id: 'detail',
        header: 'Detail',
        minWidth: 64,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _ActionChip(
          label: 'Detail',
          tone: _ChipTone.cyan,
          onPressed: onShowDetails == null ? null : () => onShowDetails!(row),
        ),
      ),
      DlManagementTableColumn(
        id: 'approve',
        header: 'Approve',
        minWidth: 72,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _statusActionCell(
          row,
          sessionEmail,
          targetStatus: 'approved',
          label: 'Approve',
          tone: _ChipTone.emerald,
        ),
      ),
      DlManagementTableColumn(
        id: 'amendment',
        header: 'Amend',
        minWidth: 68,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _statusActionCell(
          row,
          sessionEmail,
          targetStatus: 'amendment',
          label: 'Amend',
          tone: _ChipTone.violet,
        ),
      ),
      DlManagementTableColumn(
        id: 'reject',
        header: 'Reject',
        minWidth: 64,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _statusActionCell(
          row,
          sessionEmail,
          targetStatus: 'rejected',
          label: 'Reject',
          tone: _ChipTone.rose,
        ),
      ),
    ];

    return DlManagementTable<SchoolOfferModel>(
      rows: offers,
      columns: columns,
      leadingColumn: leading,
      rowKey: (row, _) => row.id,
      emptyMessage: 'No offers found for this status.',
    );
  }

  Widget _statusActionCell(
    SchoolOfferModel row,
    String? sessionEmail, {
    required String targetStatus,
    required String label,
    required _ChipTone tone,
  }) {
    if (!_canRespond(row, sessionEmail) ||
        (row.status != 'requested' && row.status != 'amendment')) {
      return const Text(
        'Track only',
        maxLines: 2,
        overflow: TextOverflow.ellipsis,
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, color: AppColors.textHint),
      );
    }
    return _ActionChip(
      label: label,
      tone: tone,
      onPressed: onChangeStatus == null ? null : () => onChangeStatus!(row, targetStatus),
    );
  }

  bool _canRespond(SchoolOfferModel offer, String? sessionEmail) {
    if (sessionEmail == null || sessionEmail.isEmpty) return false;
    final turn = offer.negotiationTurn ?? 'recipient';
    final expected = turn == 'recipient'
        ? offer.recipientEmail?.trim().toLowerCase()
        : offer.senderEmail?.trim().toLowerCase();
    return expected == sessionEmail;
  }

  /// Short date to avoid horizontal overflow in narrow columns.
  String _formatDate(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat('MMM d, yy').format(parsed.toLocal());
  }
}

class _PartnerCell extends StatelessWidget {
  const _PartnerCell({required this.offer});

  final SchoolOfferModel offer;

  @override
  Widget build(BuildContext context) {
    if (offer.partyFullName == null || offer.partyFullName!.isEmpty) {
      return const Text(
        '—',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(color: AppColors.textHint, fontSize: 12),
      );
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          offer.partyFullName!,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        ),
        if (offer.offerKind == 'marketplace_transfer' && offer.offeredPrice != null)
          Text(
            'Bid: ${offer.offeredCurrency ?? 'USD'} ${offer.offeredPrice}',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
          )
        else if (offer.ownershipPercentage != null)
          Text(
            '${offer.ownershipPercentage}% own.',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
          ),
        if (offer.partyEmail != null && offer.partyEmail!.isNotEmpty)
          Text(
            offer.partyEmail!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 10, color: AppColors.textHint),
          ),
      ],
    );
  }
}

enum _ChipTone { cyan, emerald, violet, rose }

class _ActionChip extends StatelessWidget {
  const _ActionChip({
    required this.label,
    required this.tone,
    this.onPressed,
  });

  final String label;
  final _ChipTone tone;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (tone) {
      _ChipTone.cyan => (const Color(0xFFE0F4FA), AppColors.primaryLight),
      _ChipTone.emerald => (const Color(0xFFDDF5E8), const Color(0xFF1B6B42)),
      _ChipTone.violet => (const Color(0xFFEDE8F8), const Color(0xFF5B4B8A)),
      _ChipTone.rose => (const Color(0xFFFCE8EC), const Color(0xFFB4233C)),
    };

    return Material(
      color: bg,
      borderRadius: BorderRadius.circular(6),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(6),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 5),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w700,
              color: onPressed == null ? AppColors.textHint : fg,
            ),
          ),
        ),
      ),
    );
  }
}
