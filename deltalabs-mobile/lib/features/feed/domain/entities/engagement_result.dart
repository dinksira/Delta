/// Server response after like/save toggle.
class EngagementResult {
  const EngagementResult({
    required this.count,
    required this.active,
  });

  final int count;
  final bool active;
}

/// Server response after share.
class ShareResult {
  const ShareResult({required this.count});

  final int count;
}

/// Server response after posting a comment.
class CommentPostResult {
  const CommentPostResult({
    required this.commentId,
    required this.count,
  });

  final String commentId;
  final int count;
}
