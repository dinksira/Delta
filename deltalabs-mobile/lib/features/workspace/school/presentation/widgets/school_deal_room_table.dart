import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_table_action_chip.dart';
import 'package:deltalabs_mobile/shared/widgets/management_table/dl_management_table.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

typedef DealRoomOfferAction = void Function(SchoolOfferModel offer, String action);

/// Deal room offers table — seller shortlist / accept / counter / reject.
class SchoolDealRoomTable extends StatelessWidget {
  const SchoolDealRoomTable({
    required this.offers,
    this.onShowDetails,
    this.onAction,
    super.key,
  });

  final List<SchoolOfferModel> offers;
  final void Function(SchoolOfferModel offer)? onShowDetails;
  final DealRoomOfferAction? onAction;

  @override
  Widget build(BuildContext context) {
    final sorted = [...offers]..sort(_compareOffers);

    final columns = <DlManagementTableColumn<SchoolOfferModel>>[
      DlManagementTableColumn(
        id: 'bidder',
        header: 'Bidder',
        minWidth: 108,
        cellBuilder: (_, row, __) => Text(
          row.partyEmail ?? row.senderEmail ?? 'Unknown',
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
      ),
      DlManagementTableColumn(
        id: 'bid',
        header: 'Bid',
        minWidth: 80,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          '${row.offeredCurrency ?? 'USD'} ${row.offeredPrice ?? 0}',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ),
      DlManagementTableColumn(
        id: 'status',
        header: 'Status',
        minWidth: 88,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          _statusLabel(row),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ),
      DlManagementTableColumn(
        id: 'updated',
        header: 'Updated',
        minWidth: 88,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          _formatDate(row.updatedAt ?? row.requestedAt),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ),
      DlManagementTableColumn(
        id: 'detail',
        header: 'Detail',
        minWidth: 64,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => SchoolTableActionChip(
          label: 'Detail',
          tone: SchoolTableChipTone.cyan,
          onPressed: onShowDetails == null ? null : () => onShowDetails!(row),
        ),
      ),
      DlManagementTableColumn(
        id: 'shortlist',
        header: 'Shortlist',
        minWidth: 76,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _shortlistCell(row),
      ),
      DlManagementTableColumn(
        id: 'accept',
        header: 'Accept',
        minWidth: 68,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _actionCell(
          row,
          action: 'approved',
          label: 'Accept',
          tone: SchoolTableChipTone.emerald,
        ),
      ),
      DlManagementTableColumn(
        id: 'counter',
        header: 'Counter',
        minWidth: 68,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _actionCell(
          row,
          action: 'amendment',
          label: 'Counter',
          tone: SchoolTableChipTone.violet,
        ),
      ),
      DlManagementTableColumn(
        id: 'reject',
        header: 'Reject',
        minWidth: 64,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _actionCell(
          row,
          action: 'rejected',
          label: 'Reject',
          tone: SchoolTableChipTone.rose,
        ),
      ),
    ];

    return DlManagementTable<SchoolOfferModel>(
      rows: sorted,
      columns: columns,
      rowKey: (row, _) => row.id,
      emptyMessage: 'No offers yet for this listing.',
    );
  }

  Widget _shortlistCell(SchoolOfferModel row) {
    if (!_isActive(row)) {
      return const Text(
        'Not active',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, color: AppColors.textHint),
      );
    }
    if (row.shortlisted == true) {
      return SchoolTableActionChip(
        label: 'Unshortlist',
        tone: SchoolTableChipTone.violet,
        onPressed: onAction == null ? null : () => onAction!(row, 'unshortlist'),
      );
    }
    return SchoolTableActionChip(
      label: 'Shortlist',
      tone: SchoolTableChipTone.emerald,
      onPressed: onAction == null ? null : () => onAction!(row, 'shortlist'),
    );
  }

  Widget _actionCell(
    SchoolOfferModel row, {
    required String action,
    required String label,
    required SchoolTableChipTone tone,
  }) {
    if (!_isActive(row)) {
      return const Text(
        'Track only',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, color: AppColors.textHint),
      );
    }
    return SchoolTableActionChip(
      label: label,
      tone: tone,
      onPressed: onAction == null ? null : () => onAction!(row, action),
    );
  }

  bool _isActive(SchoolOfferModel offer) =>
      offer.status == 'requested' || offer.status == 'amendment';

  String _statusLabel(SchoolOfferModel offer) {
    if (offer.status == 'approved') return 'Accepted';
    if (offer.status == 'rejected') return 'Rejected';
    if (offer.shortlisted == true) return 'Shortlisted';
    if (offer.status == 'amendment') return 'Countered';
    if (offer.status == 'requested') return 'Pending';
    return offer.status;
  }

  int _compareOffers(SchoolOfferModel a, SchoolOfferModel b) {
    final aShort = a.shortlisted == true ? 1 : 0;
    final bShort = b.shortlisted == true ? 1 : 0;
    if (aShort != bShort) return bShort - aShort;
    final ap = a.offeredPrice?.toDouble() ?? 0;
    final bp = b.offeredPrice?.toDouble() ?? 0;
    if (bp != ap) return bp.compareTo(ap);
    final at = DateTime.tryParse(a.updatedAt ?? a.requestedAt)?.millisecondsSinceEpoch ?? 0;
    final bt = DateTime.tryParse(b.updatedAt ?? b.requestedAt)?.millisecondsSinceEpoch ?? 0;
    return bt.compareTo(at);
  }

  String _formatDate(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat('MMM d, yy').format(parsed.toLocal());
  }
}

/// My bids table — buyer review counter / withdraw.
class SchoolMarketplaceBidsTable extends StatelessWidget {
  const SchoolMarketplaceBidsTable({
    required this.offers,
    this.onShowDetails,
    this.onReviewCounter,
    this.onWithdraw,
    super.key,
  });

  final List<SchoolOfferModel> offers;
  final void Function(SchoolOfferModel offer)? onShowDetails;
  final void Function(SchoolOfferModel offer)? onReviewCounter;
  final void Function(SchoolOfferModel offer)? onWithdraw;

  @override
  Widget build(BuildContext context) {
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
        id: 'bid',
        header: 'My bid',
        minWidth: 80,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          '${row.offeredCurrency ?? 'USD'} ${row.offeredPrice ?? 0}',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        ),
      ),
      DlManagementTableColumn(
        id: 'status',
        header: 'Status',
        minWidth: 88,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          _bidStatusLabel(row.status),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ),
      DlManagementTableColumn(
        id: 'date',
        header: 'Date',
        minWidth: 72,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          _formatDate(row.requestedAt),
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
        ),
      ),
      DlManagementTableColumn(
        id: 'detail',
        header: 'Detail',
        minWidth: 64,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => SchoolTableActionChip(
          label: 'Detail',
          tone: SchoolTableChipTone.cyan,
          onPressed: onShowDetails == null ? null : () => onShowDetails!(row),
        ),
      ),
      DlManagementTableColumn(
        id: 'action',
        header: 'Action',
        minWidth: 76,
        align: TextAlign.center,
        cellBuilder: (_, row, __) {
          if (row.status == 'amendment') {
            return SchoolTableActionChip(
              label: 'Review',
              tone: SchoolTableChipTone.violet,
              onPressed: onReviewCounter == null ? null : () => onReviewCounter!(row),
            );
          }
          if (row.status == 'requested') {
            return SchoolTableActionChip(
              label: 'Withdraw',
              tone: SchoolTableChipTone.rose,
              onPressed: onWithdraw == null ? null : () => onWithdraw!(row),
            );
          }
          return const Text(
            'Track only',
            textAlign: TextAlign.center,
            style: TextStyle(fontSize: 10, color: AppColors.textHint),
          );
        },
      ),
    ];

    return DlManagementTable<SchoolOfferModel>(
      rows: offers,
      columns: columns,
      rowKey: (row, _) => row.id,
      emptyMessage: 'No marketplace bids in this queue.',
    );
  }

  String _bidStatusLabel(String status) {
    return switch (status) {
      'requested' => 'Pending',
      'amendment' => 'Countered',
      'approved' => 'Accepted',
      'rejected' => 'Rejected',
      _ => status,
    };
  }

  String _formatDate(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat('MMM d, yy').format(parsed.toLocal());
  }
}
