/// Flexible Course Intro studio payload.
///
/// Stored on school workspace item `metadata.courseIntro` until a dedicated
/// course-intro API exists. Shape is versioned so we can migrate to backend
/// collections / FYP feed publishing without rewriting the UI.
///
/// Future FYP path: videos with `publishToFeed: true` + `mediaId` become
/// feed-eligible content (TikTok-style discovery for students/users).
class SchoolCourseIntroModel {
  const SchoolCourseIntroModel({
    this.schemaVersion = 1,
    this.publishReady = false,
    this.videos = const [],
    this.activeVideoId,
    this.comments = const [],
    this.about = const SchoolCourseAboutModel(),
    this.relatedCourseIds = const [],
    this.reviews = const [],
    this.prerequisites = const SchoolCoursePrerequisitesModel(),
    this.analysis = const SchoolCourseAnalysisModel(),
  });

  factory SchoolCourseIntroModel.fromMetadata(Map<String, dynamic> metadata) {
    final raw = metadata['courseIntro'] ?? metadata['course_intro'];
    if (raw is! Map) return const SchoolCourseIntroModel();
    final map = Map<String, dynamic>.from(raw);

    // Migrate legacy flat v0 fields into a single video entry.
    final videosRaw = map['videos'];
    var videos = <SchoolCourseIntroVideoModel>[];
    if (videosRaw is List) {
      videos = videosRaw
          .whereType<Map<dynamic, dynamic>>()
          .map((e) => SchoolCourseIntroVideoModel.fromJson(Map<String, dynamic>.from(e)))
          .toList();
    } else {
      final legacyLabel = (map['videoLabel'] ?? map['video_label'] ?? '').toString();
      final legacyDesc = (map['description'] ?? '').toString();
      final legacyKeyframe = (map['keyframeTime'] ?? map['keyframe_time'] ?? '').toString();
      final legacyTags = map['tags'];
      final hasLegacy = legacyLabel.isNotEmpty ||
          legacyDesc.isNotEmpty ||
          (legacyTags is List && legacyTags.isNotEmpty);
      if (hasLegacy) {
        videos = [
          SchoolCourseIntroVideoModel(
            id: 'vid_legacy',
            title: 'Intro video',
            label: legacyLabel,
            description: legacyDesc,
            keyframeTime: legacyKeyframe.isEmpty ? '00:00' : legacyKeyframe,
            tags: legacyTags is List
                ? legacyTags.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList()
                : const [],
          ),
        ];
      }
    }

    final commentsRaw = map['comments'];
    final reviewsRaw = map['reviews'];
    final relatedRaw = map['relatedCourseIds'] ?? map['related_course_ids'];

    return SchoolCourseIntroModel(
      schemaVersion: (map['schemaVersion'] as num?)?.toInt() ??
          (map['schema_version'] as num?)?.toInt() ??
          1,
      publishReady: map['publishReady'] as bool? ?? map['publish_ready'] as bool? ?? false,
      videos: videos,
      activeVideoId: (map['activeVideoId'] ?? map['active_video_id'])?.toString(),
      comments: commentsRaw is List
          ? commentsRaw
              .whereType<Map<dynamic, dynamic>>()
              .map((e) => SchoolCourseIntroCommentModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      about: SchoolCourseAboutModel.fromJson(map['about']),
      relatedCourseIds: relatedRaw is List
          ? relatedRaw.map((e) => e.toString()).where((e) => e.isNotEmpty).toList()
          : const [],
      reviews: reviewsRaw is List
          ? reviewsRaw
              .whereType<Map<dynamic, dynamic>>()
              .map((e) => SchoolCourseReviewModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
      prerequisites: SchoolCoursePrerequisitesModel.fromJson(
        map['prerequisites'] ?? map['prereqs'],
      ),
      analysis: SchoolCourseAnalysisModel.fromJson(map['analysis']),
    );
  }

  final int schemaVersion;
  final bool publishReady;
  final List<SchoolCourseIntroVideoModel> videos;
  final String? activeVideoId;
  final List<SchoolCourseIntroCommentModel> comments;
  final SchoolCourseAboutModel about;
  final List<String> relatedCourseIds;
  final List<SchoolCourseReviewModel> reviews;
  final SchoolCoursePrerequisitesModel prerequisites;
  final SchoolCourseAnalysisModel analysis;

  SchoolCourseIntroVideoModel? get activeVideo {
    if (videos.isEmpty) return null;
    if (activeVideoId != null) {
      for (final v in videos) {
        if (v.id == activeVideoId) return v;
      }
    }
    return videos.first;
  }

  double get averageRating {
    if (reviews.isEmpty) return 0;
    final sum = reviews.fold<int>(0, (a, r) => a + r.rating);
    return sum / reviews.length;
  }

  Map<String, dynamic> toJson() => {
        'schemaVersion': schemaVersion,
        'publishReady': publishReady,
        'videos': videos.map((v) => v.toJson()).toList(),
        if (activeVideoId != null) 'activeVideoId': activeVideoId,
        'comments': comments.map((c) => c.toJson()).toList(),
        'about': about.toJson(),
        'relatedCourseIds': relatedCourseIds,
        'reviews': reviews.map((r) => r.toJson()).toList(),
        'prerequisites': prerequisites.toJson(),
        'analysis': analysis.toJson(),
      };

  SchoolCourseIntroModel copyWith({
    int? schemaVersion,
    bool? publishReady,
    List<SchoolCourseIntroVideoModel>? videos,
    String? activeVideoId,
    bool clearActiveVideoId = false,
    List<SchoolCourseIntroCommentModel>? comments,
    SchoolCourseAboutModel? about,
    List<String>? relatedCourseIds,
    List<SchoolCourseReviewModel>? reviews,
    SchoolCoursePrerequisitesModel? prerequisites,
    SchoolCourseAnalysisModel? analysis,
  }) {
    return SchoolCourseIntroModel(
      schemaVersion: schemaVersion ?? this.schemaVersion,
      publishReady: publishReady ?? this.publishReady,
      videos: videos ?? this.videos,
      activeVideoId: clearActiveVideoId ? null : (activeVideoId ?? this.activeVideoId),
      comments: comments ?? this.comments,
      about: about ?? this.about,
      relatedCourseIds: relatedCourseIds ?? this.relatedCourseIds,
      reviews: reviews ?? this.reviews,
      prerequisites: prerequisites ?? this.prerequisites,
      analysis: analysis ?? this.analysis,
    );
  }
}

class SchoolCourseIntroVideoModel {
  const SchoolCourseIntroVideoModel({
    required this.id,
    this.mediaId = '',
    this.title = 'Intro video',
    this.label = '',
    this.description = '',
    this.keyframeTime = '00:00',
    this.tags = const [],
    this.status = 'draft',
    this.publishToFeed = false,
    this.createdAt = '',
    this.updatedAt = '',
  });

  factory SchoolCourseIntroVideoModel.fromJson(Map<String, dynamic> json) {
    final tagsRaw = json['tags'];
    return SchoolCourseIntroVideoModel(
      id: (json['id'] ?? '').toString(),
      mediaId: (json['mediaId'] ?? json['media_id'] ?? '').toString(),
      title: (json['title'] ?? 'Intro video').toString(),
      label: (json['label'] ?? '').toString(),
      description: (json['description'] ?? '').toString(),
      keyframeTime: (json['keyframeTime'] ?? json['keyframe_time'] ?? '00:00').toString(),
      tags: tagsRaw is List
          ? tagsRaw.map((e) => e.toString().trim()).where((e) => e.isNotEmpty).toList()
          : const [],
      status: (json['status'] ?? 'draft').toString(),
      publishToFeed:
          json['publishToFeed'] as bool? ?? json['publish_to_feed'] as bool? ?? false,
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      updatedAt: (json['updatedAt'] ?? json['updated_at'] ?? '').toString(),
    );
  }

  final String id;
  final String mediaId;
  final String title;
  final String label;
  final String description;
  final String keyframeTime;
  final List<String> tags;
  final String status;
  final bool publishToFeed;
  final String createdAt;
  final String updatedAt;

  bool get hasMedia => mediaId.trim().isNotEmpty;

  Map<String, dynamic> toJson() => {
        'id': id,
        'mediaId': mediaId,
        'title': title,
        'label': label,
        'description': description,
        'keyframeTime': keyframeTime,
        'tags': tags,
        'status': status,
        'publishToFeed': publishToFeed,
        'createdAt': createdAt,
        'updatedAt': updatedAt,
      };

  SchoolCourseIntroVideoModel copyWith({
    String? mediaId,
    String? title,
    String? label,
    String? description,
    String? keyframeTime,
    List<String>? tags,
    String? status,
    bool? publishToFeed,
    String? updatedAt,
  }) {
    return SchoolCourseIntroVideoModel(
      id: id,
      mediaId: mediaId ?? this.mediaId,
      title: title ?? this.title,
      label: label ?? this.label,
      description: description ?? this.description,
      keyframeTime: keyframeTime ?? this.keyframeTime,
      tags: tags ?? this.tags,
      status: status ?? this.status,
      publishToFeed: publishToFeed ?? this.publishToFeed,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

class SchoolCourseIntroCommentModel {
  const SchoolCourseIntroCommentModel({
    required this.id,
    required this.author,
    required this.text,
    required this.createdAt,
    this.authorUserId = '',
    this.likes = 0,
    this.dislikes = 0,
    this.likedByMe = false,
    this.dislikedByMe = false,
    this.replies = const [],
  });

  factory SchoolCourseIntroCommentModel.fromJson(Map<String, dynamic> json) {
    final repliesRaw = json['replies'];
    return SchoolCourseIntroCommentModel(
      id: (json['id'] ?? '').toString(),
      author: (json['author'] ?? 'Someone').toString(),
      authorUserId: (json['authorUserId'] ?? json['author_user_id'] ?? '').toString(),
      text: (json['text'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
      likes: (json['likes'] as num?)?.toInt() ?? 0,
      dislikes: (json['dislikes'] as num?)?.toInt() ?? 0,
      likedByMe: json['likedByMe'] as bool? ?? json['liked_by_me'] as bool? ?? false,
      dislikedByMe:
          json['dislikedByMe'] as bool? ?? json['disliked_by_me'] as bool? ?? false,
      replies: repliesRaw is List
          ? repliesRaw
              .whereType<Map<dynamic, dynamic>>()
              .map((e) => SchoolCourseIntroReplyModel.fromJson(Map<String, dynamic>.from(e)))
              .toList()
          : const [],
    );
  }

  final String id;
  final String author;
  final String authorUserId;
  final String text;
  final String createdAt;
  final int likes;
  final int dislikes;
  final bool likedByMe;
  final bool dislikedByMe;
  final List<SchoolCourseIntroReplyModel> replies;

  Map<String, dynamic> toJson() => {
        'id': id,
        'author': author,
        'authorUserId': authorUserId,
        'text': text,
        'createdAt': createdAt,
        'likes': likes,
        'dislikes': dislikes,
        'likedByMe': likedByMe,
        'dislikedByMe': dislikedByMe,
        'replies': replies.map((r) => r.toJson()).toList(),
      };

  SchoolCourseIntroCommentModel copyWith({
    int? likes,
    int? dislikes,
    bool? likedByMe,
    bool? dislikedByMe,
    List<SchoolCourseIntroReplyModel>? replies,
  }) {
    return SchoolCourseIntroCommentModel(
      id: id,
      author: author,
      authorUserId: authorUserId,
      text: text,
      createdAt: createdAt,
      likes: likes ?? this.likes,
      dislikes: dislikes ?? this.dislikes,
      likedByMe: likedByMe ?? this.likedByMe,
      dislikedByMe: dislikedByMe ?? this.dislikedByMe,
      replies: replies ?? this.replies,
    );
  }
}

class SchoolCourseIntroReplyModel {
  const SchoolCourseIntroReplyModel({
    required this.id,
    required this.author,
    required this.text,
    required this.createdAt,
  });

  factory SchoolCourseIntroReplyModel.fromJson(Map<String, dynamic> json) {
    return SchoolCourseIntroReplyModel(
      id: (json['id'] ?? '').toString(),
      author: (json['author'] ?? 'Someone').toString(),
      text: (json['text'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
    );
  }

  final String id;
  final String author;
  final String text;
  final String createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'author': author,
        'text': text,
        'createdAt': createdAt,
      };
}

class SchoolCourseAboutModel {
  const SchoolCourseAboutModel({
    this.summary = '',
    this.objectives = const [],
    this.audience = '',
    this.duration = '',
    this.language = '',
  });

  factory SchoolCourseAboutModel.fromJson(Object? raw) {
    if (raw is! Map) return const SchoolCourseAboutModel();
    final objectivesRaw = raw['objectives'];
    return SchoolCourseAboutModel(
      summary: (raw['summary'] ?? '').toString(),
      objectives: objectivesRaw is List
          ? objectivesRaw.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList()
          : const [],
      audience: (raw['audience'] ?? '').toString(),
      duration: (raw['duration'] ?? '').toString(),
      language: (raw['language'] ?? '').toString(),
    );
  }

  final String summary;
  final List<String> objectives;
  final String audience;
  final String duration;
  final String language;

  Map<String, dynamic> toJson() => {
        'summary': summary,
        'objectives': objectives,
        'audience': audience,
        'duration': duration,
        'language': language,
      };

  SchoolCourseAboutModel copyWith({
    String? summary,
    List<String>? objectives,
    String? audience,
    String? duration,
    String? language,
  }) {
    return SchoolCourseAboutModel(
      summary: summary ?? this.summary,
      objectives: objectives ?? this.objectives,
      audience: audience ?? this.audience,
      duration: duration ?? this.duration,
      language: language ?? this.language,
    );
  }
}

class SchoolCourseReviewModel {
  const SchoolCourseReviewModel({
    required this.id,
    required this.author,
    required this.rating,
    required this.text,
    required this.createdAt,
  });

  factory SchoolCourseReviewModel.fromJson(Map<String, dynamic> json) {
    return SchoolCourseReviewModel(
      id: (json['id'] ?? '').toString(),
      author: (json['author'] ?? 'Someone').toString(),
      rating: ((json['rating'] as num?)?.toInt() ?? 5).clamp(1, 5),
      text: (json['text'] ?? '').toString(),
      createdAt: (json['createdAt'] ?? json['created_at'] ?? '').toString(),
    );
  }

  final String id;
  final String author;
  final int rating;
  final String text;
  final String createdAt;

  Map<String, dynamic> toJson() => {
        'id': id,
        'author': author,
        'rating': rating,
        'text': text,
        'createdAt': createdAt,
      };
}

class SchoolCoursePrerequisitesModel {
  const SchoolCoursePrerequisitesModel({
    this.required = const [],
    this.recommended = const [],
    this.materials = const [],
  });

  factory SchoolCoursePrerequisitesModel.fromJson(Object? raw) {
    if (raw is! Map) return const SchoolCoursePrerequisitesModel();
    List<String> parseList(Object? value) {
      if (value is! List) return const [];
      return value.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
    }

    return SchoolCoursePrerequisitesModel(
      required: parseList(raw['required']),
      recommended: parseList(raw['recommended']),
      materials: parseList(raw['materials']),
    );
  }

  final List<String> required;
  final List<String> recommended;
  final List<String> materials;

  Map<String, dynamic> toJson() => {
        'required': required,
        'recommended': recommended,
        'materials': materials,
      };

  SchoolCoursePrerequisitesModel copyWith({
    List<String>? required,
    List<String>? recommended,
    List<String>? materials,
  }) {
    return SchoolCoursePrerequisitesModel(
      required: required ?? this.required,
      recommended: recommended ?? this.recommended,
      materials: materials ?? this.materials,
    );
  }
}

class SchoolCourseAnalysisModel {
  const SchoolCourseAnalysisModel({
    this.notes = '',
    this.strengths = const [],
    this.gaps = const [],
    this.targetCompletionRate,
  });

  factory SchoolCourseAnalysisModel.fromJson(Object? raw) {
    if (raw is! Map) return const SchoolCourseAnalysisModel();
    List<String> parseList(Object? value) {
      if (value is! List) return const [];
      return value.map((e) => e.toString()).where((e) => e.trim().isNotEmpty).toList();
    }

    return SchoolCourseAnalysisModel(
      notes: (raw['notes'] ?? '').toString(),
      strengths: parseList(raw['strengths']),
      gaps: parseList(raw['gaps']),
      targetCompletionRate: (raw['targetCompletionRate'] as num?)?.toDouble() ??
          (raw['target_completion_rate'] as num?)?.toDouble(),
    );
  }

  final String notes;
  final List<String> strengths;
  final List<String> gaps;
  final double? targetCompletionRate;

  Map<String, dynamic> toJson() => {
        'notes': notes,
        'strengths': strengths,
        'gaps': gaps,
        if (targetCompletionRate != null) 'targetCompletionRate': targetCompletionRate,
      };

  SchoolCourseAnalysisModel copyWith({
    String? notes,
    List<String>? strengths,
    List<String>? gaps,
    double? targetCompletionRate,
    bool clearTarget = false,
  }) {
    return SchoolCourseAnalysisModel(
      notes: notes ?? this.notes,
      strengths: strengths ?? this.strengths,
      gaps: gaps ?? this.gaps,
      targetCompletionRate:
          clearTarget ? null : (targetCompletionRate ?? this.targetCompletionRate),
    );
  }
}
