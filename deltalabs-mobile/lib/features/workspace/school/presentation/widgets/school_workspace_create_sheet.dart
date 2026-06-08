import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_workspace_constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

typedef SchoolWorkspaceCreateResult = ({
  String type,
  String title,
  String description,
});

class SchoolWorkspaceCreateSheet extends HookWidget {
  const SchoolWorkspaceCreateSheet({
    required this.initialSectionId,
    required this.canCreate,
    super.key,
  });

  final String initialSectionId;
  final bool canCreate;

  static Future<SchoolWorkspaceCreateResult?> show(
    BuildContext context, {
    required String initialSectionId,
    required bool canCreate,
  }) {
    final maxH = MediaQuery.sizeOf(context).height * 0.92;
    return showModalBottomSheet<SchoolWorkspaceCreateResult>(
      context: context,
      isScrollControlled: true,
      useRootNavigator: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: maxH),
          child: SchoolWorkspaceCreateSheet(
            initialSectionId: initialSectionId,
            canCreate: canCreate,
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final presetType = initialSectionId == 'all'
        ? null
        : SchoolWorkspaceConstants.sectionToCreationChoice(initialSectionId);
    final step = useState(presetType != null ? 1 : 0);
    final selectedType = useState<String?>(presetType);
    final titleCtrl = useTextEditingController();
    final descCtrl = useTextEditingController();
    final submitting = useState(false);

    void pickType(String type) {
      selectedType.value = type;
      step.value = 1;
    }

    void submit() {
      final type = selectedType.value;
      final title = titleCtrl.text.trim();
      if (type == null || title.isEmpty) return;
      Navigator.of(context).pop((
        type: type,
        title: title,
        description: descCtrl.text.trim(),
      ));
    }

    final presetLabel = presetType == null
        ? null
        : SchoolWorkspaceConstants.creationChoices
            .firstWhere((c) => c.id == presetType)
            .label;

    return Material(
      color: Colors.transparent,
      child: Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: EdgeInsets.fromLTRB(
          20,
          12,
          20,
          20 + MediaQuery.paddingOf(context).bottom,
        ),
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
            Row(
              children: [
                if (step.value == 1 && presetType == null)
                  IconButton(
                    onPressed: () => step.value = 0,
                    icon: const Icon(Icons.arrow_back_rounded),
                  ),
                Expanded(
                  child: Text(
                    step.value == 0
                        ? 'New workspace item'
                        : (presetLabel != null ? 'New $presetLabel' : 'Item details'),
                    style: const TextStyle(
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
            const SizedBox(height: 12),
            if (!canCreate)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 24),
                child: Text(
                  'You need school:manage permission to create workspace items.',
                  style: TextStyle(color: AppColors.textSecondary),
                ),
              )
            else if (step.value == 0)
              ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.sizeOf(context).height * 0.55,
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: SchoolWorkspaceConstants.creationChoices.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final choice = SchoolWorkspaceConstants.creationChoices[index];
                    return _ChoiceTile(
                      choice: choice,
                      onTap: () => pickType(choice.id),
                    );
                  },
                ),
              )
            else ...[
              TextField(
                controller: titleCtrl,
                autofocus: true,
                decoration: InputDecoration(
                  labelText: 'Title',
                  filled: true,
                  fillColor: AppColors.surfaceGrey,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                maxLines: 3,
                decoration: InputDecoration(
                  labelText: 'Description (optional)',
                  filled: true,
                  fillColor: AppColors.surfaceGrey,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
              const SizedBox(height: 20),
              FilledButton(
                onPressed: submitting.value ? null : submit,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  minimumSize: const Size.fromHeight(48),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Create', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ChoiceTile extends StatelessWidget {
  const _ChoiceTile({required this.choice, required this.onTap});

  final SchoolWorkspaceCreationChoice choice;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.surfaceGrey,
      borderRadius: BorderRadius.circular(12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          child: Row(
            children: [
              Icon(choice.icon, color: AppColors.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  choice.label,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              const Icon(Icons.chevron_right_rounded, color: AppColors.textHint),
            ],
          ),
        ),
      ),
    );
  }
}
