import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_notifier.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_custom_fields_section.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_form_widgets.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/widgets/school_create_share_section.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SchoolCreateStepSchool extends ConsumerWidget {
  const SchoolCreateStepSchool({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);
    final v = n.currentValidation(null);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SchoolCreateLabeledField(
          label: 'School Logo',
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.surfaceGrey,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.7)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.upload_outlined, color: AppColors.textSecondary),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'Paste a hosted logo URL for the school card.',
                        style: TextStyle(color: AppColors.textSecondary, fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SchoolCreateBoundField(
                value: s.logoUrl,
                decoration: schoolCreateInputDecoration(hint: 'https://your-cdn/logo.png'),
                onChanged: n.setLogoUrl,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'School Name',
          error: v.nameError,
          child: SchoolCreateBoundField(
            value: s.name,
            decoration: schoolCreateInputDecoration(hint: 'Enter school name'),
            onChanged: n.setName,
          ),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'School Type',
          error: v.typeError,
          child: DropdownButtonFormField<String>(
            value: SchoolCreateConstants.schoolTypes.contains(s.schoolType)
                ? s.schoolType
                : SchoolCreateConstants.schoolTypes.first,
            decoration: schoolCreateInputDecoration(),
            items: SchoolCreateConstants.schoolTypes
                .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                .toList(),
            onChanged: (v) => n.setSchoolType(v ?? 'University'),
          ),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'Email',
          error: v.emailError,
          child: SchoolCreateBoundField(
            value: s.email,
            keyboardType: TextInputType.emailAddress,
            decoration: schoolCreateInputDecoration(hint: 'school@example.com'),
            onChanged: n.setEmail,
          ),
        ),
        const SizedBox(height: 16),
        const SchoolCreateCustomFieldsSection(),
      ],
    );
  }
}

class SchoolCreateStepPartnerDetail extends ConsumerWidget {
  const SchoolCreateStepPartnerDetail({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);
    final v = n.currentValidation(null);
    final remaining = (100 - s.ownershipTotal).clamp(0, 100);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Unallocated ownership: ${remaining.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '')}%',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'Full Name',
          error: v.partnerNameError,
          child: SchoolCreateBoundField(
            value: s.partnerDraft.fullName,
            decoration: schoolCreateInputDecoration(hint: 'Enter here'),
            onChanged: (v) {
              final draft = ref.read(schoolCreateProvider).partnerDraft;
              n.setPartnerDraft(draft.copyWith(fullName: v));
            },
          ),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'Email',
          error: v.partnerEmailError,
          child: SchoolCreateBoundField(
            value: s.partnerDraft.email,
            keyboardType: TextInputType.emailAddress,
            decoration: schoolCreateInputDecoration(hint: 'partner@example.com'),
            onChanged: (v) {
              final draft = ref.read(schoolCreateProvider).partnerDraft;
              n.setPartnerDraft(draft.copyWith(email: v));
            },
          ),
        ),
        const SizedBox(height: 16),
        SchoolCreateLabeledField(
          label: 'Ownership Percentage',
          error: v.partnerOwnershipError,
          child: SchoolCreateBoundField(
            value: s.partnerDraft.ownershipPercentage,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: schoolCreateInputDecoration(hint: '0–100'),
            onChanged: (v) {
              final draft = ref.read(schoolCreateProvider).partnerDraft;
              n.setPartnerDraft(draft.copyWith(ownershipPercentage: v));
            },
          ),
        ),
      ],
    );
  }
}

class SchoolCreateStepPartners extends ConsumerWidget {
  const SchoolCreateStepPartners({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);
    final auth = ref.watch(authProvider).value;
    final total = s.ownershipTotal;
    final remaining = 100 - total;
    final canAddCreator = auth != null && remaining > 0.001;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Total ownership: ${total.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '')}% (must equal 100%)',
          style: const TextStyle(
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            FilledButton.icon(
              onPressed: n.goToPartnerDetail,
              icon: const Icon(Icons.person_add_alt_1_rounded, size: 18),
              label: const Text('Add Owner'),
              style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
            ),
            if (canAddCreator)
              OutlinedButton(
                onPressed: () => n.addCreatorAsOwner(auth),
                child: Text('Add me (${remaining.toStringAsFixed(0)}%)'),
              ),
          ],
        ),
        const SizedBox(height: 16),
        if (s.partners.isEmpty)
          const Text(
            'No partners yet. Add owners or continue without partners.',
            style: TextStyle(color: AppColors.textSecondary),
          )
        else
          ...s.partners.asMap().entries.map(
                (e) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    title: Text(
                      e.value.fullName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    subtitle: Text(
                      '${e.value.email} · ${e.value.ownershipPercentage}% ownership',
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline, color: AppColors.error),
                      onPressed: () => n.removePartner(e.key),
                    ),
                  ),
                ),
              ),
      ],
    );
  }
}

class SchoolCreateStepShare extends ConsumerWidget {
  const SchoolCreateStepShare({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return const SchoolCreateShareSection();
  }
}

class SchoolCreateStepDocuments extends ConsumerWidget {
  const SchoolCreateStepDocuments({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final s = ref.watch(schoolCreateProvider);
    final n = ref.read(schoolCreateProvider.notifier);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (s.orgLoading)
          const Text(
            'Loading organization context…',
            style: TextStyle(color: AppColors.textSecondary),
          )
        else if (s.orgId == null)
          const Text(
            'No organization yet. You can paste document URLs; file upload works after your first org exists.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
        const SizedBox(height: 8),
        SchoolCreateLabeledField(
          label: 'Document Title',
          child: SchoolCreateBoundField(
            value: s.documentDraft.title,
            decoration: schoolCreateInputDecoration(hint: 'Document title'),
            onChanged: (v) {
              final draft = ref.read(schoolCreateProvider).documentDraft;
              n.setDocumentDraft(draft.copyWith(title: v));
            },
          ),
        ),
        const SizedBox(height: 12),
        SchoolCreateLabeledField(
          label: 'Document URL',
          child: SchoolCreateBoundField(
            value: s.documentDraft.url,
            decoration: schoolCreateInputDecoration(hint: 'https://… or media://…'),
            onChanged: (v) {
              final draft = ref.read(schoolCreateProvider).documentDraft;
              n.setDocumentDraft(draft.copyWith(url: v));
            },
          ),
        ),
        const SizedBox(height: 8),
        OutlinedButton.icon(
          onPressed: s.orgId == null || s.uploadingDocument
              ? null
              : () async {
                  final result = await FilePicker.platform.pickFiles(withData: true);
                  if (result == null || result.files.isEmpty) return;
                  final file = result.files.first;
                  final bytes = file.bytes;
                  if (bytes == null) return;
                  await n.uploadDocumentFile(
                    filename: file.name,
                    contentType: file.extension != null
                        ? 'application/${file.extension}'
                        : 'application/octet-stream',
                    bytes: bytes,
                  );
                },
          icon: const Icon(Icons.attach_file_rounded),
          label: Text(s.uploadingDocument ? 'Uploading…' : 'Pick file to upload'),
        ),
        if (s.uploadError != null) ...[
          const SizedBox(height: 8),
          Text(s.uploadError!, style: const TextStyle(color: AppColors.error, fontSize: 12)),
        ],
        const SizedBox(height: 12),
        FilledButton(
          onPressed: n.attachDocument,
          style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
          child: const Text('Attach'),
        ),
        const SizedBox(height: 16),
        ...s.documents.asMap().entries.map(
              (e) => ListTile(
                title: Text(e.value.title),
                subtitle: Text(e.value.url, maxLines: 1, overflow: TextOverflow.ellipsis),
                trailing: IconButton(
                  icon: const Icon(Icons.close_rounded),
                  onPressed: () => n.removeDocument(e.key),
                ),
              ),
            ),
      ],
    );
  }
}
