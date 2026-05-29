import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:flutter/material.dart';

/// Column definition for [DlManagementTable] (Monday / ClickUp–style grid).
class DlManagementTableColumn<T> {
  const DlManagementTableColumn({
    required this.id,
    required this.header,
    required this.cellBuilder,
    this.minWidth = 120,
    this.align = TextAlign.left,
  });

  final String id;
  final String header;
  final double minWidth;
  final TextAlign align;
  final Widget Function(BuildContext context, T row, int index) cellBuilder;
}

/// Fixed leading column + horizontally scrollable data columns (safe in [ListView]).
class DlManagementTable<T> extends StatefulWidget {
  const DlManagementTable({
    required this.rows,
    required this.columns,
    required this.rowKey,
    this.leadingColumn,
    this.emptyMessage = 'No rows',
    super.key,
  });

  final List<T> rows;
  final List<DlManagementTableColumn<T>> columns;
  final String Function(T row, int index) rowKey;
  final DlManagementTableColumn<T>? leadingColumn;
  final String emptyMessage;

  @override
  State<DlManagementTable<T>> createState() => _DlManagementTableState<T>();
}

class _DlManagementTableState<T> extends State<DlManagementTable<T>> {
  late final ScrollController _hScroll;

  static const _headerBg = Color(0xFFE8EDF3);
  static const _borderColor = Color(0xFFDDE5EE);
  static const _headerRowHeight = 40.0;
  static const _dataRowHeight = 56.0;

  double get _dataWidth =>
      widget.columns.fold<double>(0, (sum, c) => sum + c.minWidth);

  @override
  void initState() {
    super.initState();
    _hScroll = ScrollController();
  }

  @override
  void dispose() {
    _hScroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.rows.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: _borderColor),
        ),
        child: Text(
          widget.emptyMessage,
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
      );
    }

    final leading = widget.leadingColumn;
    final leadingWidth = leading?.minWidth ?? 0.0;

    return DecoratedBox(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _borderColor.withValues(alpha: 0.9)),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (leading != null)
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _leadingPane(
                    width: leadingWidth,
                    height: _headerRowHeight,
                    isHeader: true,
                    child: _headerLabel(leading),
                  ),
                  for (var i = 0; i < widget.rows.length; i++)
                    _leadingPane(
                      width: leadingWidth,
                      height: _dataRowHeight,
                      isHeader: false,
                      showTopBorder: true,
                      zebra: i.isOdd,
                      child: leading.cellBuilder(context, widget.rows[i], i),
                    ),
                ],
              ),
            Expanded(
              child: SingleChildScrollView(
                controller: _hScroll,
                scrollDirection: Axis.horizontal,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _dataRowStrip(
                      height: _headerRowHeight,
                      isHeader: true,
                      children: [
                        for (final col in widget.columns)
                          _dataPane(
                            width: col.minWidth,
                            height: _headerRowHeight,
                            isHeader: true,
                            align: col.align,
                            child: _headerLabel(col),
                          ),
                      ],
                    ),
                    for (var i = 0; i < widget.rows.length; i++)
                      _dataRowStrip(
                        key: ValueKey(widget.rowKey(widget.rows[i], i)),
                        height: _dataRowHeight,
                        isHeader: false,
                        showTopBorder: true,
                        zebra: i.isOdd,
                        children: [
                          for (final col in widget.columns)
                            _dataPane(
                              width: col.minWidth,
                              height: _dataRowHeight,
                              isHeader: false,
                              align: col.align,
                              child: col.cellBuilder(context, widget.rows[i], i),
                            ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dataRowStrip({
    Key? key,
    required double height,
    required bool isHeader,
    required List<Widget> children,
    bool showTopBorder = false,
    bool zebra = false,
  }) {
    return DecoratedBox(
      key: key,
      decoration: BoxDecoration(
        color: isHeader
            ? _headerBg
            : (zebra ? AppColors.surfaceGrey.withValues(alpha: 0.35) : Colors.white),
        border: showTopBorder
            ? const Border(top: BorderSide(color: _borderColor, width: 0.5))
            : null,
      ),
      child: SizedBox(
        width: _dataWidth,
        height: height,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: children,
        ),
      ),
    );
  }

  Widget _headerLabel(DlManagementTableColumn<T> col) {
    return Text(
      col.header,
      maxLines: 2,
      overflow: TextOverflow.ellipsis,
      textAlign: col.align,
      style: const TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.w700,
        color: AppColors.primary,
      ),
    );
  }

  Widget _leadingPane({
    required double width,
    required double height,
    required bool isHeader,
    required Widget child,
    bool showTopBorder = false,
    bool zebra = false,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: isHeader
            ? _headerBg
            : (zebra ? AppColors.surfaceGrey.withValues(alpha: 0.35) : Colors.white),
        border: Border(
          right: const BorderSide(color: _borderColor, width: 0.5),
          top: showTopBorder
              ? const BorderSide(color: _borderColor, width: 0.5)
              : BorderSide.none,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 4,
            offset: const Offset(2, 0),
          ),
        ],
      ),
      child: _cellBox(
        width: width,
        height: height,
        align: TextAlign.center,
        isHeader: isHeader,
        child: child,
      ),
    );
  }

  Widget _dataPane({
    required double width,
    required double height,
    required bool isHeader,
    required TextAlign align,
    required Widget child,
  }) {
    return Container(
      width: width,
      height: height,
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: _borderColor, width: 0.5)),
      ),
      child: _cellBox(width: width, height: height, align: align, isHeader: isHeader, child: child),
    );
  }

  static Widget _cellBox({
    required double width,
    required double height,
    required TextAlign align,
    required bool isHeader,
    required Widget child,
  }) {
    final isCenter = align == TextAlign.center;
    return ClipRect(
      child: SizedBox(
        width: width,
        height: height,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
          child: Align(
            alignment: isCenter
                ? Alignment.center
                : (align == TextAlign.right ? Alignment.centerRight : Alignment.centerLeft),
            child: DefaultTextStyle(
              maxLines: isHeader ? 2 : 3,
              overflow: TextOverflow.ellipsis,
              softWrap: true,
              style: const TextStyle(fontSize: 12, color: AppColors.textPrimary),
              child: child,
            ),
          ),
        ),
      ),
    );
  }
}
