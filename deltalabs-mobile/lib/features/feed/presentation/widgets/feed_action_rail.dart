import 'package:flutter/material.dart';

/// Right-side action buttons on a feed clip (TikTok-style).
class FeedActionRail extends StatelessWidget {
  const FeedActionRail({
    required this.likeCount,
    required this.commentCount,
    required this.isLiked,
    required this.isSaved,
    required this.onLike,
    required this.onComment,
    required this.onShare,
    required this.onSave,
    super.key,
  });

  final int likeCount;
  final int commentCount;
  final bool isLiked;
  final bool isSaved;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onShare;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        _ActionButton(
          icon: isLiked ? Icons.favorite : Icons.favorite_border,
          label: _formatCount(likeCount),
          iconColor: isLiked ? const Color(0xFFFF3B5C) : Colors.white,
          onTap: onLike,
        ),
        const SizedBox(height: 20),
        _ActionButton(
          icon: Icons.mode_comment_outlined,
          label: _formatCount(commentCount),
          onTap: onComment,
        ),
        const SizedBox(height: 20),
        _ActionButton(
          icon: isSaved ? Icons.bookmark : Icons.bookmark_border,
          label: 'Save',
          onTap: onSave,
        ),
        const SizedBox(height: 20),
        _ActionButton(
          icon: Icons.share_rounded,
          label: 'Share',
          onTap: onShare,
        ),
      ],
    );
  }

  static String _formatCount(int n) {
    if (n >= 1_000_000) return '${(n / 1_000_000).toStringAsFixed(1)}M';
    if (n >= 1_000) return '${(n / 1_000).toStringAsFixed(1)}K';
    return n > 0 ? '$n' : '';
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor = Colors.white,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: Column(
        children: [
          Icon(icon, color: iconColor, size: 32, shadows: _iconShadow),
          if (label.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600,
                shadows: _textShadow,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

const _iconShadow = [
  Shadow(color: Colors.black54, blurRadius: 8),
];

const _textShadow = [
  Shadow(color: Colors.black54, blurRadius: 6),
];
