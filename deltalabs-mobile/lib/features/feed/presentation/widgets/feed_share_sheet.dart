import 'package:deltalabs_mobile/core/config/app_config.dart';
import 'package:deltalabs_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/feed/presentation/providers/feed_provider.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

/// TikTok-style share bottom sheet.
class FeedShareSheet extends ConsumerWidget {
  const FeedShareSheet({
    required this.item,
    super.key,
  });

  final FeedItem item;

  static Future<void> show(BuildContext context, FeedItem item) {
    return showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => FeedShareSheet(item: item),
    );
  }

  String get _shareUrl {
    final base = AppConfig.instance.webAppBaseUrl;
    return '$base/?clip=${item.id}';
  }

  Future<void> _handleShareAction(
    BuildContext context,
    WidgetRef ref, {
    required String successLabel,
    required Future<void> Function() beforeRecord,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await beforeRecord();
    } catch (_) {
      if (context.mounted) {
        messenger.showSnackBar(
          const SnackBar(
            content: Text('Something went wrong'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
      return;
    }

    if (!context.mounted) return;
    Navigator.of(context).pop();

    if (!ref.read(isAuthenticatedProvider)) {
      return;
    }

    final error = await ref.read(feedProvider.notifier).recordShare(item.id);
    if (error != null) {
      messenger.showSnackBar(
        SnackBar(content: Text(error), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    messenger.showSnackBar(
      SnackBar(
        content: Text(successLabel),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: const Color(0xFF1A1A1A),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 12, 8, 8),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text(
                        'Share to',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close, color: Colors.white70),
                    ),
                  ],
                ),
              ),
              SizedBox(
                height: 100,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  children: [
                    _ShareTile(
                      label: 'Copy link',
                      color: const Color(0xFF3B82F6),
                      icon: Icons.link_rounded,
                      onTap: () => _handleShareAction(
                        context,
                        ref,
                        successLabel: 'Link copied',
                        beforeRecord: () =>
                            Clipboard.setData(ClipboardData(text: _shareUrl)),
                      ),
                    ),
                    _ShareTile(
                      label: 'Copy',
                      color: const Color(0xFF6366F1),
                      icon: Icons.copy_rounded,
                      onTap: () => _handleShareAction(
                        context,
                        ref,
                        successLabel: 'Copied',
                        beforeRecord: () => Clipboard.setData(
                          ClipboardData(text: item.description ?? item.title),
                        ),
                      ),
                    ),
                    _ShareTile(
                      label: 'Repost',
                      color: const Color(0xFFEAB308),
                      icon: Icons.repeat_rounded,
                      onTap: () => _handleShareAction(
                        context,
                        ref,
                        successLabel: 'Repost recorded',
                        beforeRecord: () async {},
                      ),
                    ),
                    _ShareTile(
                      label: 'Send',
                      color: const Color(0xFFEC4899),
                      icon: Icons.send_rounded,
                      onTap: () => _handleShareAction(
                        context,
                        ref,
                        successLabel: 'Share recorded',
                        beforeRecord: () async {},
                      ),
                    ),
                    _ShareTile(
                      label: 'More',
                      color: const Color(0xFF22D3EE),
                      icon: Icons.more_horiz_rounded,
                      onTap: () => _handleShareAction(
                        context,
                        ref,
                        successLabel: 'Share recorded',
                        beforeRecord: () async {},
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}

class _ShareTile extends StatelessWidget {
  const _ShareTile({
    required this.label,
    required this.color,
    required this.icon,
    required this.onTap,
  });

  final String label;
  final Color color;
  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: SizedBox(
        width: 64,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Column(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                child: Icon(icon, color: Colors.white, size: 22),
              ),
              const SizedBox(height: 8),
              Text(
                label,
                maxLines: 2,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
