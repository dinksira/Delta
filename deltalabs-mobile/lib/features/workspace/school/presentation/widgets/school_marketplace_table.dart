import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_table_action_chip.dart';
import 'package:deltalabs_mobile/shared/widgets/management_table/dl_management_table.dart';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

typedef SchoolMarketplaceRowAction = void Function(SchoolMarketplaceItemModel item);

class SchoolMarketplaceTable extends StatelessWidget {
  const SchoolMarketplaceTable({
    required this.items,
    required this.view,
    required this.sessionUserId,
    this.onShowDetails,
    this.onBid,
    this.onDealRoom,
    this.onEdit,
    this.onDelete,
    super.key,
  });

  final List<SchoolMarketplaceItemModel> items;
  final String view;
  final String? sessionUserId;
  final SchoolMarketplaceRowAction? onShowDetails;
  final SchoolMarketplaceRowAction? onBid;
  final SchoolMarketplaceRowAction? onDealRoom;
  final SchoolMarketplaceRowAction? onEdit;
  final SchoolMarketplaceRowAction? onDelete;

  @override
  Widget build(BuildContext context) {
    final columns = <DlManagementTableColumn<SchoolMarketplaceItemModel>>[
      DlManagementTableColumn(
        id: 'listing',
        header: 'Listing',
        minWidth: 108,
        cellBuilder: (_, row, __) => Text(
          row.title,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12),
        ),
      ),
      DlManagementTableColumn(
        id: 'school',
        header: 'School',
        minWidth: 108,
        cellBuilder: (_, row, __) => Text(
          row.schoolName,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(fontSize: 12),
        ),
      ),
      DlManagementTableColumn(
        id: 'price',
        header: 'Asking',
        minWidth: 80,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => Text(
          '${row.currency} ${row.price.toStringAsFixed(0)}',
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
          _formatStatus(row.status),
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
          _formatDate(row.createdAt),
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
        id: 'primary',
        header: _primaryHeader,
        minWidth: 76,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _primaryCell(row),
      ),
      DlManagementTableColumn(
        id: 'edit',
        header: 'Edit',
        minWidth: 56,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _ownerCell(
          row,
          label: 'Edit',
          tone: SchoolTableChipTone.violet,
          onTap: onEdit,
        ),
      ),
      DlManagementTableColumn(
        id: 'delete',
        header: 'Delete',
        minWidth: 60,
        align: TextAlign.center,
        cellBuilder: (_, row, __) => _ownerCell(
          row,
          label: 'Delete',
          tone: SchoolTableChipTone.rose,
          onTap: onDelete,
        ),
      ),
    ];

    return DlManagementTable<SchoolMarketplaceItemModel>(
      rows: items,
      columns: columns,
      rowKey: (row, _) => row.id,
      emptyMessage: 'No marketplace listings match this tab.',
    );
  }

  String get _primaryHeader => view == 'listings' ? 'Deal room' : 'Bid';

  Widget _primaryCell(SchoolMarketplaceItemModel row) {
    final owned = row.isOwnedBy(sessionUserId);
    if (owned || view == 'listings') {
      return SchoolTableActionChip(
        label: 'Deal room',
        tone: SchoolTableChipTone.violet,
        onPressed: onDealRoom == null ? null : () => onDealRoom!(row),
      );
    }
    if (row.isTerminal) {
      return const Text(
        'Closed',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, color: AppColors.textHint),
      );
    }
    return SchoolTableActionChip(
      label: 'Bid',
      tone: SchoolTableChipTone.emerald,
      onPressed: onBid == null ? null : () => onBid!(row),
    );
  }

  Widget _ownerCell(
    SchoolMarketplaceItemModel row, {
    required String label,
    required SchoolTableChipTone tone,
    required SchoolMarketplaceRowAction? onTap,
  }) {
    if (!row.isOwnedBy(sessionUserId) || row.isTerminal) {
      return const Text(
        '—',
        textAlign: TextAlign.center,
        style: TextStyle(fontSize: 10, color: AppColors.textHint),
      );
    }
    return SchoolTableActionChip(
      label: label,
      tone: tone,
      onPressed: onTap == null ? null : () => onTap(row),
    );
  }

  String _formatStatus(String raw) => raw.replaceAll('_', ' ');

  String _formatDate(String raw) {
    final parsed = DateTime.tryParse(raw);
    if (parsed == null) return raw;
    return DateFormat('MMM d, yy').format(parsed.toLocal());
  }
}
