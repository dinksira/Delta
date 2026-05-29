import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/offer_amendment_payload.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_offer_model.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Bottom sheet to propose offer amendments (parity with web `SchoolAmendOfferModal`).
class SchoolAmendOfferSheet extends StatefulWidget {
  const SchoolAmendOfferSheet({required this.offer, super.key});

  final SchoolOfferModel offer;

  static Future<OfferAmendmentPayload?> show(BuildContext context, SchoolOfferModel offer) {
    final maxH = MediaQuery.sizeOf(context).height * 0.9;
    return showModalBottomSheet<OfferAmendmentPayload>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      barrierColor: Colors.black.withValues(alpha: 0.45),
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolAmendOfferSheet(offer: offer),
        ),
      ),
    );
  }

  @override
  State<SchoolAmendOfferSheet> createState() => _SchoolAmendOfferSheetState();
}

class _SchoolAmendOfferSheetState extends State<SchoolAmendOfferSheet> {
  late final TextEditingController _ownershipCtrl;
  late final TextEditingController _priceCtrl;
  late final TextEditingController _currencyCtrl;
  late final TextEditingController _noteCtrl;
  late List<SchoolShareAccess> _shareAccesses;
  String? _errorText;

  bool get _isMarketplace => widget.offer.offerKind == 'marketplace_transfer';

  @override
  void initState() {
    super.initState();
    final amend = widget.offer.amendmentData;
    _ownershipCtrl = TextEditingController(
      text: amend?.ownershipPercentage?.toString() ??
          widget.offer.ownershipPercentage?.toString() ??
          '',
    );
    _priceCtrl = TextEditingController(
      text: amend?.offeredPrice?.toString() ?? widget.offer.offeredPrice?.toString() ?? '',
    );
    _currencyCtrl = TextEditingController(
      text: amend?.offeredCurrency ?? widget.offer.offeredCurrency ?? 'USD',
    );
    _noteCtrl = TextEditingController(
      text: amend?.note ?? widget.offer.note ?? '',
    );
    _shareAccesses = mergeOfferShareAccesses(
      amendmentData: amend,
      offerShareAccesses: widget.offer.shareAccesses,
    );
  }

  @override
  void dispose() {
    _ownershipCtrl.dispose();
    _priceCtrl.dispose();
    _currencyCtrl.dispose();
    _noteCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    setState(() => _errorText = null);

    if (_isMarketplace) {
      final price = double.tryParse(_priceCtrl.text.trim());
      if (price == null || price <= 0) {
        setState(() => _errorText = 'Offered price must be greater than 0.');
        return;
      }
      final currency = _currencyCtrl.text.trim();
      if (currency.isEmpty) {
        setState(() => _errorText = 'Currency is required.');
        return;
      }
      Navigator.of(context).pop(
        OfferAmendmentPayload(
          offeredPrice: price,
          offeredCurrency: currency,
          note: _noteCtrl.text.trim().isEmpty ? null : _noteCtrl.text.trim(),
        ),
      );
      return;
    }

    final payload = OfferAmendmentPayload(shareAccesses: _shareAccesses);
    if (_ownershipCtrl.text.trim().isNotEmpty) {
      final pct = double.tryParse(_ownershipCtrl.text.trim());
      if (pct == null || pct < 0 || pct > 100) {
        setState(() => _errorText = 'Ownership percentage must be between 0 and 100.');
        return;
      }
      Navigator.of(context).pop(
        OfferAmendmentPayload(
          ownershipPercentage: pct,
          shareAccesses: _shareAccesses,
        ),
      );
      return;
    }

    Navigator.of(context).pop(payload);
  }

  @override
  Widget build(BuildContext context) {
    final partner = widget.offer.partyFullName ?? 'this partner';

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
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
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 0),
              child: Row(
                children: [
                  const Expanded(
                    child: Text(
                      'Request amendment',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close_rounded, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Text(
                _isMarketplace
                    ? 'Propose updated bid terms for ${widget.offer.schoolName}.'
                    : 'Propose updated ownership and access for $partner.',
                style: const TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
              ),
            ),
            Flexible(
              fit: FlexFit.loose,
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_isMarketplace) ...[
                      _LabeledField(
                        label: 'Offered price',
                        child: TextField(
                          controller: _priceCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                          ],
                          decoration: _inputDecoration(),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _LabeledField(
                        label: 'Currency',
                        child: TextField(
                          controller: _currencyCtrl,
                          textCapitalization: TextCapitalization.characters,
                          decoration: _inputDecoration(hint: 'USD'),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _LabeledField(
                        label: 'Note (optional)',
                        child: TextField(
                          controller: _noteCtrl,
                          maxLines: 2,
                          decoration: _inputDecoration(hint: 'Counter terms…'),
                        ),
                      ),
                    ] else ...[
                      _LabeledField(
                        label: 'Ownership percentage',
                        child: TextField(
                          controller: _ownershipCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
                          ],
                          decoration: _inputDecoration(hint: '0–100'),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'School share access',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        offerHasShareAccessDataFrom(
                          amendmentData: widget.offer.amendmentData,
                          offerShareAccesses: widget.offer.shareAccesses,
                        )
                            ? 'Current assigned levels are shown below. Change any row before sending.'
                            : 'Set access levels for each area below.',
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.textSecondary,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        constraints: const BoxConstraints(maxHeight: 280),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
                        ),
                        child: ListView.separated(
                          shrinkWrap: true,
                          itemCount: _shareAccesses.length,
                          separatorBuilder: (_, __) => Divider(
                            height: 1,
                            color: AppColors.inputBorder.withValues(alpha: 0.5),
                          ),
                          itemBuilder: (context, index) {
                            final access = _shareAccesses[index];
                            final status = SchoolCreateConstants.shareStatuses.contains(access.status)
                                ? access.status
                                : 'can_view';
                            return Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          access.accessName,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w500,
                                            color: AppColors.textPrimary,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          'Assigned: ${shareAccessStatusLabel(status)}',
                                          style: const TextStyle(
                                            fontSize: 11,
                                            color: AppColors.textHint,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  DropdownButtonHideUnderline(
                                    child: DropdownButton<String>(
                                      value: status,
                                      borderRadius: BorderRadius.circular(10),
                                      items: [
                                        for (final s in SchoolCreateConstants.shareStatuses)
                                          DropdownMenuItem(
                                            value: s,
                                            child: Text(
                                              shareAccessStatusLabel(s),
                                              style: const TextStyle(fontSize: 13),
                                            ),
                                          ),
                                      ],
                                      onChanged: (value) {
                                        if (value == null) return;
                                        setState(() {
                                          _shareAccesses[index] = access.copyWith(status: value);
                                        });
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                    ],
                    if (_errorText != null) ...[
                      const SizedBox(height: 12),
                      Text(
                        _errorText!,
                        style: const TextStyle(fontSize: 13, color: Color(0xFFB4233C)),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            Padding(
              padding: EdgeInsets.fromLTRB(
                20,
                8,
                20,
                16 + MediaQuery.paddingOf(context).bottom,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: FilledButton(
                      onPressed: _submit,
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF5B4B8A),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Send amendment'),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({String? hint}) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: AppColors.surfaceGrey,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.7)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: AppColors.inputBorder.withValues(alpha: 0.7)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppColors.primary, width: 1.5),
      ),
    );
  }
}

class _LabeledField extends StatelessWidget {
  const _LabeledField({required this.label, required this.child});

  final String label;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
