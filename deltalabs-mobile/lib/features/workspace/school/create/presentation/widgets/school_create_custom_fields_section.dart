import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_form_widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SchoolCreateCustomFieldsSection extends ConsumerWidget {
  const SchoolCreateCustomFieldsSection({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);
    final canAdd = s.customFieldDraft.key.trim().isNotEmpty &&
        s.customFieldDraft.value.trim().isNotEmpty;

    return SchoolCreateLabeledField(
      label: 'Custom fields',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SchoolCreateBoundField(
                  value: s.customFieldDraft.key,
                  decoration: schoolCreateInputDecoration(
                    hint: 'Field name (e.g. Accreditation)',
                  ),
                  onChanged: n.setCustomFieldDraftKey,
                ),
                const SizedBox(height: 10),
                SchoolCreateBoundField(
                  value: s.customFieldDraft.value,
                  decoration: schoolCreateInputDecoration(
                    hint: 'Field value (e.g. ABET)',
                  ),
                  onChanged: n.setCustomFieldDraftValue,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: canAdd ? n.addCustomField : null,
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Add field'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.primary,
                      side: BorderSide(
                        color: canAdd
                            ? AppColors.primary
                            : AppColors.inputBorder,
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          if (s.customFields.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              '${s.customFields.length} field${s.customFields.length == 1 ? '' : 's'} added',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 8),
            ...s.customFields.asMap().entries.map(
                  (e) => _CustomFieldCard(
                    field: e.value,
                    onRemove: () => n.removeCustomField(e.key),
                  ),
                ),
          ],
        ],
      ),
    );
  }
}

class _CustomFieldCard extends StatelessWidget {
  const _CustomFieldCard({
    required this.field,
    required this.onRemove,
  });

  final SchoolCustomField field;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.65)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.primary.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    field.key,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: AppColors.primary,
                      letterSpacing: 0.2,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  field.value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            onPressed: onRemove,
            tooltip: 'Remove',
            visualDensity: VisualDensity.compact,
            icon: Icon(
              Icons.delete_outline_rounded,
              size: 20,
              color: AppColors.textSecondary.withValues(alpha: 0.85),
            ),
          ),
        ],
      ),
    );
  }
}
