import 'package:deltalabs_mobile/features/feed/domain/entities/feed_item.dart';
import 'package:deltalabs_mobile/features/feed/presentation/layout/feed_layout.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_action_rail.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_play_pause_overlay.dart';
import 'package:deltalabs_mobile/features/feed/presentation/widgets/feed_video_progress_bar.dart';
import 'package:deltalabs_mobile/shared/widgets/loading/dl_loading_indicator.dart';
import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:video_player/video_player.dart';

/// One full-screen vertical feed clip with overlay UI.
class FeedVideoSlide extends StatefulWidget {
  const FeedVideoSlide({
    required this.item,
    required this.isActive,
    required this.isMuted,
    required this.onLike,
    required this.onComment,
    required this.onSave,
    required this.onShare,
    this.bottomInset,
    super.key,
  });

  final FeedItem item;
  final bool isActive;
  final bool isMuted;
  final VoidCallback onLike;
  final VoidCallback onComment;
  final VoidCallback onSave;
  final VoidCallback onShare;

  /// Extra space above the bottom edge of the slide (e.g. search viewer safe area).
  final double? bottomInset;

  @override
  State<FeedVideoSlide> createState() => _FeedVideoSlideState();
}

class _FeedVideoSlideState extends State<FeedVideoSlide> {
  VideoPlayerController? _controller;
  bool _initialized = false;
  bool _loadFailed = false;
  bool _userPaused = false;
  bool _scrubbing = false;

  Future<void> _probeMediaUrl(String url) async {
    // This runs best-effort and should never crash the UI.
    try {
      final dio = Dio(
        BaseOptions(
          followRedirects: false,
          validateStatus: (_) => true,
          connectTimeout: const Duration(seconds: 10),
          receiveTimeout: const Duration(seconds: 10),
        ),
      );

      Response<dynamic> res;
      try {
        res = await dio.head(url);
      } catch (_) {
        // Some origins don't support HEAD; do a tiny ranged GET.
        res = await dio.get(
          url,
          options: Options(
            responseType: ResponseType.bytes,
            headers: const {'Range': 'bytes=0-0'},
          ),
        );
      }

      final status = res.statusCode;
      final ct = res.headers.value(Headers.contentTypeHeader);
      final len = res.headers.value(Headers.contentLengthHeader);
      final ar = res.headers.value('accept-ranges');
      final loc = res.headers.value('location');

      final probe = [
        if (status != null) 'status=$status',
        if (ct != null) 'content-type=$ct',
        if (len != null) 'len=$len',
        if (ar != null) 'accept-ranges=$ar',
        if (loc != null) 'location=$loc',
      ].join(' | ');

      debugPrint('Video URL probe: $url => $probe');
      // Intentionally not displayed in UI; logs only.
    } catch (e) {
      debugPrint('Video URL probe failed for $url: $e');
    }
  }

  @override
  void didUpdateWidget(FeedVideoSlide oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isActive != oldWidget.isActive) {
      if (!widget.isActive) {
        _userPaused = false;
      }
      _syncPlayback();
    }
    if (widget.isMuted != oldWidget.isMuted) {
      _applyVolume();
    }
    if (widget.item.mediaUrl != oldWidget.item.mediaUrl) {
      _disposeController();
      _initController();
    }
  }

  @override
  void initState() {
    super.initState();
    _initController();
  }

  Future<void> _initController() async {
    final url = widget.item.mediaUrl;
    if (url == null || url.isEmpty) {
      if (mounted) {
        setState(() {
          _loadFailed = true;
        });
      }
      return;
    }

    setState(() {
      _loadFailed = false;
      _initialized = false;
      _userPaused = false;
    });

    // Best-effort: helps distinguish 403/404/redirect/codec issues.
    _probeMediaUrl(url);

    final controller = VideoPlayerController.networkUrl(Uri.parse(url));
    _controller = controller;

    try {
      await controller.initialize();
      if (!mounted) return;
      controller.setLooping(true);
      setState(() {
        _initialized = true;
        _loadFailed = false;
      });
      _applyVolume();
      _syncPlayback();
    } catch (e, st) {
      debugPrint('Video init failed for $url: $e');
      debugPrintStack(stackTrace: st);
      if (mounted) {
        setState(() {
          _initialized = false;
          _loadFailed = true;
        });
      }
    }
  }

  void _applyVolume() {
    _controller?.setVolume(widget.isMuted ? 0 : 1);
  }

  void _syncPlayback() {
    final c = _controller;
    if (c == null || !_initialized) return;
    if (widget.isActive && !_userPaused) {
      c.play();
    } else {
      c.pause();
    }
  }

  void _togglePlayPause() {
    final c = _controller;
    if (c == null || !_initialized) return;

    if (c.value.isPlaying) {
      c.pause();
      setState(() => _userPaused = true);
    } else {
      setState(() => _userPaused = false);
      c.play();
    }
  }

  void _disposeController() {
    _controller?.dispose();
    _controller = null;
    _initialized = false;
  }

  @override
  void dispose() {
    _disposeController();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final safeBottom = MediaQuery.viewPaddingOf(context).bottom;
    final bottom =
        (widget.bottomInset ?? FeedLayout.captionBottomPadding) + safeBottom;
    final showProgress =
        _initialized && _controller != null && widget.isActive;

    return ColoredBox(
      color: Colors.black,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _buildVideo(),
          Positioned(
            left: 0,
            right: 0,
            bottom: bottom,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(child: _buildCaption()),
                    Padding(
                      padding: const EdgeInsets.only(
                        right: FeedLayout.overlayPaddingRight,
                        bottom: 16,
                      ),
                      child: FeedActionRail(
                    likeCount: widget.item.likeCount,
                    commentCount: widget.item.commentCount,
                    isLiked: widget.item.isLiked,
                    isSaved: widget.item.isSaved,
                    onLike: widget.onLike,
                    onComment: widget.onComment,
                    onShare: widget.onShare,
                    onSave: widget.onSave,
                      ),
                    ),
                  ],
                ),
                if (showProgress)
                  Padding(
                    padding: const EdgeInsets.fromLTRB(
                      FeedLayout.overlayPaddingLeft,
                      0,
                      FeedLayout.overlayPaddingRight,
                      0,
                    ),
                    child: FeedVideoProgressBar(
                      controller: _controller!,
                      onDragStateChanged: (dragging) {
                        if (_scrubbing != dragging) {
                          setState(() => _scrubbing = dragging);
                        }
                      },
                    ),
                  ),
              ],
            ),
          ),
          FeedPlayPauseOverlay(
            visible: widget.isActive && _initialized && _userPaused && !_scrubbing,
          ),
        ],
      ),
    );
  }

  Widget _buildVideo() {
    if (_loadFailed) {
      const friendlyMessage = 'Video unavailable right now.\nPlease try again.';
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.videocam_off_outlined,
                size: 48,
                color: Colors.white.withValues(alpha: 0.5),
              ),
              const SizedBox(height: 12),
              Text(
                friendlyMessage,
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white.withValues(alpha: 0.8)),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: _initController,
                style: OutlinedButton.styleFrom(foregroundColor: Colors.white),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }

    if (!_initialized || _controller == null) {
      return const Center(
        child: DlLoadingIndicator(size: DlLoadingSize.medium, onDark: true),
      );
    }

    final size = _controller!.value.size;

    return GestureDetector(
      onTap: _togglePlayPause,
      behavior: HitTestBehavior.opaque,
      child: SizedBox.expand(
        child: FittedBox(
          fit: BoxFit.cover,
          child: SizedBox(
            width: size.width,
            height: size.height,
            child: VideoPlayer(_controller!),
          ),
        ),
      ),
    );
  }

  Widget _buildCaption() {
    final sound = widget.item.soundLabel;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        FeedLayout.overlayPaddingLeft,
        0,
        8,
        4,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            '@${widget.item.authorName.replaceAll(' ', '_').toLowerCase()}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w700,
              shadows: _overlayTextShadow,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            widget.item.description ?? widget.item.title,
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              height: 1.35,
              shadows: _overlayTextShadow,
            ),
          ),
          if (sound != null && sound.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.music_note_rounded, color: Colors.white, size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    sound,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      shadows: _overlayTextShadow,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

}

const _overlayTextShadow = [
  Shadow(color: Colors.black54, blurRadius: 6),
];
