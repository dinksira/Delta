import 'package:deltalabs_mobile/features/workspace/school/data/models/school_class_roadmap_model.dart';

enum ClassRoadmapMilestone { completed, current, upcoming }

ClassRoadmapMilestone resolveSectionMilestone({
  required SchoolClassRoadmapSectionModel section,
  required int sectionIndex,
  required SchoolClassRoadmapModel doc,
}) {
  final currentId = doc.currentSectionId ?? (doc.sections.isNotEmpty ? doc.sections.first.id : null);
  if (currentId == null) return ClassRoadmapMilestone.upcoming;
  final currentIndex = doc.sections.indexWhere((s) => s.id == currentId);
  if (currentIndex < 0) {
    return sectionIndex == 0 ? ClassRoadmapMilestone.current : ClassRoadmapMilestone.upcoming;
  }
  if (section.id == currentId) return ClassRoadmapMilestone.current;
  if (sectionIndex < currentIndex) return ClassRoadmapMilestone.completed;
  return ClassRoadmapMilestone.upcoming;
}

bool isContentCurrent({
  required SchoolClassRoadmapContentModel content,
  required SchoolClassRoadmapSectionModel section,
  required SchoolClassRoadmapModel doc,
}) {
  if (doc.currentContentId != null && doc.currentContentId!.isNotEmpty) {
    return content.id == doc.currentContentId;
  }
  if (section.id != doc.currentSectionId) return false;
  for (final c in section.contents) {
    if (c.status != 'completed') return c.id == content.id;
  }
  return false;
}

double computeSpineProgressPercent(SchoolClassRoadmapModel doc) {
  final sections = doc.sections;
  if (sections.isEmpty) return 0;
  final currentId = doc.currentSectionId ?? sections.first.id;
  final currentIndex = sections.indexWhere((s) => s.id == currentId);
  if (currentIndex < 0) return 100 / sections.length;

  final section = sections[currentIndex];
  final contentCount = section.contents.length;
  double fraction;
  if (contentCount > 0 && doc.currentContentId != null) {
    final contentIndex = section.contents.indexWhere((c) => c.id == doc.currentContentId);
    fraction = contentIndex >= 0 ? (contentIndex + 0.5) / contentCount : 0.25;
  } else if (contentCount > 0) {
    final completed = section.contents.where((c) => c.status == 'completed').length;
    fraction = completed / contentCount;
  } else {
    fraction = 0.35;
  }

  final segment = 1 / sections.length;
  final progress = (currentIndex + fraction * segment) / sections.length;
  return (progress * 100).clamp(8.0, 98.0);
}

int countCompletedSections(SchoolClassRoadmapModel doc) {
  final idx = doc.sections.indexWhere((s) => s.id == doc.currentSectionId);
  return idx < 0 ? 0 : idx;
}
