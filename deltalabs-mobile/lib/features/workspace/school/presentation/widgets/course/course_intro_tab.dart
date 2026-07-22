import 'package:deltalabs_mobile/core/theme/app_colors.dart';
import 'package:deltalabs_mobile/features/workspace/school/data/models/school_workspace_item_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/course_workspace_constants.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/models/school_course_intro_model.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/providers/school_providers.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/course/course_intro_panels.dart';
import 'package:deltalabs_mobile/features/workspace/school/presentation/widgets/school_state_panel.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Course Intro studio — Direct View publishing UI (TikTok-style for schools).
class CourseIntroTab extends HookConsumerWidget {
  const CourseIntroTab({
    required this.orgId,
    required this.schoolId,
    required this.courseItem,
    required this.canMutate,
    required this.onSaved,
    super.key,
  });

  final String orgId;
  final String schoolId;
  final SchoolWorkspaceItemModel courseItem;
  final bool canMutate;
  final VoidCallback onSaved;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final viewMode = useState(CourseWorkspaceConstants.defaultViewMode);
    final subTab = useState(CourseWorkspaceConstants.defaultIntroSubTab);
    final intro = useState(SchoolCourseIntroModel.fromMetadata(courseItem.metadata));
    final saving = useState(false);
    final uploading = useState(false);

    useEffect(() {
      intro.value = SchoolCourseIntroModel.fromMetadata(courseItem.metadata);
      return null;
    }, [courseItem.updatedAt, courseItem.id]);

    Future<void> persist(SchoolCourseIntroModel next) async {
      if (saving.value) return;
      saving.value = true;
      intro.value = next;
      try {
        final metadata = Map<String, dynamic>.from(courseItem.metadata);
        metadata['courseIntro'] = next.toJson();
        await ref.read(schoolRemoteDataSourceProvider).updateWorkspaceItem(
              orgId: orgId,
              schoolId: schoolId,
              itemId: courseItem.id,
              metadata: metadata,
            );
        onSaved();
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not save course intro'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        saving.value = false;
      }
    }

    SchoolCourseIntroVideoModel? activeVideo() => intro.value.activeVideo;

    Future<void> updateActiveVideo(
      SchoolCourseIntroVideoModel Function(SchoolCourseIntroVideoModel) transform,
    ) async {
      final active = activeVideo();
      if (active == null) return;
      final now = DateTime.now().toIso8601String();
      final updated = transform(active).copyWith(updatedAt: now);
      final videos = intro.value.videos
          .map((v) => v.id == updated.id ? updated : v)
          .toList();
      await persist(intro.value.copyWith(videos: videos));
    }

    Future<void> addVideo() async {
      if (!canMutate) return;
      final now = DateTime.now().toIso8601String();
      final video = SchoolCourseIntroVideoModel(
        id: 'vid_${DateTime.now().millisecondsSinceEpoch}',
        title: 'Intro video ${intro.value.videos.length + 1}',
        createdAt: now,
        updatedAt: now,
      );
      await persist(
        intro.value.copyWith(
          videos: [...intro.value.videos, video],
          activeVideoId: video.id,
        ),
      );
    }

    Future<void> uploadVideo() async {
      if (!canMutate || uploading.value) return;
      final active = activeVideo();
      if (active == null) return;

      final result = await FilePicker.platform.pickFiles(
        type: FileType.video,
        withData: true,
      );
      if (result == null || result.files.isEmpty) return;
      final file = result.files.first;
      final bytes = file.bytes;
      if (bytes == null) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not read selected video file'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
        return;
      }

      uploading.value = true;
      try {
        final mediaId = await ref.read(schoolRemoteDataSourceProvider).uploadCourseIntroMedia(
              orgId: orgId,
              filename: file.name,
              contentType: file.extension != null ? 'video/${file.extension}' : 'video/mp4',
              bytes: bytes,
              publishToFeed: active.publishToFeed,
              caption: active.title.isEmpty ? 'Course intro video' : active.title,
            );
        await updateActiveVideo(
          (v) => v.copyWith(
            mediaId: mediaId,
            label: file.name,
          ),
        );
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Could not upload intro video'),
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } finally {
        uploading.value = false;
      }
    }

    return ListView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 96),
      children: [
        _ViewModeToggle(
          mode: viewMode.value,
          onChanged: (mode) => viewMode.value = mode,
        ),
        const SizedBox(height: 12),
        _IntroSubTabs(
          currentId: subTab.value,
          onChanged: (id) => subTab.value = id,
        ),
        const SizedBox(height: 16),
        if (viewMode.value == 'table')
          const SchoolStatePanel(
            icon: Icons.table_chart_outlined,
            title: 'Management Table',
            message:
                'Management table for course intro studio is reserved for a future structured editor; Direct View is the publishing studio.',
          )
        else
          switch (subTab.value) {
            'about' => CourseIntroAboutPanel(
                about: intro.value.about,
                canMutate: canMutate,
                saving: saving.value,
                onSave: (about) => persist(intro.value.copyWith(about: about)),
              ),
            'related' => CourseIntroRelatedPanel(
                orgId: orgId,
                schoolId: schoolId,
                currentCourseId: courseItem.id,
                relatedCourseIds: intro.value.relatedCourseIds,
                canMutate: canMutate,
                saving: saving.value,
                onChanged: (ids) => persist(intro.value.copyWith(relatedCourseIds: ids)),
              ),
            'reviews' => CourseIntroReviewsPanel(
                intro: intro.value,
                canMutate: canMutate,
                saving: saving.value,
                onAdd: (rating, text) {
                  final review = SchoolCourseReviewModel(
                    id: 'rev_${DateTime.now().millisecondsSinceEpoch}',
                    author: 'You',
                    rating: rating,
                    text: text,
                    createdAt: DateTime.now().toIso8601String(),
                  );
                  persist(
                    intro.value.copyWith(reviews: [...intro.value.reviews, review]),
                  );
                },
                onDelete: (id) {
                  persist(
                    intro.value.copyWith(
                      reviews: intro.value.reviews.where((r) => r.id != id).toList(),
                    ),
                  );
                },
              ),
            'prerequisites' => CourseIntroPrerequisitesPanel(
                prerequisites: intro.value.prerequisites,
                canMutate: canMutate,
                saving: saving.value,
                onSave: (prereqs) =>
                    persist(intro.value.copyWith(prerequisites: prereqs)),
              ),
            'analysis' => CourseIntroAnalysisPanel(
                analysis: intro.value.analysis,
                canMutate: canMutate,
                saving: saving.value,
                onSave: (analysis) => persist(intro.value.copyWith(analysis: analysis)),
              ),
            _ => _IntroStudioPanel(
                intro: intro.value,
                canMutate: canMutate,
                saving: saving.value,
                uploading: uploading.value,
                onSelectVideo: (id) => persist(intro.value.copyWith(activeVideoId: id)),
                onAddVideo: addVideo,
                onUploadVideo: uploadVideo,
                onUpdateActiveVideo: updateActiveVideo,
                onTogglePublishReady: (value) =>
                    persist(intro.value.copyWith(publishReady: value)),
                onPersistComments: (comments) =>
                    persist(intro.value.copyWith(comments: comments)),
              ),
          },
      ],
    );
  }
}

class _IntroStudioPanel extends HookWidget {
  const _IntroStudioPanel({
    required this.intro,
    required this.canMutate,
    required this.saving,
    required this.uploading,
    required this.onSelectVideo,
    required this.onAddVideo,
    required this.onUploadVideo,
    required this.onUpdateActiveVideo,
    required this.onTogglePublishReady,
    required this.onPersistComments,
  });

  final SchoolCourseIntroModel intro;
  final bool canMutate;
  final bool saving;
  final bool uploading;
  final ValueChanged<String> onSelectVideo;
  final VoidCallback onAddVideo;
  final VoidCallback onUploadVideo;
  final Future<void> Function(
    SchoolCourseIntroVideoModel Function(SchoolCourseIntroVideoModel),
  ) onUpdateActiveVideo;
  final ValueChanged<bool> onTogglePublishReady;
  final ValueChanged<List<SchoolCourseIntroCommentModel>> onPersistComments;

  @override
  Widget build(BuildContext context) {
    final active = intro.activeVideo;
    final tagController = useTextEditingController();
    final keyframeController = useTextEditingController(text: active?.keyframeTime ?? '00:00');
    final descriptionController =
        useTextEditingController(text: active?.description ?? '');
    final commentController = useTextEditingController();
    final replyControllers = useState(<String, TextEditingController>{});

    useEffect(() {
      keyframeController.text = active?.keyframeTime ?? '00:00';
      descriptionController.text = active?.description ?? '';
      return null;
    }, [active?.id, active?.keyframeTime, active?.description]);

    void addTag() {
      if (!canMutate || active == null) return;
      final tag = tagController.text.trim();
      if (tag.isEmpty || active.tags.contains(tag)) {
        tagController.clear();
        return;
      }
      tagController.clear();
      onUpdateActiveVideo((v) => v.copyWith(tags: [...v.tags, tag]));
    }

    void addComment() {
      final text = commentController.text.trim();
      if (text.isEmpty) return;
      commentController.clear();
      final comment = SchoolCourseIntroCommentModel(
        id: 'cmt_${DateTime.now().millisecondsSinceEpoch}',
        author: 'You',
        text: text,
        createdAt: DateTime.now().toIso8601String(),
      );
      onPersistComments([...intro.comments, comment]);
    }

    void toggleLike(SchoolCourseIntroCommentModel comment) {
      final liked = !comment.likedByMe;
      var likes = comment.likes;
      var dislikes = comment.dislikes;
      var dislikedByMe = comment.dislikedByMe;
      if (liked) {
        likes += 1;
        if (dislikedByMe) {
          dislikes = (dislikes - 1).clamp(0, 1 << 30);
          dislikedByMe = false;
        }
      } else {
        likes = (likes - 1).clamp(0, 1 << 30);
      }
      onPersistComments(
        intro.comments
            .map(
              (c) => c.id == comment.id
                  ? c.copyWith(
                      likes: likes,
                      dislikes: dislikes,
                      likedByMe: liked,
                      dislikedByMe: dislikedByMe,
                    )
                  : c,
            )
            .toList(),
      );
    }

    void toggleDislike(SchoolCourseIntroCommentModel comment) {
      final disliked = !comment.dislikedByMe;
      var likes = comment.likes;
      var dislikes = comment.dislikes;
      var likedByMe = comment.likedByMe;
      if (disliked) {
        dislikes += 1;
        if (likedByMe) {
          likes = (likes - 1).clamp(0, 1 << 30);
          likedByMe = false;
        }
      } else {
        dislikes = (dislikes - 1).clamp(0, 1 << 30);
      }
      onPersistComments(
        intro.comments
            .map(
              (c) => c.id == comment.id
                  ? c.copyWith(
                      likes: likes,
                      dislikes: dislikes,
                      likedByMe: likedByMe,
                      dislikedByMe: disliked,
                    )
                  : c,
            )
            .toList(),
      );
    }

    void addReply(SchoolCourseIntroCommentModel comment) {
      final controllers = Map<String, TextEditingController>.from(replyControllers.value);
      final controller = controllers.putIfAbsent(
        comment.id,
        () => TextEditingController(),
      );
      replyControllers.value = controllers;
      final text = controller.text.trim();
      if (text.isEmpty) return;
      controller.clear();
      final reply = SchoolCourseIntroReplyModel(
        id: 'rpl_${DateTime.now().millisecondsSinceEpoch}',
        author: 'You',
        text: text,
        createdAt: DateTime.now().toIso8601String(),
      );
      onPersistComments(
        intro.comments
            .map(
              (c) => c.id == comment.id
                  ? c.copyWith(replies: [...c.replies, reply])
                  : c,
            )
            .toList(),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (canMutate)
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text(
              'Mark course intro ready',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            subtitle: const Text(
              'Signals this intro studio is ready for learners.',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
            ),
            value: intro.publishReady,
            activeThumbColor: AppColors.primary,
            onChanged: saving ? null : onTogglePublishReady,
          ),
        const SizedBox(height: 8),
        _VideoListCard(
          videos: intro.videos,
          activeVideoId: active?.id,
          canMutate: canMutate,
          onSelect: onSelectVideo,
          onAdd: onAddVideo,
        ),
        const SizedBox(height: 16),
        if (active == null)
          SchoolStatePanel(
            icon: Icons.videocam_outlined,
            title: 'No intro videos',
            message: canMutate
                ? 'Add an intro video to start the publishing studio.'
                : 'Managers have not published an intro video yet.',
            actionLabel: canMutate ? 'Add video' : null,
            onAction: canMutate ? onAddVideo : null,
          )
        else ...[
          _ActiveVideoEditor(
            video: active,
            canMutate: canMutate,
            saving: saving,
            uploading: uploading,
            tagController: tagController,
            keyframeController: keyframeController,
            descriptionController: descriptionController,
            onUpload: onUploadVideo,
            onAddTag: addTag,
            onRemoveTag: (tag) => onUpdateActiveVideo(
              (v) => v.copyWith(tags: v.tags.where((t) => t != tag).toList()),
            ),
            onTogglePublishToFeed: (value) =>
                onUpdateActiveVideo((v) => v.copyWith(publishToFeed: value)),
            onToggleStatus: (published) => onUpdateActiveVideo(
              (v) => v.copyWith(status: published ? 'published' : 'draft'),
            ),
            onSaveDetails: () => onUpdateActiveVideo(
              (v) => v.copyWith(
                keyframeTime: keyframeController.text.trim().isEmpty
                    ? '00:00'
                    : keyframeController.text.trim(),
                description: descriptionController.text,
              ),
            ),
          ),
          const SizedBox(height: 16),
          _CommentsCard(
            comments: intro.comments,
            commentController: commentController,
            replyControllers: replyControllers.value,
            saving: saving,
            onSubmit: addComment,
            onLike: toggleLike,
            onDislike: toggleDislike,
            onReply: addReply,
            onShowReplyField: (commentId) {
              final controllers =
                  Map<String, TextEditingController>.from(replyControllers.value);
              controllers.putIfAbsent(commentId, TextEditingController.new);
              replyControllers.value = controllers;
            },
          ),
        ],
      ],
    );
  }
}

class _VideoListCard extends StatelessWidget {
  const _VideoListCard({
    required this.videos,
    required this.activeVideoId,
    required this.canMutate,
    required this.onSelect,
    required this.onAdd,
  });

  final List<SchoolCourseIntroVideoModel> videos;
  final String? activeVideoId;
  final bool canMutate;
  final ValueChanged<String> onSelect;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Expanded(
                  child: Text(
                    'Intro videos',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ),
                if (canMutate)
                  TextButton.icon(
                    onPressed: onAdd,
                    icon: const Icon(Icons.add_rounded, size: 18),
                    label: const Text('Add video'),
                  ),
              ],
            ),
            if (videos.isEmpty)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 8),
                child: Text(
                  'No videos yet.',
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                ),
              )
            else
              ...videos.map((video) {
                final selected = video.id == activeVideoId;
                return Padding(
                  padding: const EdgeInsets.only(top: 8),
                  child: Material(
                    color: selected
                        ? AppColors.primary.withValues(alpha: 0.08)
                        : AppColors.surfaceGrey,
                    borderRadius: BorderRadius.circular(12),
                    child: InkWell(
                      onTap: () => onSelect(video.id),
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Row(
                          children: [
                            Icon(
                              Icons.play_circle_outline_rounded,
                              color: selected ? AppColors.primary : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    video.title,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      color: selected
                                          ? AppColors.primary
                                          : AppColors.textPrimary,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    [
                                      video.status,
                                      if (video.hasMedia) 'media ready' else 'pending upload',
                                      if (video.publishToFeed) 'feed',
                                    ].join(' · '),
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (selected)
                              const Icon(Icons.check_circle, color: AppColors.primary, size: 18),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _ActiveVideoEditor extends StatelessWidget {
  const _ActiveVideoEditor({
    required this.video,
    required this.canMutate,
    required this.saving,
    required this.uploading,
    required this.tagController,
    required this.keyframeController,
    required this.descriptionController,
    required this.onUpload,
    required this.onAddTag,
    required this.onRemoveTag,
    required this.onTogglePublishToFeed,
    required this.onToggleStatus,
    required this.onSaveDetails,
  });

  final SchoolCourseIntroVideoModel video;
  final bool canMutate;
  final bool saving;
  final bool uploading;
  final TextEditingController tagController;
  final TextEditingController keyframeController;
  final TextEditingController descriptionController;
  final VoidCallback onUpload;
  final VoidCallback onAddTag;
  final ValueChanged<String> onRemoveTag;
  final ValueChanged<bool> onTogglePublishToFeed;
  final ValueChanged<bool> onToggleStatus;
  final VoidCallback onSaveDetails;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              video.title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            Container(
              height: 160,
              decoration: BoxDecoration(
                color: AppColors.surfaceGrey,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.9)),
              ),
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      video.hasMedia
                          ? Icons.videocam_rounded
                          : Icons.folder_special_outlined,
                      size: 40,
                      color: AppColors.primary.withValues(alpha: 0.85),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      video.hasMedia
                          ? (video.label.isEmpty ? video.mediaId : video.label)
                          : 'No media uploaded yet',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      video.hasMedia
                          ? 'Uploaded · ${video.mediaId}'
                          : 'Pending upload',
                      style: const TextStyle(
                        color: AppColors.textHint,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            if (canMutate) ...[
              const SizedBox(height: 12),
              FilledButton.icon(
                onPressed: uploading || saving ? null : onUpload,
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: Icon(
                  uploading ? Icons.hourglass_top_rounded : Icons.upload_rounded,
                  color: Colors.white,
                ),
                label: Text(
                  uploading ? 'Uploading…' : 'Upload intro video',
                  style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
                ),
              ),
            ],
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Publish to feed (FYP)',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              subtitle: const Text(
                'When feed publishing is enabled later, this intro can appear on student For You pages.',
                style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              value: video.publishToFeed,
              activeThumbColor: AppColors.primary,
              onChanged: canMutate && !saving ? onTogglePublishToFeed : null,
            ),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text(
                'Published',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
              subtitle: Text(
                video.status == 'published' ? 'Visible as published intro' : 'Saved as draft',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
              ),
              value: video.status == 'published',
              activeThumbColor: AppColors.primary,
              onChanged: canMutate && !saving ? onToggleStatus : null,
            ),
            const SizedBox(height: 8),
            TextField(
              controller: tagController,
              enabled: canMutate,
              decoration: courseIntroFieldDecoration(
                hintText: 'Write a tag here...',
                suffixIcon: IconButton(
                  onPressed: canMutate ? onAddTag : null,
                  icon: const Icon(Icons.add_rounded),
                ),
              ),
              onSubmitted: (_) => onAddTag(),
            ),
            if (video.tags.isNotEmpty) ...[
              const SizedBox(height: 10),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  for (final tag in video.tags)
                    InputChip(
                      label: Text(tag),
                      onDeleted: canMutate ? () => onRemoveTag(tag) : null,
                    ),
                ],
              ),
            ],
            const SizedBox(height: 12),
            Row(
              children: [
                const Text(
                  'Keyframe Time:',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 84,
                  child: TextField(
                    controller: keyframeController,
                    enabled: canMutate,
                    textAlign: TextAlign.center,
                    decoration: courseIntroFieldDecoration(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            TextField(
              controller: descriptionController,
              enabled: canMutate,
              minLines: 3,
              maxLines: 5,
              decoration: courseIntroFieldDecoration(
                hintText: 'Describe your video here...',
              ),
            ),
            if (canMutate) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: saving ? null : onSaveDetails,
                  child: Text(saving ? 'Saving…' : 'Save details'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _CommentsCard extends StatelessWidget {
  const _CommentsCard({
    required this.comments,
    required this.commentController,
    required this.replyControllers,
    required this.saving,
    required this.onSubmit,
    required this.onLike,
    required this.onDislike,
    required this.onReply,
    required this.onShowReplyField,
  });

  final List<SchoolCourseIntroCommentModel> comments;
  final TextEditingController commentController;
  final Map<String, TextEditingController> replyControllers;
  final bool saving;
  final VoidCallback onSubmit;
  final ValueChanged<SchoolCourseIntroCommentModel> onLike;
  final ValueChanged<SchoolCourseIntroCommentModel> onDislike;
  final ValueChanged<SchoolCourseIntroCommentModel> onReply;
  final ValueChanged<String> onShowReplyField;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: courseIntroCardDecoration(),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Comments',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 12),
            if (comments.isEmpty)
              const Text(
                'No comments yet. Be the first to leave feedback.',
                style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              )
            else
              ...comments.map((comment) {
                final replyController = replyControllers[comment.id];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      CircleAvatar(
                        radius: 18,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                        child: Text(
                          comment.author.isNotEmpty
                              ? comment.author[0].toUpperCase()
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
                            Text(
                              comment.author,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              comment.text,
                              style: const TextStyle(
                                color: AppColors.textSecondary,
                                height: 1.35,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                _ReactionButton(
                                  icon: comment.likedByMe
                                      ? Icons.thumb_up_alt
                                      : Icons.thumb_up_alt_outlined,
                                  count: comment.likes,
                                  active: comment.likedByMe,
                                  onTap: saving ? null : () => onLike(comment),
                                ),
                                const SizedBox(width: 8),
                                _ReactionButton(
                                  icon: comment.dislikedByMe
                                      ? Icons.thumb_down_alt
                                      : Icons.thumb_down_alt_outlined,
                                  count: comment.dislikes,
                                  active: comment.dislikedByMe,
                                  onTap: saving ? null : () => onDislike(comment),
                                ),
                                const SizedBox(width: 8),
                                TextButton.icon(
                                  onPressed: () => onShowReplyField(comment.id),
                                  icon: const Icon(Icons.reply_rounded, size: 16),
                                  label: const Text('Reply'),
                                  style: TextButton.styleFrom(
                                    visualDensity: VisualDensity.compact,
                                    foregroundColor: AppColors.textSecondary,
                                  ),
                                ),
                              ],
                            ),
                            if (comment.replies.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              ...comment.replies.map(
                                (reply) => Padding(
                                  padding: const EdgeInsets.only(left: 8, bottom: 6),
                                  child: Text(
                                    '${reply.author}: ${reply.text}',
                                    style: const TextStyle(
                                      color: AppColors.textSecondary,
                                      fontSize: 13,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                            if (replyController != null) ...[
                              const SizedBox(height: 6),
                              TextField(
                                controller: replyController,
                                minLines: 1,
                                maxLines: 2,
                                decoration: courseIntroFieldDecoration(
                                  hintText: 'Write a reply…',
                                  suffixIcon: IconButton(
                                    onPressed: saving ? null : () => onReply(comment),
                                    icon: const Icon(
                                      Icons.send_rounded,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                                onSubmitted: (_) => onReply(comment),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
            const SizedBox(height: 8),
            TextField(
              controller: commentController,
              minLines: 2,
              maxLines: 3,
              decoration: courseIntroFieldDecoration(
                hintText: 'Write your comment here...',
                suffixIcon: IconButton(
                  onPressed: saving ? null : onSubmit,
                  icon: const Icon(Icons.send_rounded, color: AppColors.primary),
                ),
              ),
              onSubmitted: (_) => onSubmit(),
            ),
          ],
        ),
      ),
    );
  }
}

class _ReactionButton extends StatelessWidget {
  const _ReactionButton({
    required this.icon,
    required this.count,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final int count;
  final bool active;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
        child: Row(
          children: [
            Icon(
              icon,
              size: 16,
              color: active ? AppColors.primary : AppColors.textHint,
            ),
            if (count > 0) ...[
              const SizedBox(width: 4),
              Text(
                '$count',
                style: TextStyle(
                  fontSize: 12,
                  color: active ? AppColors.primary : AppColors.textHint,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ViewModeToggle extends StatelessWidget {
  const _ViewModeToggle({required this.mode, required this.onChanged});

  final String mode;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.inputBorder.withValues(alpha: 0.8)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ModeChip(
              label: 'Direct View',
              selected: mode == 'direct',
              onTap: () => onChanged('direct'),
            ),
          ),
          Expanded(
            child: _ModeChip(
              label: 'Management Table',
              selected: mode == 'table',
              onTap: () => onChanged('table'),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.surfaceGrey : Colors.transparent,
      borderRadius: BorderRadius.circular(10),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: selected ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }
}

class _IntroSubTabs extends StatelessWidget {
  const _IntroSubTabs({required this.currentId, required this.onChanged});

  final String currentId;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 36,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: CourseWorkspaceConstants.introSubTabs.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final tab = CourseWorkspaceConstants.introSubTabs[index];
          final selected = tab.id == currentId;
          return InkWell(
            onTap: () => onChanged(tab.id),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  tab.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                    color: selected ? AppColors.primary : AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  height: 2,
                  width: 28,
                  color: selected ? AppColors.primary : Colors.transparent,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
