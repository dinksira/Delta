import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/data/models/my_school_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_marketplace_item_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class MarketplacePlaceBidResult {
  const MarketplacePlaceBidResult.bid({
    required this.price,
    this.note,
  }) : isBuyNow = false;

  const MarketplacePlaceBidResult.buyNow() : isBuyNow = true, price = 0, note = null;

  final bool isBuyNow;
  final double price;
  final String? note;
}

/// Place bid / buy now — parity with web Place Bid dialog.
class SchoolPlaceBidSheet extends StatefulWidget {
  const SchoolPlaceBidSheet({
    required this.listing,
    super.key,
  });

  final SchoolMarketplaceItemModel listing;

  static Future<MarketplacePlaceBidResult?> show(
    BuildContext context,
    SchoolMarketplaceItemModel listing,
  ) {
    final maxH = MediaQuery.sizeOf(context).height * 0.75;
    return showModalBottomSheet<MarketplacePlaceBidResult>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolPlaceBidSheet(listing: listing),
        ),
      ),
    );
  }

  @override
  State<SchoolPlaceBidSheet> createState() => _SchoolPlaceBidSheetState();
}

class _SchoolPlaceBidSheetState extends State<SchoolPlaceBidSheet> {
  late final TextEditingController _priceCtrl;
  late final TextEditingController _noteCtrl;

  @override
  void initState() {
    super.initState();
    _priceCtrl = TextEditingController(
      text: widget.listing.price > 0 ? widget.listing.price.toStringAsFixed(0) : '',
    );
    _noteCtrl = TextEditingController();
  }

  @override
  void dispose() {
    _priceCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final price = double.tryParse(_priceCtrl.text.trim()) ?? 0;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.divider,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              'Place bid',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
            ),
            const SizedBox(height: 4),
            Text(
              widget.listing.title,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _priceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [FilteringTextInputFormatter.allow(RegExp(r'[0-9.]'))],
              decoration: InputDecoration(
                labelText: 'Bid price (${widget.listing.currency})',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteCtrl,
              maxLines: 2,
              decoration: InputDecoration(
                labelText: 'Bid note (optional)',
                hintText: 'Add terms or timeline',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(const MarketplacePlaceBidResult.buyNow()),
                    child: const Text('Buy now'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: FilledButton(
                    onPressed: price <= 0
                        ? null
                        : () => Navigator.of(context).pop(
                              MarketplacePlaceBidResult.bid(
                                price: price,
                                note: _noteCtrl.text.trim(),
                              ),
                            ),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text('Submit bid'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class MarketplaceListingFormResult {
  const MarketplaceListingFormResult({
    required this.schoolId,
    required this.orgId,
    required this.title,
    required this.description,
    required this.price,
    this.currency = 'USD',
  });

  final String schoolId;
  final String orgId;
  final String title;
  final String description;
  final double price;
  final String currency;
}

/// Create marketplace listing — parity with web create dialog.
class SchoolCreateListingSheet extends StatefulWidget {
  const SchoolCreateListingSheet({
    required this.schools,
    super.key,
  });

  final List<MySchoolModel> schools;

  static Future<MarketplaceListingFormResult?> show(
    BuildContext context, {
    required List<MySchoolModel> schools,
  }) {
    final maxH = MediaQuery.sizeOf(context).height * 0.85;
    return showModalBottomSheet<MarketplaceListingFormResult>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolCreateListingSheet(schools: schools),
        ),
      ),
    );
  }

  @override
  State<SchoolCreateListingSheet> createState() => _SchoolCreateListingSheetState();
}

class _SchoolCreateListingSheetState extends State<SchoolCreateListingSheet> {
  String? _schoolId;
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _priceCtrl = TextEditingController();

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  MySchoolModel? get _selectedSchool {
    if (_schoolId == null) return null;
    for (final s in widget.schools) {
      if (s.schoolId == _schoolId) return s;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final price = double.tryParse(_priceCtrl.text.trim()) ?? -1;
    final canSave = _schoolId != null &&
        _titleCtrl.text.trim().isNotEmpty &&
        _descCtrl.text.trim().isNotEmpty &&
        price >= 0;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottom),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.divider,
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Create listing',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: _schoolId,
                decoration: InputDecoration(
                  labelText: 'School',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                items: widget.schools
                    .map(
                      (s) => DropdownMenuItem(value: s.schoolId, child: Text(s.name)),
                    )
                    .toList(),
                onChanged: (v) => setState(() => _schoolId = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _priceCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'Price (USD)',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _titleCtrl,
                decoration: InputDecoration(
                  labelText: 'Title',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _descCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Description',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: !canSave
                          ? null
                          : () {
                              final school = _selectedSchool!;
                              Navigator.of(context).pop(
                                MarketplaceListingFormResult(
                                  schoolId: school.schoolId,
                                  orgId: school.orgId,
                                  title: _titleCtrl.text.trim(),
                                  description: _descCtrl.text.trim(),
                                  price: price,
                                ),
                              );
                            },
                      style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                      child: const Text('Save listing'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Edit listing — parity with web edit dialog.
class SchoolEditListingSheet extends StatefulWidget {
  const SchoolEditListingSheet({required this.listing, super.key});

  final SchoolMarketplaceItemModel listing;

  static Future<MarketplaceListingFormResult?> show(
    BuildContext context,
    SchoolMarketplaceItemModel listing,
  ) {
    final maxH = MediaQuery.sizeOf(context).height * 0.8;
    return showModalBottomSheet<MarketplaceListingFormResult>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolEditListingSheet(listing: listing),
        ),
      ),
    );
  }

  @override
  State<SchoolEditListingSheet> createState() => _SchoolEditListingSheetState();
}

class _SchoolEditListingSheetState extends State<SchoolEditListingSheet> {
  late final TextEditingController _titleCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _priceCtrl;

  @override
  void initState() {
    super.initState();
    _titleCtrl = TextEditingController(text: widget.listing.title);
    _descCtrl = TextEditingController(text: widget.listing.description);
    _priceCtrl = TextEditingController(text: widget.listing.price.toStringAsFixed(0));
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _priceCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.paddingOf(context).bottom;
    final price = double.tryParse(_priceCtrl.text.trim()) ?? -1;
    final canSave =
        _titleCtrl.text.trim().isNotEmpty && _descCtrl.text.trim().isNotEmpty && price >= 0;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: EdgeInsets.fromLTRB(20, 16, 20, 16 + bottom),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Edit listing',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primary),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _titleCtrl,
              decoration: InputDecoration(
                labelText: 'Title',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _priceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: InputDecoration(
                labelText: 'Price (${widget.listing.currency})',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: !canSave
                        ? null
                        : () => Navigator.of(context).pop(
                              MarketplaceListingFormResult(
                                schoolId: widget.listing.schoolId,
                                orgId: widget.listing.orgId,
                                title: _titleCtrl.text.trim(),
                                description: _descCtrl.text.trim(),
                                price: price,
                                currency: widget.listing.currency,
                              ),
                            ),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                    child: const Text('Save changes'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
