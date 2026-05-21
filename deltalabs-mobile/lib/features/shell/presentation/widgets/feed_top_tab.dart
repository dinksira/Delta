/// Top feed categories (TikTok-style), shown in the shell header.
enum FeedTopTab { video, audio, ai, explore }

extension FeedTopTabX on FeedTopTab {
  String get label {
    switch (this) {
      case FeedTopTab.video:
        return 'Video';
      case FeedTopTab.audio:
        return 'Audio';
      case FeedTopTab.ai:
        return 'AI';
      case FeedTopTab.explore:
        return 'Explore';
    }
  }
}
