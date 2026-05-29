import 'dart:typed_data';

import 'package:deltalabs_mobile/features/auth/domain/repositories/auth_repository.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/data/school_create_draft_storage.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_validator.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_create_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/create/presentation/providers/school_wizard_args.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/data_sources/school_remote_data_source.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_detail_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SchoolCreateState {
  const SchoolCreateState({
    this.stepIndex = 0,
    this.name = '',
    this.schoolType = 'University',
    this.email = '',
    this.logoUrl = '',
    this.customFieldDraft = const SchoolCustomField(key: '', value: ''),
    this.customFields = const [],
    this.partnerDraft = const PartnerDraft(),
    this.partners = const [],
    this.selectedPartnerIndex = 0,
    this.documentDraft = const SchoolDocumentDraft(),
    this.documents = const [],
    this.orgId,
    this.orgLoading = true,
    this.submitting = false,
    this.uploadingDocument = false,
    this.submitError,
    this.uploadError,
    this.stepValidationError,
    this.draftHydrated = false,
  });

  final int stepIndex;
  final String name;
  final String schoolType;
  final String email;
  final String logoUrl;
  final SchoolCustomField customFieldDraft;
  final List<SchoolCustomField> customFields;
  final PartnerDraft partnerDraft;
  final List<SchoolPartner> partners;
  final int selectedPartnerIndex;
  final SchoolDocumentDraft documentDraft;
  final List<SchoolDocumentDraft> documents;
  final String? orgId;
  final bool orgLoading;
  final bool submitting;
  final bool uploadingDocument;
  final String? submitError;
  final String? uploadError;
  final String? stepValidationError;
  final bool draftHydrated;

  double get ownershipTotal =>
      partners.fold(0, (s, p) => s + parseOwnership(p.ownershipPercentage));

  SchoolPartner? get selectedPartner =>
      partners.isEmpty ? null : partners[selectedPartnerIndex.clamp(0, partners.length - 1)];

  SchoolCreateState copyWith({
    int? stepIndex,
    String? name,
    String? schoolType,
    String? email,
    String? logoUrl,
    SchoolCustomField? customFieldDraft,
    List<SchoolCustomField>? customFields,
    PartnerDraft? partnerDraft,
    List<SchoolPartner>? partners,
    int? selectedPartnerIndex,
    SchoolDocumentDraft? documentDraft,
    List<SchoolDocumentDraft>? documents,
    String? orgId,
    bool? orgLoading,
    bool? submitting,
    bool? uploadingDocument,
    String? submitError,
    String? uploadError,
    String? stepValidationError,
    bool? draftHydrated,
    bool clearSubmitError = false,
    bool clearUploadError = false,
    bool clearStepError = false,
  }) {
    return SchoolCreateState(
      stepIndex: stepIndex ?? this.stepIndex,
      name: name ?? this.name,
      schoolType: schoolType ?? this.schoolType,
      email: email ?? this.email,
      logoUrl: logoUrl ?? this.logoUrl,
      customFieldDraft: customFieldDraft ?? this.customFieldDraft,
      customFields: customFields ?? this.customFields,
      partnerDraft: partnerDraft ?? this.partnerDraft,
      partners: partners ?? this.partners,
      selectedPartnerIndex: selectedPartnerIndex ?? this.selectedPartnerIndex,
      documentDraft: documentDraft ?? this.documentDraft,
      documents: documents ?? this.documents,
      orgId: orgId ?? this.orgId,
      orgLoading: orgLoading ?? this.orgLoading,
      submitting: submitting ?? this.submitting,
      uploadingDocument: uploadingDocument ?? this.uploadingDocument,
      submitError: clearSubmitError ? null : (submitError ?? this.submitError),
      uploadError: clearUploadError ? null : (uploadError ?? this.uploadError),
      stepValidationError:
          clearStepError ? null : (stepValidationError ?? this.stepValidationError),
      draftHydrated: draftHydrated ?? this.draftHydrated,
    );
  }
}

class SchoolCreateNotifier extends Notifier<SchoolCreateState> {
  late final SchoolRemoteDataSource _api;
  late final SchoolCreateDraftStorage _draftStorage;

  SchoolWizardArgs get _args => ref.read(schoolWizardArgsProvider);

  @override
  SchoolCreateState build() {
    _api = ref.read(schoolCreateRemoteDataSourceProvider);
    _draftStorage = SchoolCreateDraftStorage();
    Future.microtask(_bootstrap);
    return const SchoolCreateState();
  }

  Future<void> _bootstrap() async {
    if (_args.isEdit) {
      await _loadSchoolForEdit();
      return;
    }
    try {
      await _hydrateDraft();
    } catch (_) {
      state = state.copyWith(draftHydrated: true);
    }
    await _loadOrg();
  }

  Future<void> _loadSchoolForEdit() async {
    final orgId = _args.orgId ?? '';
    final schoolId = _args.schoolId ?? '';
    state = state.copyWith(orgLoading: true, clearSubmitError: true);
    try {
      final detail = await _api.fetchSchool(orgId: orgId, schoolId: schoolId);
      state = _stateFromDetail(detail).copyWith(
        orgId: orgId,
        orgLoading: false,
        draftHydrated: true,
      );
    } catch (_) {
      state = state.copyWith(
        orgLoading: false,
        draftHydrated: true,
        submitError: 'Could not load school details. Go back and try again.',
      );
    }
  }

  SchoolCreateState _stateFromDetail(SchoolDetailModel detail) {
    final partners = detail.partners
        .map(
          (p) => p.shareAccesses.isEmpty
              ? p.copyWith(shareAccesses: defaultShareAccesses())
              : p,
        )
        .toList();

    return SchoolCreateState(
      name: detail.name,
      schoolType: detail.schoolType.isEmpty ? 'University' : detail.schoolType,
      email: detail.email ?? '',
      logoUrl: detail.logoUrl ?? '',
      customFields: detail.customFields,
      partners: partners,
      documents: detail.documents,
      selectedPartnerIndex: partners.isEmpty ? 0 : 0,
      draftHydrated: true,
    );
  }

  Future<void> _hydrateDraft() async {
    Map<String, dynamic>? raw;
    try {
      raw = await _draftStorage.read();
    } catch (_) {
      state = state.copyWith(draftHydrated: true);
      return;
    }

    if (raw == null) {
      state = state.copyWith(draftHydrated: true);
      return;
    }

    final partners = <SchoolPartner>[];
    final rawPartners = raw['partners'];
    if (rawPartners is List) {
      for (final item in rawPartners) {
        if (item is! Map) continue;
        final map = Map<String, dynamic>.from(item);
        var shares = map['shareAccesses'];
        List<SchoolShareAccess> shareList;
        if (shares is List && shares.isNotEmpty) {
          shareList = shares
              .whereType<Map>()
              .map((e) => SchoolShareAccess.fromJson(Map<String, dynamic>.from(e)))
              .toList();
        } else {
          shareList = defaultShareAccesses();
        }
        partners.add(SchoolPartner.fromJson(map).copyWith(shareAccesses: shareList));
      }
    }

    final customFields = <SchoolCustomField>[];
    final rawFields = raw['customFields'];
    if (rawFields is List) {
      for (final item in rawFields) {
        if (item is Map) customFields.add(SchoolCustomField.fromJson(Map<String, dynamic>.from(item)));
      }
    }

    final documents = <SchoolDocumentDraft>[];
    final rawDocs = raw['documents'];
    if (rawDocs is List) {
      for (final item in rawDocs) {
        if (item is Map) documents.add(SchoolDocumentDraft.fromJson(Map<String, dynamic>.from(item)));
      }
    }

    final cf = raw['customFieldDraft'];
    final customFieldDraft = cf is Map
        ? SchoolCustomField.fromJson(Map<String, dynamic>.from(cf))
        : const SchoolCustomField(key: '', value: '');

    state = state.copyWith(
      name: (raw['name'] ?? '').toString(),
      schoolType: (raw['schoolType'] ?? 'University').toString(),
      email: (raw['email'] ?? '').toString(),
      logoUrl: (raw['logoUrl'] ?? '').toString(),
      partnerDraft: raw['partnerDraft'] is Map
          ? PartnerDraft.fromJson(Map<String, dynamic>.from(raw['partnerDraft'] as Map))
          : const PartnerDraft(),
      partners: partners,
      customFields: customFields,
      customFieldDraft: customFieldDraft,
      documentDraft: raw['documentDraft'] is Map
          ? SchoolDocumentDraft.fromJson(Map<String, dynamic>.from(raw['documentDraft'] as Map))
          : const SchoolDocumentDraft(),
      documents: documents,
      draftHydrated: true,
    );
  }

  Future<void> _loadOrg() async {
    if (_args.isEdit && (_args.orgId?.isNotEmpty ?? false)) {
      state = state.copyWith(orgId: _args.orgId, orgLoading: false);
      return;
    }
    state = state.copyWith(orgLoading: true, clearSubmitError: true);
    try {
      final orgId = await _api.fetchFirstOrgId();
      state = state.copyWith(orgId: orgId, orgLoading: false);
    } catch (_) {
      state = state.copyWith(
        orgLoading: false,
        submitError: 'Could not load organizations. Check your connection and refresh.',
      );
    }
  }

  Future<void> _persistDraft() async {
    if (_args.isEdit || !state.draftHydrated) return;
    await _draftStorage.write(
      SchoolCreateDraftStorage.draftFromState(
        name: state.name,
        schoolType: state.schoolType,
        email: state.email,
        logoUrl: state.logoUrl,
        partnerDraft: state.partnerDraft,
        customFields: state.customFields,
        customFieldDraft: state.customFieldDraft,
        partners: state.partners,
        documentDraft: state.documentDraft,
        documents: state.documents,
      ),
    );
  }

  void _touch() => Future.microtask(_persistDraft);

  void setName(String v) {
    state = state.copyWith(name: v, clearStepError: true);
    _touch();
  }

  void setSchoolType(String v) {
    state = state.copyWith(schoolType: v, clearStepError: true);
    _touch();
  }

  void setEmail(String v) {
    state = state.copyWith(email: v, clearStepError: true);
    _touch();
  }

  void setLogoUrl(String v) {
    state = state.copyWith(logoUrl: v);
    _touch();
  }

  void setCustomFieldDraftKey(String v) {
    state = state.copyWith(customFieldDraft: state.customFieldDraft.copyWith(key: v));
    _touch();
  }

  void setCustomFieldDraftValue(String v) {
    state = state.copyWith(customFieldDraft: state.customFieldDraft.copyWith(value: v));
    _touch();
  }

  void addCustomField() {
    final key = state.customFieldDraft.key.trim();
    final value = state.customFieldDraft.value.trim();
    if (key.isEmpty || value.isEmpty) return;
    state = state.copyWith(
      customFields: [...state.customFields, SchoolCustomField(key: key, value: value)],
      customFieldDraft: const SchoolCustomField(key: '', value: ''),
    );
    _touch();
  }

  void removeCustomField(int index) {
    state = state.copyWith(
      customFields: [...state.customFields]..removeAt(index),
    );
    _touch();
  }

  void setPartnerDraft(PartnerDraft draft) {
    state = state.copyWith(partnerDraft: draft, clearStepError: true);
    _touch();
  }

  void appendPartnerDraft() {
    final validation = _validation(stepIndex: 1);
    if (!validation.canContinue) return;
    if (state.partnerDraft.fullName.trim().isEmpty) return;

    final next = [
      ...state.partners,
      SchoolPartner(
        fullName: state.partnerDraft.fullName.trim(),
        email: state.partnerDraft.email.trim(),
        ownershipPercentage: parseOwnership(state.partnerDraft.ownershipPercentage).toString(),
        shareAccesses: defaultShareAccesses(),
      ),
    ];
    state = state.copyWith(
      partners: next,
      selectedPartnerIndex: next.length - 1,
      partnerDraft: const PartnerDraft(),
      clearStepError: true,
    );
    _touch();
  }

  void removePartner(int index) {
    final next = [...state.partners]..removeAt(index);
    state = state.copyWith(
      partners: next,
      selectedPartnerIndex: next.isEmpty ? 0 : next.length - 1,
    );
    _touch();
  }

  void addCreatorAsOwner(AuthUser? user) {
    if (user == null) return;
    final email = (user.email ?? '').trim().toLowerCase();
    if (email.isEmpty) return;
    final filtered = state.partners.where((p) => p.email.trim().toLowerCase() != email).toList();
    final total = filtered.fold<double>(0, (s, p) => s + parseOwnership(p.ownershipPercentage));
    final myShare = 100 - total;
    if (myShare < 0.001) {
      state = state.copyWith(partners: filtered);
      _touch();
      return;
    }
    final displayName = user.username.trim().isNotEmpty
        ? user.username.trim()
        : (user.email ?? 'Account owner');
    final next = [
      ...filtered,
      SchoolPartner(
        fullName: displayName,
        email: user.email!.trim(),
        ownershipPercentage: myShare.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), ''),
        shareAccesses: defaultShareAccesses(),
      ),
    ];
    state = state.copyWith(partners: next, selectedPartnerIndex: next.length - 1);
    _touch();
  }

  void selectPartner(int index) {
    state = state.copyWith(selectedPartnerIndex: index);
  }

  void updateShareAccess(int partnerIndex, int accessIndex, String status) {
    final partners = [...state.partners];
    if (partnerIndex < 0 || partnerIndex >= partners.length) return;
    final partner = partners[partnerIndex];
    final accesses = [...partner.shareAccesses];
    if (accessIndex < 0 || accessIndex >= accesses.length) return;
    accesses[accessIndex] = accesses[accessIndex].copyWith(status: status);
    partners[partnerIndex] = partner.copyWith(shareAccesses: accesses);
    state = state.copyWith(partners: partners);
    _touch();
  }

  void setDocumentDraft(SchoolDocumentDraft draft) {
    state = state.copyWith(documentDraft: draft, clearUploadError: true);
    _touch();
  }

  void attachDocument() {
    final title = state.documentDraft.title.trim();
    final url = state.documentDraft.url.trim();
    if (title.isEmpty || url.isEmpty) return;
    state = state.copyWith(
      documents: [
        ...state.documents,
        SchoolDocumentDraft(title: title, url: url),
      ],
      documentDraft: const SchoolDocumentDraft(),
    );
    _touch();
  }

  void removeDocument(int index) {
    state = state.copyWith(documents: [...state.documents]..removeAt(index));
    _touch();
  }

  Future<void> uploadDocumentFile({
    required String filename,
    required String contentType,
    required Uint8List bytes,
  }) async {
    final orgId = state.orgId;
    if (orgId == null || orgId.isEmpty) {
      state = state.copyWith(
        uploadError:
            'No organization yet. Paste a document URL, or create your first school then upload files.',
      );
      return;
    }
    state = state.copyWith(
      uploadingDocument: true,
      documentDraft: state.documentDraft.copyWith(uploadState: DocumentUploadState.uploading),
      clearUploadError: true,
    );
    try {
      final referenceUrl = await _api.uploadSchoolDocumentFile(
        orgId: orgId,
        filename: filename,
        contentType: contentType,
        bytes: bytes,
      );
      state = state.copyWith(
        uploadingDocument: false,
        documentDraft: state.documentDraft.copyWith(
          title: state.documentDraft.title.trim().isEmpty ? filename : state.documentDraft.title,
          url: referenceUrl,
          uploadState: DocumentUploadState.uploaded,
        ),
      );
      _touch();
    } catch (_) {
      state = state.copyWith(
        uploadingDocument: false,
        uploadError: 'Document upload failed. Please retry.',
        documentDraft: state.documentDraft.copyWith(uploadState: DocumentUploadState.error),
      );
    }
  }

  SchoolCreateValidation _validation({int? stepIndex, String? creatorEmail}) {
    return SchoolCreateValidation.forStep(
      stepIndex: stepIndex ?? state.stepIndex,
      name: state.name,
      schoolType: state.schoolType,
      email: state.email,
      partnerDraft: state.partnerDraft,
      partners: state.partners,
      creatorEmail: creatorEmail,
    );
  }

  bool canContinue(String? creatorEmail) => _validation(creatorEmail: creatorEmail).canContinue;

  String? continueHint(String? creatorEmail) => _validation(creatorEmail: creatorEmail).continueHint;

  SchoolCreateValidation currentValidation(String? creatorEmail) =>
      _validation(creatorEmail: creatorEmail);

  void goBack() {
    if (state.stepIndex > 0) {
      state = state.copyWith(stepIndex: state.stepIndex - 1, clearStepError: true);
    }
  }

  void goToPartnerDetail() {
    state = state.copyWith(stepIndex: 1, clearStepError: true);
  }

  void continueStep({required String? creatorEmail}) {
    final validation = _validation(creatorEmail: creatorEmail);
    if (!validation.canContinue) {
      state = state.copyWith(stepValidationError: validation.continueHint);
      return;
    }

    if (state.stepIndex == 1 && state.partnerDraft.fullName.trim().isNotEmpty) {
      appendPartnerDraft();
    }

    if (state.stepIndex == 2 && state.partners.isNotEmpty) {
      final total = state.ownershipTotal;
      if ((total - 100).abs() >= 0.001) {
        state = state.copyWith(
          stepValidationError:
              'Adjust owner shares to total exactly 100% (current: ${total.toStringAsFixed(2).replaceAll(RegExp(r'\.00$'), '')}%).',
        );
        return;
      }
    }

    if (state.stepIndex < 4) {
      state = state.copyWith(stepIndex: state.stepIndex + 1, clearStepError: true);
    }
  }

  Map<String, dynamic> buildPayload() {
    return {
      'name': state.name.trim(),
      'school_type': state.schoolType.trim(),
      if (state.email.trim().isNotEmpty) 'email': state.email.trim(),
      if (state.logoUrl.trim().isNotEmpty) 'logo_url': state.logoUrl.trim(),
      if (state.customFields.isNotEmpty)
        'custom_fields': state.customFields.map((e) => e.toJson()).toList(),
      if (state.partners.isNotEmpty)
        'partners': state.partners.map((e) => e.toJson()).toList(),
      if (state.documents.isNotEmpty)
        'documents': state.documents
            .map((d) => {'title': d.title.trim(), if (d.url.trim().isNotEmpty) 'url': d.url.trim()})
            .toList(),
    };
  }

  Future<bool> submit() async {
    if (state.partners.isNotEmpty && (state.ownershipTotal - 100).abs() >= 0.001) {
      state = state.copyWith(
        stepValidationError: 'Owner shares must total 100% before submitting.',
      );
      return false;
    }

    state = state.copyWith(submitting: true, clearSubmitError: true);
    try {
      if (_args.isEdit) {
        final orgId = _args.orgId ?? state.orgId;
        final schoolId = _args.schoolId;
        if (orgId == null || orgId.isEmpty || schoolId == null || schoolId.isEmpty) {
          state = state.copyWith(
            submitting: false,
            submitError: 'Missing organization or school id.',
          );
          return false;
        }
        await _api.updateSchool(orgId: orgId, schoolId: schoolId, payload: buildPayload());
      } else {
        await _api.createSchoolForMe(buildPayload());
        await _draftStorage.clear();
      }
      state = state.copyWith(submitting: false);
      return true;
    } catch (e) {
      state = state.copyWith(
        submitting: false,
        submitError: _mapSubmitError(e),
      );
      return false;
    }
  }

  String _mapSubmitError(Object e) {
    final msg = e.toString();
    if (msg.contains('403')) {
      return _args.isEdit
          ? 'You don’t have permission to edit this school (school:manage).'
          : 'You don’t have permission to create a school (school:manage).';
    }
    if (msg.contains('401')) {
      return 'Your session expired. Sign in again, then retry.';
    }
    return _args.isEdit
        ? 'Could not update school. Please try again.'
        : 'Could not create school. Please try again.';
  }

  Future<void> clearDraftAndReset() async {
    if (_args.isEdit) return;
    await _draftStorage.clear();
    state = const SchoolCreateState(draftHydrated: true);
    await _loadOrg();
  }
}

final schoolWizardProvider =
    NotifierProvider<SchoolCreateNotifier, SchoolCreateState>(SchoolCreateNotifier.new);

/// Back-compat alias used by step widgets during migration.
final schoolCreateProvider = schoolWizardProvider;
