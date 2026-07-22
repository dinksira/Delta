import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/shared/management_table/presentation/utils/mt_column_type_meta.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

Future<MtAppendColumnSpec?> showMtAddColumnSheet(
  BuildContext context, {
  List<MtAddColumnGroup> groups = mtAddColumnGroups,
}) {
  return showModalBottomSheet<MtAppendColumnSpec>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.white,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (ctx) => _MtAddColumnSheet(groups: groups),
  );
}

class _MtAddColumnSheet extends HookWidget {
  const _MtAddColumnSheet({required this.groups});

  final List<MtAddColumnGroup> groups;

  @override
  Widget build(BuildContext context) {
    final search = useState('');
    final query = search.value.trim().toLowerCase();

    final filtered = groups
        .map((group) {
          final options = group.options
              .where(
                (option) =>
                    query.isEmpty || option.label.toLowerCase().contains(query),
              )
              .toList();
          return (title: group.title, options: options);
        })
        .where((group) => group.options.isNotEmpty)
        .toList();

    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 12,
          bottom: MediaQuery.viewInsetsOf(context).bottom + 16,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.inputBorder,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'Add column',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            TextField(
              decoration: InputDecoration(
                hintText: 'Search column types',
                prefixIcon: const Icon(Icons.search_rounded),
                filled: true,
                fillColor: AppColors.surfaceGrey,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                isDense: true,
              ),
              onChanged: (value) => search.value = value,
            ),
            const SizedBox(height: 12),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final group in filtered) ...[
                    Padding(
                      padding: const EdgeInsets.fromLTRB(4, 6, 4, 6),
                      child: Text(
                        group.title,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    GridView.builder(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: group.options.length,
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        mainAxisSpacing: 6,
                        crossAxisSpacing: 8,
                        childAspectRatio: 4.2,
                      ),
                      itemBuilder: (context, index) {
                        final option = group.options[index];
                        return _AddColumnTile(option: option);
                      },
                    ),
                  ],
                  if (filtered.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Text(
                        'No column types match your search.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: AppColors.textSecondary),
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
}

class _AddColumnTile extends StatelessWidget {
  const _AddColumnTile({required this.option});

  final MtAddColumnOption option;

  @override
  Widget build(BuildContext context) {
    final enabled = option.supportedType != null;

    return Material(
      color: AppColors.surfaceGrey,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        borderRadius: BorderRadius.circular(10),
        onTap: () {
          if (!enabled) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('This column type is coming soon.'),
              ),
            );
            return;
          }
          Navigator.of(context).pop(
            MtAppendColumnSpec(
              type: option.supportedType!,
              title: option.columnTitle,
              settings: option.columnSettings,
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Row(
            children: [
              Icon(
                option.icon,
                size: 18,
                color: enabled ? AppColors.primary : AppColors.textHint,
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  option.label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: enabled ? AppColors.textPrimary : AppColors.textHint,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
