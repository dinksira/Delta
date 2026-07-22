import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_course_intro_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

BoxDecoration courseIntroCardDecoration() => BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
    );

InputDecoration courseIntroFieldDecoration({
  String? hintText,
  Widget? suffixIcon,
}) =>
    InputDecoration(
      hintText: hintText,
      filled: true,
      fillColor: AppColors.surfaceGrey,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide.none,
      ),
      suffixIcon: suffixIcon,
    );

/// Reusable chip list with optional add/remove.
class CourseIntroChipList extends HookWidget {
  const CourseIntroChipList({
    required this.label,
    required this.items,
    required this.canEdit,
    required this.onChanged,
    this.hintText = 'Add item…',
    super.key,
  });

  final String label;
  final List<String> items;
  final bool canEdit;
  final ValueChanged<List<String>> onChanged;
  final String hintText;

  @override
  Widget build(BuildContext context) {
    final controller = useTextEditingController();

    void add() {
      final value = controller.text.trim();
      if (value.isEmpty || items.contains(value)) {
        controller.clear();
        return;
      }
      controller.clear();
      onChanged([...items, value]);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        if (canEdit)
          TextField(
            controller: controller,
            decoration: courseIntroFieldDecoration(
              hintText: hintText,
              suffixIcon: IconButton(
                onPressed: add,
                icon: const Icon(Icons.add_rounded),
              ),
            ),
            onSubmitted: (_) => add(),
          ),
        if (items.isNotEmpty) ...[
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              for (final item in items)
                InputChip(
                  label: Text(item),
                  onDeleted: canEdit
                      ? () => onChanged(items.where((e) => e != item).toList())
                      : null,
                ),
            ],
          ),
        ] else if (!canEdit)
          const Text(
            'None listed yet.',
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
      ],
    );
  }
}

class CourseIntroAboutPanel extends HookWidget {
  const CourseIntroAboutPanel({
    required this.about,
    required this.canMutate,
    required this.saving,
    required this.onSave,
    super.key,
  });

  final SchoolCourseAboutModel about;
  final bool canMutate;
  final bool saving;
  final ValueChanged<SchoolCourseAboutModel> onSave;

  @override
  Widget build(BuildContext context) {
    final summary = useTextEditingController(text: about.summary);
    final audience = useTextEditingController(text: about.audience);
    final duration = useTextEditingController(text: about.duration);
    final language = useTextEditingController(text: about.language);
    final objectives = useState(List<String>.from(about.objectives));

    useEffect(() {
      summary.text = about.summary;
      audience.text = about.audience;
      duration.text = about.duration;
      language.text = about.language;
      objectives.value = List<String>.from(about.objectives);
      return null;
    }, [about.summary, about.audience, about.duration, about.language, about.objectives.join('|')]);

    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'About Course',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: summary,
              enabled: canMutate,
              minLines: 3,
              maxLines: 6,
              decoration: courseIntroFieldDecoration(hintText: 'Course summary…'),
            ),
            const SizedBox(height: 12),
            CourseIntroChipList(
              label: 'Learning objectives',
              items: objectives.value,
              canEdit: canMutate,
              hintText: 'Add objective…',
              onChanged: (next) => objectives.value = next,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: audience,
              enabled: canMutate,
              decoration: courseIntroFieldDecoration(hintText: 'Target audience'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: duration,
              enabled: canMutate,
              decoration: courseIntroFieldDecoration(hintText: 'Duration (e.g. 6 weeks)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: language,
              enabled: canMutate,
              decoration: courseIntroFieldDecoration(hintText: 'Language'),
            ),
            if (canMutate) ...[
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: saving
                      ? null
                      : () => onSave(
                            SchoolCourseAboutModel(
                              summary: summary.text.trim(),
                              objectives: objectives.value,
                              audience: audience.text.trim(),
                              duration: duration.text.trim(),
                              language: language.text.trim(),
                            ),
                          ),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: Text(saving ? 'Saving…' : 'Save about'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class CourseIntroRelatedPanel extends HookConsumerWidget {
  const CourseIntroRelatedPanel({
    required this.orgId,
    required this.schoolId,
    required this.currentCourseId,
    required this.relatedCourseIds,
    required this.canMutate,
    required this.saving,
    required this.onChanged,
    super.key,
  });

  final String orgId;
  final String schoolId;
  final String currentCourseId;
  final List<String> relatedCourseIds;
  final bool canMutate;
  final bool saving;
  final ValueChanged<List<String>> onChanged;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final coursesFuture = useMemoized(
      () => ref.read(schoolRemoteDataSourceProvider).fetchWorkspaceItems(
            orgId: orgId,
            schoolId: schoolId,
            type: 'course',
          ),
      [orgId, schoolId],
    );
    final coursesSnap = useFuture(coursesFuture);

    if (coursesSnap.connectionState != ConnectionState.done) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 48),
        child: Center(child: CircularProgressIndicator()),
      );
    }
    if (coursesSnap.hasError) {
      return const SchoolStatePanel(
        icon: Icons.error_outline_rounded,
        title: 'Could not load courses',
        message: 'Check your connection and try again.',
      );
    }

    final courses = (coursesSnap.data ?? [])
        .where((c) => c.id != currentCourseId)
        .toList();
    final selected = relatedCourseIds.toSet();
    final titleById = {for (final c in courses) c.id: c.title};

    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Related Courses',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              canMutate
                  ? 'Select courses to link from this intro.'
                  : 'Courses linked from this intro.',
              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
            ),
            if (selected.isNotEmpty) ...[
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final id in relatedCourseIds)
                    Chip(
                      label: Text(titleById[id] ?? id),
                      backgroundColor: AppColors.primary.withValues(alpha: 0.08),
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            if (courses.isEmpty)
              const SchoolStatePanel(
                icon: Icons.menu_book_outlined,
                title: 'No other courses',
                message: 'Create more courses in this school to link them here.',
              )
            else
              ...courses.map((course) {
                final checked = selected.contains(course.id);
                return CheckboxListTile(
                  value: checked,
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  title: Text(
                    course.title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  subtitle: course.description == null || course.description!.isEmpty
                      ? null
                      : Text(
                          course.description!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                          ),
                        ),
                  onChanged: !canMutate || saving
                      ? null
                      : (value) {
                          final next = List<String>.from(relatedCourseIds);
                          if (value == true) {
                            if (!next.contains(course.id)) next.add(course.id);
                          } else {
                            next.remove(course.id);
                          }
                          onChanged(next);
                        },
                );
              }),
          ],
        ),
      ),
    );
  }
}

class CourseIntroReviewsPanel extends HookWidget {
  const CourseIntroReviewsPanel({
    required this.intro,
    required this.canMutate,
    required this.saving,
    required this.onAdd,
    required this.onDelete,
    super.key,
  });

  final SchoolCourseIntroModel intro;
  final bool canMutate;
  final bool saving;
  final void Function(int rating, String text) onAdd;
  final ValueChanged<String> onDelete;

  @override
  Widget build(BuildContext context) {
    final rating = useState(5);
    final textController = useTextEditingController();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        DecoratedBox(
          decoration: courseIntroCardDecoration(),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Reviews & Rating',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Text(
                      intro.reviews.isEmpty
                          ? '—'
                          : intro.averageRating.toStringAsFixed(1),
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            for (var i = 1; i <= 5; i++)
                              Icon(
                                i <= intro.averageRating.round()
                                    ? Icons.star_rounded
                                    : Icons.star_outline_rounded,
                                size: 20,
                                color: AppColors.primary,
                              ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${intro.reviews.length} review${intro.reviews.length == 1 ? '' : 's'}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        DecoratedBox(
          decoration: courseIntroCardDecoration(),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Text(
                  'Write a review',
                  style: TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    for (var i = 1; i <= 5; i++)
                      IconButton(
                        onPressed: () => rating.value = i,
                        icon: Icon(
                          i <= rating.value
                              ? Icons.star_rounded
                              : Icons.star_outline_rounded,
                          color: AppColors.primary,
                        ),
                      ),
                  ],
                ),
                TextField(
                  controller: textController,
                  minLines: 2,
                  maxLines: 4,
                  decoration: courseIntroFieldDecoration(hintText: 'Share your experience…'),
                ),
                const SizedBox(height: 10),
                Align(
                  alignment: Alignment.centerRight,
                  child: FilledButton(
                    onPressed: saving
                        ? null
                        : () {
                            final text = textController.text.trim();
                            if (text.isEmpty) return;
                            textController.clear();
                            onAdd(rating.value, text);
                          },
                    style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                    child: Text(saving ? 'Saving…' : 'Post review'),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (intro.reviews.isEmpty)
          const SchoolStatePanel(
            icon: Icons.rate_review_outlined,
            title: 'No reviews yet',
            message: 'Be the first to rate this course.',
          )
        else
          DecoratedBox(
            decoration: courseIntroCardDecoration(),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  for (final review in intro.reviews) ...[
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                          child: Text(
                            review.author.isNotEmpty
                                ? review.author[0].toUpperCase()
                                : '?',
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      review.author,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                  if (canMutate)
                                    IconButton(
                                      onPressed: saving ? null : () => onDelete(review.id),
                                      icon: const Icon(
                                        Icons.delete_outline_rounded,
                                        size: 20,
                                        color: AppColors.textHint,
                                      ),
                                    ),
                                ],
                              ),
                              Row(
                                children: [
                                  for (var i = 1; i <= 5; i++)
                                    Icon(
                                      i <= review.rating
                                          ? Icons.star_rounded
                                          : Icons.star_outline_rounded,
                                      size: 16,
                                      color: AppColors.primary,
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                review.text,
                                style: const TextStyle(
                                  color: AppColors.textSecondary,
                                  height: 1.35,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    if (review != intro.reviews.last)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 12),
                        child: Divider(height: 1, color: AppColors.divider),
                      ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
}

class CourseIntroPrerequisitesPanel extends HookWidget {
  const CourseIntroPrerequisitesPanel({
    required this.prerequisites,
    required this.canMutate,
    required this.saving,
    required this.onSave,
    super.key,
  });

  final SchoolCoursePrerequisitesModel prerequisites;
  final bool canMutate;
  final bool saving;
  final ValueChanged<SchoolCoursePrerequisitesModel> onSave;

  @override
  Widget build(BuildContext context) {
    final requiredItems = useState(List<String>.from(prerequisites.required));
    final recommended = useState(List<String>.from(prerequisites.recommended));
    final materials = useState(List<String>.from(prerequisites.materials));

    useEffect(() {
      requiredItems.value = List<String>.from(prerequisites.required);
      recommended.value = List<String>.from(prerequisites.recommended);
      materials.value = List<String>.from(prerequisites.materials);
      return null;
    }, [
      prerequisites.required.join('|'),
      prerequisites.recommended.join('|'),
      prerequisites.materials.join('|'),
    ]);

    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Prerequisites & Requirements',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 14),
            CourseIntroChipList(
              label: 'Required',
              items: requiredItems.value,
              canEdit: canMutate,
              hintText: 'Add required prerequisite…',
              onChanged: (next) => requiredItems.value = next,
            ),
            const SizedBox(height: 14),
            CourseIntroChipList(
              label: 'Recommended',
              items: recommended.value,
              canEdit: canMutate,
              hintText: 'Add recommended item…',
              onChanged: (next) => recommended.value = next,
            ),
            const SizedBox(height: 14),
            CourseIntroChipList(
              label: 'Materials',
              items: materials.value,
              canEdit: canMutate,
              hintText: 'Add material…',
              onChanged: (next) => materials.value = next,
            ),
            if (canMutate) ...[
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: saving
                      ? null
                      : () => onSave(
                            SchoolCoursePrerequisitesModel(
                              required: requiredItems.value,
                              recommended: recommended.value,
                              materials: materials.value,
                            ),
                          ),
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: Text(saving ? 'Saving…' : 'Save prerequisites'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class CourseIntroAnalysisPanel extends HookWidget {
  const CourseIntroAnalysisPanel({
    required this.analysis,
    required this.canMutate,
    required this.saving,
    required this.onSave,
    super.key,
  });

  final SchoolCourseAnalysisModel analysis;
  final bool canMutate;
  final bool saving;
  final ValueChanged<SchoolCourseAnalysisModel> onSave;

  @override
  Widget build(BuildContext context) {
    final notes = useTextEditingController(text: analysis.notes);
    final rateController = useTextEditingController(
      text: analysis.targetCompletionRate?.toStringAsFixed(0) ?? '',
    );
    final strengths = useState(List<String>.from(analysis.strengths));
    final gaps = useState(List<String>.from(analysis.gaps));

    useEffect(() {
      notes.text = analysis.notes;
      rateController.text = analysis.targetCompletionRate?.toStringAsFixed(0) ?? '';
      strengths.value = List<String>.from(analysis.strengths);
      gaps.value = List<String>.from(analysis.gaps);
      return null;
    }, [
      analysis.notes,
      analysis.targetCompletionRate,
      analysis.strengths.join('|'),
      analysis.gaps.join('|'),
    ]);

    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Course Analysis',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notes,
              enabled: canMutate,
              minLines: 3,
              maxLines: 6,
              decoration: courseIntroFieldDecoration(hintText: 'Analysis notes…'),
            ),
            const SizedBox(height: 12),
            CourseIntroChipList(
              label: 'Strengths',
              items: strengths.value,
              canEdit: canMutate,
              hintText: 'Add strength…',
              onChanged: (next) => strengths.value = next,
            ),
            const SizedBox(height: 12),
            CourseIntroChipList(
              label: 'Gaps',
              items: gaps.value,
              canEdit: canMutate,
              hintText: 'Add gap…',
              onChanged: (next) => gaps.value = next,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: rateController,
              enabled: canMutate,
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9.]')),
              ],
              decoration: courseIntroFieldDecoration(
                hintText: 'Target completion rate (0–100)',
              ),
            ),
            if (canMutate) ...[
              const SizedBox(height: 14),
              Align(
                alignment: Alignment.centerRight,
                child: FilledButton(
                  onPressed: saving
                      ? null
                      : () {
                          final raw = rateController.text.trim();
                          double? rate;
                          if (raw.isNotEmpty) {
                            rate = double.tryParse(raw)?.clamp(0, 100);
                          }
                          onSave(
                            SchoolCourseAnalysisModel(
                              notes: notes.text.trim(),
                              strengths: strengths.value,
                              gaps: gaps.value,
                              targetCompletionRate: rate,
                            ),
                          );
                        },
                  style: FilledButton.styleFrom(backgroundColor: AppColors.primary),
                  child: Text(saving ? 'Saving…' : 'Save analysis'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
