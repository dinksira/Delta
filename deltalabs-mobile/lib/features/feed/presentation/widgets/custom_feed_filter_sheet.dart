import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/feed/presentation/models/feed_clip_filter_selection.dart';
import 'package:flutter/material.dart';

/// Filter picker for the custom feed tab (content type, topic, course, duration).
class CustomFeedFilterSheet extends StatefulWidget {
  const CustomFeedFilterSheet({
    required this.initial,
    required this.onApply,
    super.key,
  });

  final FeedClipFilterSelection initial;
  final ValueChanged<FeedClipFilterSelection> onApply;

  static Future<void> show(
    BuildContext context, {
    required FeedClipFilterSelection initial,
    required ValueChanged<FeedClipFilterSelection> onApply,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => CustomFeedFilterSheet(initial: initial, onApply: onApply),
    );
  }

  @override
  State<CustomFeedFilterSheet> createState() => _CustomFeedFilterSheetState();
}

class _CustomFeedFilterSheetState extends State<CustomFeedFilterSheet> {
  late FeedClipFilterSelection _selection = widget.initial;

  void _toggleModality(String value) {
    setState(() {
      _selection = FeedClipFilterSelection(
        modality: _selection.modality == value ? null : value,
        hashtag: _selection.hashtag,
        courseCategory: _selection.courseCategory,
        duration: _selection.duration,
      );
    });
  }

  void _toggleCourse(String value) {
    setState(() {
      _selection = FeedClipFilterSelection(
        modality: _selection.modality,
        hashtag: _selection.hashtag,
        courseCategory: _selection.courseCategory == value ? null : value,
        duration: _selection.duration,
      );
    });
  }

  void _toggleDuration(String value) {
    setState(() {
      _selection = FeedClipFilterSelection(
        modality: _selection.modality,
        hashtag: _selection.hashtag,
        courseCategory: _selection.courseCategory,
        duration: _selection.duration == value ? null : value,
      );
    });
  }

  void _toggleHashtag(String value) {
    setState(() {
      _selection = FeedClipFilterSelection(
        modality: _selection.modality,
        hashtag: _selection.hashtag == value ? null : value,
        courseCategory: _selection.courseCategory,
        duration: _selection.duration,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Custom feed filters',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 16),
            _Section(
              title: 'Content type',
              chips: [
                _Chip('All', _selection.modality == null || _selection.modality == 'all',
                    () => _toggleModality('all')),
                _Chip('Video', _selection.modality == 'video', () => _toggleModality('video')),
                _Chip('Audio', _selection.modality == 'audio', () => _toggleModality('audio')),
                _Chip('Simulation', _selection.modality == 'simulation',
                    () => _toggleModality('simulation')),
              ],
            ),
            const SizedBox(height: 14),
            _Section(
              title: 'Topics',
              chips: [
                for (final tag in ['DeltaLabs', 'NeuroTech', 'LabSkills', 'Feed'])
                  _Chip(tag, _selection.hashtag == tag, () => _toggleHashtag(tag)),
              ],
            ),
            const SizedBox(height: 14),
            _Section(
              title: 'Course category',
              chips: [
                _Chip('All', _selection.courseCategory == null || _selection.courseCategory == 'all',
                    () => _toggleCourse('all')),
                _Chip('Research', _selection.courseCategory == 'research',
                    () => _toggleCourse('research')),
                _Chip('Lab', _selection.courseCategory == 'lab', () => _toggleCourse('lab')),
                _Chip('Course', _selection.courseCategory == 'course',
                    () => _toggleCourse('course')),
              ],
            ),
            const SizedBox(height: 14),
            _Section(
              title: 'Duration',
              chips: [
                _Chip('Short', _selection.duration == 'short', () => _toggleDuration('short')),
                _Chip('Medium', _selection.duration == 'medium', () => _toggleDuration('medium')),
                _Chip('Long', _selection.duration == 'long', () => _toggleDuration('long')),
              ],
            ),
            const SizedBox(height: 20),
            FilledButton(
              onPressed: () {
                widget.onApply(_selection);
                Navigator.pop(context);
              },
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Apply filters'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.chips});

  final String title;
  final List<Widget> chips;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(spacing: 8, runSpacing: 8, children: chips),
      ],
    );
  }
}

class _Chip extends StatelessWidget {
  const _Chip(this.label, this.selected, this.onTap);

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: AppColors.primary.withValues(alpha: 0.12),
      checkmarkColor: AppColors.primary,
      labelStyle: TextStyle(
        color: selected ? AppColors.primary : AppColors.textPrimary,
        fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
        fontSize: 13,
      ),
      side: BorderSide(
        color: selected ? AppColors.primary : AppColors.inputBorder,
      ),
    );
  }
}
