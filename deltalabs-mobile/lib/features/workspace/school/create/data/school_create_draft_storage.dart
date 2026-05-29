import 'dart:convert';
import 'dart:io';

import 'package:deltalabs_mobile/features/workspace/school/create/domain/school_create_models.dart';
import 'package:path_provider/path_provider.dart';

/// Persists wizard drafts on disk (avoids [SharedPreferences] channel issues on Android).
class SchoolCreateDraftStorage {
  static const _fileName = 'school_create_wizard_draft.json';

  Future<File> _draftFile() async {
    final dir = await getApplicationDocumentsDirectory();
    return File('${dir.path}/$_fileName');
  }

  Future<Map<String, dynamic>?> read() async {
    try {
      final file = await _draftFile();
      if (!await file.exists()) return null;
      final raw = await file.readAsString();
      if (raw.isEmpty) return null;
      final decoded = jsonDecode(raw);
      if (decoded is Map<String, dynamic>) return decoded;
      if (decoded is Map) return Map<String, dynamic>.from(decoded);
      return null;
    } catch (_) {
      return null;
    }
  }

  Future<void> write(Map<String, dynamic> draft) async {
    try {
      final file = await _draftFile();
      await file.writeAsString(jsonEncode(draft));
    } catch (_) {
      // Draft is best-effort; wizard still works without persistence.
    }
  }

  Future<void> clear() async {
    try {
      final file = await _draftFile();
      if (await file.exists()) {
        await file.delete();
      }
    } catch (_) {}
  }

  static Map<String, dynamic> draftFromState({
    required String name,
    required String schoolType,
    required String email,
    required String logoUrl,
    required PartnerDraft partnerDraft,
    required List<SchoolCustomField> customFields,
    required SchoolCustomField customFieldDraft,
    required List<SchoolPartner> partners,
    required SchoolDocumentDraft documentDraft,
    required List<SchoolDocumentDraft> documents,
  }) {
    return {
      'name': name,
      'schoolType': schoolType,
      'email': email,
      'logoUrl': logoUrl,
      'partnerDraft': partnerDraft.toJson(),
      'customFields': customFields.map((e) => e.toJson()).toList(),
      'customFieldDraft': {'key': customFieldDraft.key, 'value': customFieldDraft.value},
      'partners': partners
          .map(
            (p) => {
              'fullName': p.fullName,
              'email': p.email,
              'ownershipPercentage': p.ownershipPercentage,
              'shareAccesses': p.shareAccesses
                  .map((s) => {'accessName': s.accessName, 'status': s.status})
                  .toList(),
            },
          )
          .toList(),
      'documentDraft': documentDraft.toJson(),
      'documents': documents.map((e) => e.toJson()).toList(),
    };
  }
}
